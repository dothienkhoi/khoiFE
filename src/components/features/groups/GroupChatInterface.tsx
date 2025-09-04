"use client";

import { useState, useCallback, useEffect } from "react";
import { MessageCircle, Search, Phone, Video, Users, Settings, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageList } from "../chat/MessageList";
import { ChatInput } from "../chat/ChatInput";
import { ReplyPreview } from "../boback/ReplyPreview";
import { useCustomerStore } from "@/store/customerStore";
import { useAuthStore } from "@/store/authStore";
import { sendGroupMessage, uploadFilesToGroup } from "@/lib/customer-api-client";
import { Message } from "@/types/customer.types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { WelcomeScreen } from "../welcome/WelcomeScreen";
import { useChatHub } from "@/components/providers/ChatHubProvider";
import { getMessagePreview } from "@/lib/utils/messageUtils";

interface GroupChatInterfaceProps {
    groupId?: string;
    conversationId?: number;
    groupName?: string;
    groupAvatar?: string;
    groupType?: "Public" | "Private" | "Community";
    memberCount?: number;
    description?: string;
}

export function GroupChatInterface({ groupId, conversationId, groupName, groupAvatar, groupType, memberCount, description }: GroupChatInterfaceProps) {
    const { addMessage, updateMessage, updateConversation } = useCustomerStore();
    const { user: currentUser } = useAuthStore();
    const { isConnected: isChatHubConnected } = useChatHub();

    const [isUploading, setIsUploading] = useState(false);
    const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);

    const actualConversationId = conversationId || (groupId ? Number(groupId) : null);

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
            const response = await sendGroupMessage(groupId!, {
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
    }, [actualConversationId, addMessage, updateMessage, currentUser, setReplyToMessage, groupId]);

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

    // If no group is selected, show welcome screen
    if (!groupId || !groupName) {
        return (
            <WelcomeScreen
                userName={currentUser?.fullName || "Người dùng"}
                onNewChat={() => {
                    // TODO: Implement new group functionality
                    console.log('New group clicked');
                }}
                type="group"
            />
        );
    }

    const groupTypeInfo = getGroupTypeInfo(groupType);
    const TypeIcon = groupTypeInfo.icon;

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Group Chat Header */}
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={groupAvatar} />
                            <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white font-semibold">
                                {groupName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="font-semibold text-gray-900 dark:text-white">{groupName}</h2>
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
                                {memberCount !== undefined && memberCount > 0 && (
                                    <>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {memberCount} thành viên
                                        </span>
                                        <span>•</span>
                                    </>
                                )}
                                {(memberCount === undefined || memberCount === 0) && (
                                    <>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            Chưa có thành viên
                                        </span>
                                        <span>•</span>
                                    </>
                                )}
                                <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                    {description || getDefaultDescription(groupType, groupName)}
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
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Users className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Settings className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden min-h-0">
                <MessageList
                    conversationId={actualConversationId!}
                    partnerName={groupName}
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
                />
            </div>
        </div>
    );
}
