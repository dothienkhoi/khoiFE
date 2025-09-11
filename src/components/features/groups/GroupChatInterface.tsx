"use client";

import { useState, useCallback, useEffect } from "react";
import { MessageCircle, Search, Phone, Video, Users, Settings, Lock, Globe, Info, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageList } from "../chat/MessageList";
import { ChatInput } from "../chat/ChatInput";
import { ReplyPreview } from "../boback/ReplyPreview";
import { useCustomerStore } from "@/store/customerStore";
import { useAuthStore } from "@/store/authStore";
import { sendGroupMessage, uploadFilesToGroup, getGroupDetails } from "@/lib/customer-api-client";
import { Message } from "@/types/customer.types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useChatHub } from "@/components/providers/ChatHubProvider";
import { getMessagePreview } from "@/lib/utils/messageUtils";
import { QuickGroupDialog } from "./QuickGroupDialog";
import { ExploreGroupsPanel } from "./ExploreGroupsPanel";

interface GroupChatInterfaceProps {
    groupId?: string;
    conversationId?: number;
    groupName?: string;
    groupAvatar?: string;
    groupType?: "Public" | "Private" | "Community";
    memberCount?: number;
    description?: string;
    onBackToExplore?: () => void;
    onGroupLeft?: () => void; // Callback khi rời khỏi nhóm
}

