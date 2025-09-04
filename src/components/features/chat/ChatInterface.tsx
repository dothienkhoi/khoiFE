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
import { WelcomeScreen } from "../welcome/WelcomeScreen";
import { useChatHub } from "@/components/providers/ChatHubProvider";

export function ChatInterface() {
    const {
        activeChatId,
        activeChatType,
        conversations,
        addMessage,
        updateMessage
    } = useCustomerStore();

    const { user: currentUser } = useAuthStore();
    const { isConnected: isChatHubConnected } = useChatHub();

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
                parentMessage: replyTo ? {
                    senderName: replyTo.sender.displayName,
                    contentSnippet: replyTo.content,
                    messageType: replyTo.messageType,
                    parentMessageId: replyTo.id
                } : null
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
                const updatedParentMessage = realMessage.parentMessage ? {
                    ...realMessage.parentMessage,
                    parentMessageId: realMessage.parentMessageId // Đảm bảo có parentMessageId
                } : null;

                updateMessage(conversationId, optimisticMessage.id, {
                    id: realMessage.id,
                    sentAt: realMessage.sentAt,
                    sender: realMessage.sender,
                    parentMessage: updatedParentMessage,
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

    // If no active chat, show welcome screen
    if (!activeChatId || !activeChatType) {
        return (
            <WelcomeScreen
                userName={currentUser?.fullName || "Người dùng"}
                onNewChat={() => {
                    // TODO: Implement new chat functionality
                    console.log('New chat clicked');
                }}
            />
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
                    chatType="direct"
                />
            </div>

            {/* Message input */}
            <div>
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
