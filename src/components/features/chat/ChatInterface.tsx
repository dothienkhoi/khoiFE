"use client";

import { useState, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import { useCustomerStore } from "@/store/customerStore";
import { useAuthStore } from "@/store/authStore";
import { DirectChatHeader } from "./DirectChatHeader";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { Message } from "@/types/customer.types";
import { sendConversationMessage } from "@/lib/customer-api-client";
import { toast } from "sonner";

export function ChatInterface() {
    const {
        activeChatId,
        activeChatType,
        conversations,
        addMessage,
        updateMessage
    } = useCustomerStore();

    const { user: currentUser } = useAuthStore();

    const [isUploading, setIsUploading] = useState(false);
    const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);

    // Get current conversation details
    const currentConversation = conversations.find(c => c.conversationId.toString() === activeChatId);
    const conversationId = activeChatId ? Number(activeChatId) : null;

    // Handle sending text message
    const handleSendText = useCallback(async (content: string, replyTo?: Message) => {
        if (!conversationId) return;

        try {
            // Create optimistic message first
            const optimisticMessage: Message = {
                id: `temp-${Date.now()}`,
                conversationId: conversationId,
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
                parentMessage: replyTo || null
            };

            // Add optimistic message to UI immediately
            addMessage(conversationId, optimisticMessage);

            // Send message via API
            const response = await sendConversationMessage(conversationId, {
                content,
                parentMessageId: replyTo?.id || undefined
            });

            if (response.success && response.data) {
                // Replace optimistic message with real message from API
                const realMessage = response.data as Message;

                // Update the optimistic message with real data
                updateMessage(conversationId, optimisticMessage.id, {
                    id: realMessage.id,
                    sentAt: realMessage.sentAt,
                    sender: realMessage.sender,
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
    }, [conversationId, addMessage, updateMessage, currentUser, setReplyToMessage]);

    // Handle sending files
    const handleSendFiles = useCallback(async () => {
        if (!conversationId) return;

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
    }, [conversationId]);

    // Handle message input
    const handleMessageInput = useCallback((content: string, type: string, replyTo?: Message) => {
        if (type === 'text' && content.trim()) {
            handleSendText(content.trim(), replyTo);
        } else if (type === 'files') {
            handleSendFiles();
        }
    }, [handleSendText, handleSendFiles]);

    // If no active chat, show empty state
    if (!activeChatId || !activeChatType) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50 dark:bg-gray-900">
                <div className="w-32 h-32 bg-gradient-to-r from-[#ad46ff]/10 to-[#1447e6]/10 rounded-full flex items-center justify-center mb-6">
                    <MessageCircle className="w-16 h-16 text-[#ad46ff]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Chào mừng đến với FastBite Chat
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-6 max-w-md">
                    Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="w-2 h-2 bg-[#ad46ff] rounded-full"></div>
                    <span>Trò chuyện cá nhân</span>
                    <div className="w-2 h-2 bg-[#1447e6] rounded-full ml-4"></div>
                    <span>Trò chuyện nhóm</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Chat Header - Sử dụng component tương ứng với loại chat */}
            {activeChatType === 'direct' && currentConversation ? (
                <DirectChatHeader
                    conversation={currentConversation}
                    onVideoCall={() => {
                        // TODO: Implement video call for direct chat
                    }}
                    onSearchMessages={() => {
                        // TODO: Implement message search
                    }}
                    onShowUserProfile={() => {
                        // TODO: Implement user profile display
                    }}
                />
            ) : null}

            {/* Messages */}
            <div className="flex-1 overflow-hidden min-h-0">
                <MessageList
                    conversationId={conversationId!}
                    partnerName={currentConversation?.displayName || "Người dùng"}
                    partnerAvatar={currentConversation?.avatarUrl}
                    onReplyToMessage={setReplyToMessage}
                />
            </div>

            {/* Message input */}
            <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 min-h-[80px] rounded-t-2xl">
                <ChatInput
                    onSendMessage={handleMessageInput}
                    conversationId={conversationId!}
                    disabled={isUploading}
                    placeholder="Nhập tin nhắn..."
                    replyTo={replyToMessage as any}
                    onCancelReply={() => setReplyToMessage(null)}
                />
            </div>
        </div>
    );
}