export function GroupChatInterface({ groupId, conversationId, groupName, groupAvatar, groupType, memberCount, description, onBackToExplore, onGroupLeft }: GroupChatInterfaceProps) {
    const { addMessage, updateMessage, updateConversation } = useCustomerStore();
    const { user: currentUser } = useAuthStore();
    const { isConnected: isChatHubConnected } = useChatHub();

    const [isUploading, setIsUploading] = useState(false);
    const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [displayMemberCount, setDisplayMemberCount] = useState<number | undefined>(memberCount);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [showExplore, setShowExplore] = useState(false);

    // Local state for group info that can be updated in real-time
    const [currentGroupName, setCurrentGroupName] = useState(groupName);
    const [currentDescription, setCurrentDescription] = useState(description);

    const actualConversationId = conversationId || (groupId ? Number(groupId) : null);

    // When the selected group changes (from sidebar), exit Explore view and update local state
    useEffect(() => {
        setShowExplore(false);
        setCurrentGroupName(groupName);
        setCurrentDescription(description);
    }, [groupId, conversationId, groupName, description]);

    // Live update header info when group info changes elsewhere
    useEffect(() => {
        const handler = (event: CustomEvent) => {
            const { groupId: changedId, groupName: newName, description: newDesc, avatarUrl: newAvatar } = event.detail || {};
            if (!groupId || changedId !== groupId) return;
            if (newName) {
                setCurrentGroupName(newName);
            }
            if (newDesc !== undefined) {
                setCurrentDescription(newDesc);
            }
            // Note: We don't update groupAvatar here as it's passed as prop from parent
            // The parent (GroupsPage) should handle avatar updates through its state
        };
        window.addEventListener('groupInfoUpdated', handler as EventListener);
        return () => window.removeEventListener('groupInfoUpdated', handler as EventListener);
    }, [groupId]);

    // Reset unread count when entering group chat
    const resetUnreadCount = () => {
        if (actualConversationId) {
            window.dispatchEvent(new CustomEvent('resetGroupUnreadCount', {
                detail: { conversationId: actualConversationId }
            }));
        }
    };

    // Reset unread count when component mounts
    useEffect(() => {
        if (actualConversationId) {
            resetUnreadCount();
        }
    }, [actualConversationId]);

    // Enrich member count from group details if missing or equal to 1 (fallback)
    useEffect(() => {
        const fetchMemberCount = async () => {
            if (!groupId) return;
            const isGuid = /^[0-9a-fA-F-]{36}$/.test(groupId);
            if (!isGuid) return;
            if (typeof memberCount === 'number' && memberCount > 1) {
                setDisplayMemberCount(memberCount);
                return;
            }
            try {
                const res = await getGroupDetails(groupId);
                if (res?.success && typeof res.data?.memberCount === 'number') {
                    setDisplayMemberCount(res.data.memberCount);
                }
            } catch (_) {
                // ignore
            }
        };
        fetchMemberCount();
    }, [groupId, memberCount]);

    // Generate default description based on group type
    const getDefaultDescription = (groupType?: string, groupName?: string): string => {
        const name = groupName || "Nhóm";

        switch (groupType) {
            case "Private":
                return `Chia sẻ thông tin nội bộ và trò chuyện an toàn`;
            case "Public":
                return `Kết nối và chia sẻ với cộng đồng rộng lớn`;
            case "Community":
                return `Nơi giao lưu và học hỏi từ nhiều thành viên`;
            default:
                return `Nơi chia sẻ ý tưởng và kết nối với bạn bè`;
        }
    };

    // Get group type display info
    const getGroupTypeInfo = (groupType?: string) => {
        switch (groupType) {
            case "Private":
                return {
                    label: "Riêng tư",
                    icon: Lock,
                    color: "bg-[#ad46ff]",
                    textColor: "text-[#ad46ff]",
                    bgColor: "bg-[#ad46ff]/10"
                };
            case "Public":
            default:
                return {
                    label: "Công khai",
                    icon: Globe,
                    color: "bg-[#1447e6]",
                    textColor: "text-[#1447e6]",
                    bgColor: "bg-[#1447e6]/10"
                };
        }
    };

    // Handle sending text message
    const handleSendText = useCallback(async (content: string, replyTo?: Message) => {
        if (!actualConversationId) return;

        try {
            // Create optimistic message first
            const optimisticMessage: Message = {
                id: `temp-${Date.now()}`,
                conversationId: actualConversationId!,
                content,
                messageType: 'Text',
                sender: {
                    userId: currentUser?.id || 'current-user',
                    displayName: currentUser?.fullName || 'Bạn',
                    avatarUrl: currentUser?.avatarUrl || null
                },
                sentAt: new Date().toISOString(),
                isDeleted: false,
                attachments: [],
                reactions: [],
                parentMessageId: replyTo?.id || null,
                parentMessage: replyTo ? {
                    senderName: replyTo.sender.displayName,
                    contentSnippet: replyTo.content,
                    messageType: replyTo.messageType,
                    parentMessageId: replyTo.id
                } : null
            };

            // Add optimistic message to UI immediately
            addMessage(actualConversationId!, optimisticMessage);

            // Update conversation preview immediately for real-time display
            updateConversation(actualConversationId!, {
                lastMessagePreview: optimisticMessage.content,
                lastMessageTimestamp: optimisticMessage.sentAt,
                lastMessageType: optimisticMessage.messageType
            });

            // Send message via API
            const response = await sendGroupMessage(actualConversationId!, {
                content,
                parentMessageId: replyTo?.id || undefined
            });

            if (response.success && response.data) {
                // Replace optimistic message with real message from API
                const realMessage = response.data as Message;

                // Update the optimistic message with real data
                updateMessage(actualConversationId!, optimisticMessage.id, {
                    id: realMessage.id,
                    sentAt: realMessage.sentAt,
                    sender: realMessage.sender,
                    parentMessage: realMessage.parentMessage ? {
                        ...realMessage.parentMessage,
                        parentMessageId: realMessage.parentMessageId
                    } : null,
                    // Keep other fields from optimistic message
                });

                // Clear reply state after successful send
                if (replyTo) {
                    setReplyToMessage(null);
                }
            } else {
                // If API call failed, show error
                toast.error(response.message || 'Không thể gửi tin nhắn');
            }
        } catch (error) {
            console.error('Error sending text message:', error);
            toast.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
        }
    }, [actualConversationId, addMessage, updateMessage, currentUser, setReplyToMessage]);

    // Handle sending files
    const handleSendFiles = useCallback(async () => {
        if (!actualConversationId) return;

        setIsUploading(true);

        try {
            // TODO: File upload is handled in ChatInput component
            // This function is called when type === 'files' but ChatInput handles the actual upload
            // We just need to show loading state here
        } catch (err) {
            toast.error('Không thể gửi file. Vui lòng thử lại.');
        } finally {
            setIsUploading(false);
        }
    }, [actualConversationId]);

    // Handle message input
    const handleMessageInput = useCallback((content: string, type: string, replyTo?: Message) => {
        if (type === 'text' && content.trim()) {
            handleSendText(content.trim(), replyTo);
        } else if (type === 'files') {
            handleSendFiles();
        }
    }, [handleSendText, handleSendFiles]);

    // Reset explore mode when group changes
    useEffect(() => {
        setShowExplore(false);
    }, [groupId]);

    // Show Explore when toggled
    // Explore view removed

    // Handle group join callback
    const handleGroupJoin = useCallback((joinedGroupId: string) => {
        console.log(`🎉 Group joined: ${joinedGroupId}`);
        // Trigger refresh of group list in sidebar
        // This will be handled by the parent component
        if (onBackToExplore) {
            // Small delay to ensure API has processed the join
            setTimeout(() => {
                onBackToExplore();
            }, 500);
        }
    }, [onBackToExplore]);

    // If no group is selected, render empty state (no welcome screen)
    if (showExplore) {
        return <ExploreGroupsPanel onJoin={handleGroupJoin} />;
    }

    if (!groupId || !currentGroupName) {
        return <ExploreGroupsPanel onJoin={handleGroupJoin} />;
    }

    const groupTypeInfo = getGroupTypeInfo(groupType);
    const TypeIcon = groupTypeInfo.icon;

    return (
        <>
            <div className="flex-1 flex flex-col h-full">
                {/* Group Chat Header */}
                <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { onBackToExplore?.(); setShowExplore(true); }} title="Quay lại Khám Phá">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={groupAvatar} />
                                <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white font-semibold">
                                    {currentGroupName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="font-semibold text-gray-900 dark:text-white">{currentGroupName}</h2>
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            "text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1",
                                            groupTypeInfo.bgColor,
                                            groupTypeInfo.textColor
                                        )}
                                    >
                                        <TypeIcon className="w-3 h-3" />
                                        {groupTypeInfo.label}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {(typeof displayMemberCount === 'number' && displayMemberCount > 0 ? displayMemberCount : 1)} thành viên
                                    </span>
                                    <span>•</span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                        {currentDescription || getDefaultDescription(groupType, currentGroupName)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Search className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Phone className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Video className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setIsInfoOpen(true)} title="Thông tin nhóm">
                                <Info className="h-4 w-4" />
                            </Button>
                            {/* Settings removed */}
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-hidden min-h-0">
                    <MessageList
                        conversationId={actualConversationId!}
                        partnerName={currentGroupName}
                        partnerAvatar={groupAvatar}
                        onReplyToMessage={setReplyToMessage}
                        chatType="group"
                    />
                </div>

                {/* Message input */}
                <div>
                    <ChatInput
                        onSendMessage={handleMessageInput}
                        conversationId={actualConversationId!}
                        disabled={isUploading}
                        placeholder="Nhập tin nhắn..."
                        replyTo={replyToMessage}
                        onCancelReply={() => setReplyToMessage(null)}
                        groupId={groupId}
                    />
                </div>
            </div>
            <QuickGroupDialog
                open={isInfoOpen}
                onOpenChange={setIsInfoOpen}
                group={{
                    groupId: groupId!,
                    groupName: currentGroupName || "Nhóm",
                    description: currentDescription,
                    avatarUrl: groupAvatar,
                    groupType: groupType,
                    memberCount: memberCount
                }}
                onGroupLeft={() => {
                    // Khi rời khỏi nhóm, quay về explore và refresh
                    onBackToExplore?.();
                    onGroupLeft?.();
                }}
            />
        </>
    );
}
