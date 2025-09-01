// layout/customer/CustomerHeader.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Phone, Video, Search, Info, Users, FileText } from "lucide-react"
import { useCustomerStore } from "@/store/customerStore"
import type { Contact, ChatGroup, Conversation } from "@/types/customer.types"
import { useVideoCallContext } from "@/contexts/VideoCallContext"
import OutgoingCallModal from "@/components/providers/Video/OutgoingCallModal"
import IncomingCallModal from "@/components/providers/Video/IncomingCallModal"
import { GroupInfoModal } from "@/components/features/groups/GroupInfoModal"
import { getGroupDetails } from "@/lib/customer-api-client"
import { toast } from "sonner"

export function CustomerHeader() {
    const router = useRouter()
    const { activeChatId, activeChatType, contacts, conversations, groups, myGroups, toggleSearch, toggleProfile } = useCustomerStore()
    const [groupDetails, setGroupDetails] = useState<any>(null)
    const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false)
    const videoCallContext = useVideoCallContext()



    const getActiveChat = () => {
        if (!activeChatId || !activeChatType) return null

        if (activeChatType === "direct") {
            // Tìm conversation trong conversations array
            return conversations.find((conv) => conv.conversationId.toString() === activeChatId)
        } else {
            return myGroups.find((group) => group.id === activeChatId)
        }
    }

    const activeChat = getActiveChat()

    const isDirectChat = activeChatType === "direct"
    const conversation = isDirectChat ? (activeChat as Conversation) : null
    const group = !isDirectChat ? (activeChat as ChatGroup) : null

    // Load group details when active group chat changes
    useEffect(() => {
        if (activeChatId && activeChatType === 'group' && group) {
            // Import getGroupDetails dynamically to avoid circular dependency
            import('@/lib/customer-api-client').then(({ getGroupDetails }) => {
                getGroupDetails(activeChatId).then(response => {
                    if (response.success) {
                        setGroupDetails(response.data)
                    }
                }).catch(error => {
                    // Silently handle error
                })
            })
        }
    }, [activeChatId, activeChatType, group])



    const handleVideoCall = () => {
        if (conversation && conversation.conversationId) {
            // Gọi API để bắt đầu cuộc gọi video với conversationId thực tế
            videoCallContext.startOutgoingCall(
                conversation.displayName || "Unknown",
                conversation.conversationId,
                conversation.avatarUrl
            )
        }
    }

    const handlePhoneCall = () => {
        if (conversation) {
            // TODO: Implement phone call functionality
        }
    }

    return (
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Avatar className="h-14 w-14 ring-4 ring-[#ad46ff]/10 shadow-xl transition-all duration-300 hover:ring-[#ad46ff]/30 hover:scale-105">
                        <AvatarImage src={isDirectChat ? (conversation?.avatarUrl || undefined) : (group?.avatarUrl || undefined)} />
                        <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white font-bold text-xl">
                            {isDirectChat
                                ? (conversation?.displayName
                                    ?.split(" ")
                                    ?.map((n: string) => n[0])
                                    ?.join("") || "U")
                                : (group?.name
                                    ?.split(" ")
                                    ?.map((n: string) => n[0])
                                    ?.join("") || "G")}
                        </AvatarFallback>
                    </Avatar>
                    {isDirectChat && conversation && (
                        <div className="absolute -bottom-2 -right-2 h-5 w-5 bg-green-500 rounded-full border-4 border-white dark:border-gray-950 shadow-xl" />
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {isDirectChat ? (conversation?.displayName || "Unknown") : (group?.name || "Unknown Group")}
                        </h3>

                        {!isDirectChat && group && (
                            <Badge variant="outline" className="text-xs border-[#1447e6] text-[#1447e6] bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 font-bold rounded-full">
                                <Users className="h-3 w-3 mr-1.5" />
                                {groupDetails?.memberCount || group.memberCount || 0} thành viên
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                        {isDirectChat ? (
                            <span className="font-semibold">💬 Tin nhắn trực tiếp</span>
                        ) : (
                            <>
                                <span className="font-semibold">💬 Nhóm chat</span>
                                <span className="text-gray-400 dark:text-gray-500">•</span>
                                <span className="truncate max-w-xs">
                                    {(() => {
                                        const description = groupDetails?.description || group?.description;
                                        if (!description || description.trim() === '' || description === 'string') {
                                            return 'Hãy thêm mô tả nhóm của bạn nào!';
                                        }
                                        return description;
                                    })()}
                                </span>
                                {(groupDetails?.groupType || group?.isPrivate !== undefined) && (
                                    <>
                                        <span className="text-gray-400 dark:text-gray-500">•</span>
                                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                            {groupDetails?.groupType === "Private" || group?.isPrivate ? "🔒 Riêng tư" : "🌐 Công khai"}
                                        </Badge>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSearch}
                    className="h-12 w-12 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-[#ad46ff] hover:text-white transition-all duration-300 shadow-md hover:shadow-lg"
                    title="Tìm kiếm"
                >
                    <Search className="h-6 w-6" />
                </Button>

                {/* Icon đăng bài - Chỉ hiển thị cho nhóm chat */}
                {!isDirectChat && group && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {

                        }}
                        className="h-12 w-12 rounded-2xl bg-gradient-to-r from-[#ad46ff]/10 to-[#1447e6]/10 hover:from-[#ad46ff]/20 hover:to-[#1447e6]/20 text-[#ad46ff] hover:text-[#ad46ff]/80 transition-all duration-300 shadow-md hover:shadow-lg border border-[#ad46ff]/20 hover:border-[#ad46ff]/40"
                        title="Bài đăng"
                    >
                        <FileText className="h-6 w-6" />
                    </Button>
                )}

                {isDirectChat && conversation && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handlePhoneCall}
                            className="h-12 w-12 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-green-500 hover:text-white transition-all duration-300 shadow-md hover:shadow-lg"
                            title="Gọi điện thoại"
                        >
                            <Phone className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleVideoCall}
                            className="h-12 w-12 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-[#1447e6] hover:text-white transition-all duration-300 shadow-md hover:shadow-lg"
                            title="Gọi video"
                        >
                            <Video className="h-6 w-6" />
                        </Button>
                    </>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                        if (isDirectChat) {
                            toggleProfile();
                        } else if (group?.id) {
                            try {
                                const response = await getGroupDetails(group.id);
                                if (response.success) {
                                    setGroupDetails(response.data);
                                    setIsGroupInfoOpen(true);
                                } else {
                                    toast.error("Không thể tải thông tin nhóm");
                                }
                            } catch (error) {
                                console.error("Error fetching group details:", error);
                                toast.error("Có lỗi xảy ra khi tải thông tin nhóm");
                            }
                        }
                    }}
                    className="h-12 w-12 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-[#ad46ff] hover:text-white transition-all duration-300 shadow-md hover:shadow-lg"
                    title={isDirectChat ? "Thông tin" : "Thông tin nhóm"}
                >
                    <Info className="h-6 w-6" />
                </Button>
            </div>

            {/* Video Call Modals */}
            <OutgoingCallModal
                isOpen={videoCallContext.isOutgoingCallOpen}
                onClose={videoCallContext.closeModals}
                recipientName={videoCallContext.recipientName}
                recipientAvatar={videoCallContext.recipientAvatar}
                onCancelCall={videoCallContext.cancelCall}
                isConnecting={videoCallContext.isConnecting}
                error={videoCallContext.error}
                sessionId={videoCallContext.sessionId}
                onRetry={videoCallContext.retryOutgoingCall}
            />

            <IncomingCallModal
                isOpen={videoCallContext.isIncomingCallOpen}
                onClose={videoCallContext.closeModals}
                callerName={videoCallContext.callerName}
                callerAvatar={videoCallContext.callerAvatar}
                onAcceptCall={videoCallContext.acceptCall}
                onRejectCall={videoCallContext.rejectCall}
                isConnecting={videoCallContext.isConnecting}
                error={videoCallContext.error}
                sessionId={videoCallContext.sessionId}
            />

            {/* Group Info Modal */}
            <GroupInfoModal
                isOpen={isGroupInfoOpen}
                onClose={() => setIsGroupInfoOpen(false)}
                group={groupDetails}
            />
        </div>
    )
}
