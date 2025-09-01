"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { useCustomerStore } from "@/store/customerStore";
import { chatHubUtils } from "@/components/providers/ChatHubProvider";
import { sendConversationMessage, sendGroupMessage, uploadFilesToConversation, uploadFilesToGroup } from "@/lib/customer-api-client";
import { Message } from "@/types/customer.types";
import { MessageCircle } from "lucide-react";
import { FilePreviewGallery } from "./FilePreviewGallery";
import { DirectChatHeader } from "./DirectChatHeader";
import { GroupChatHeader } from "../groups/GroupChatHeader";
import { GroupInfoModal } from "./GroupInfoModal";

interface FilePreview {
    url: string;
    name: string;
    size: number;
    type: string;
}

export function ChatInterface() {
    const {
        activeChatId,
        activeChatType,
        conversations,
        myGroups,
        clearActiveChat,
        addMessage
    } = useCustomerStore();

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
    const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
    const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);

    // Get current conversation details
    const currentConversation = useMemo(() =>
        conversations.find(c => c.conversationId.toString() === activeChatId),
        [conversations, activeChatId]
    );

    // Get current group details if it's a group chat
    const currentGroup = useMemo(() => {
        if (activeChatType === 'group') {
            return myGroups.find((g: any) => (g.id || g.groupId) === activeChatId);
        }
        return null;
    }, [myGroups, activeChatId, activeChatType]);

    // Các biến này không còn cần thiết vì đã được xử lý trong header components
    const conversationId = useMemo(() =>
        activeChatId ? Number(activeChatId) : null,
        [activeChatId]
    );

    // Join/leave conversation when active chat changes
    useEffect(() => {
        if (conversationId && activeChatType === 'direct') {
            chatHubUtils.joinConversation(conversationId);
            return () => {
                chatHubUtils.leaveConversation(conversationId);
            };
        }
        // Group chat logic - sử dụng conversation methods cho group
        if (conversationId && activeChatType === 'group') {
            chatHubUtils.joinConversation(conversationId);
            return () => {
                chatHubUtils.leaveConversation(conversationId);
            };
        }
    }, [conversationId, activeChatType]);

    // Handle file selection
    const handleFileSelect = useCallback((files: FileList | null) => {
        if (!files) return;

        const newFiles = Array.from(files);
        const maxFiles = 5;
        const maxSize = 25 * 1024 * 1024; // 25MB

        // Check file limit
        if (selectedFiles.length + newFiles.length > maxFiles) {
            alert(`Bạn chỉ có thể chọn tối đa ${maxFiles} file. Hiện tại đã có ${selectedFiles.length} file.`);
            return;
        }

        // Validate file size
        const validFiles = newFiles.filter(file => {
            if (file.size > maxSize) {
                alert(`File "${file.name}" quá lớn. Kích thước tối đa là 25MB.`);
                return false;
            }
            return true;
        });

        // Create preview URLs for images
        const newPreviews = validFiles.map(file => ({
            url: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
            name: file.name,
            size: file.size,
            type: file.type
        }));

        setSelectedFiles(prev => [...prev, ...validFiles]);
        setFilePreviews(prev => [...prev, ...newPreviews]);
    }, [selectedFiles.length]);

    // Remove file from selection
    const removeFile = useCallback((index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setFilePreviews(prev => {
            const newPreviews = prev.filter((_, i) => i !== index);
            // Clean up URL for removed image
            if (prev[index]?.url) {
                URL.revokeObjectURL(prev[index].url);
            }
            return newPreviews;
        });
    }, []);

    // Remove all files
    const removeAllFiles = useCallback(() => {
        setSelectedFiles([]);
        filePreviews.forEach(preview => {
            if (preview.url) {
                URL.revokeObjectURL(preview.url);
            }
        });
        setFilePreviews([]);
    }, [filePreviews]);

    // Send text message
    const handleSendText = useCallback(async (content: string, replyTo?: Message) => {
        if (!conversationId) return;

        setIsUploading(true);
        try {
            if (activeChatType === 'direct') {
                const response = await sendConversationMessage(
                    conversationId,
                    {
                        content,
                        parentMessageId: replyTo?.id || undefined
                    }
                );

                if (response.success) {
                    const msg = response.data as Message;
                    if (msg && msg.id) {
                        // Nếu có reply, thêm thông tin parentMessage vào tin nhắn mới
                        if (replyTo) {
                            const messageWithReply: Message = {
                                ...msg,
                                parentMessageId: replyTo.id,
                                parentMessage: replyTo
                            };
                            addMessage(conversationId, messageWithReply);
                        } else {
                            addMessage(conversationId, msg);
                        }
                    }
                    // Clear reply state after successful send
                    if (replyTo) {
                        setReplyToMessage(null);
                    }
                }
            } else if (activeChatType === 'group' && activeChatId) {
                const response = await sendGroupMessage(
                    activeChatId,
                    {
                        content,
                        parentMessageId: replyTo?.id || undefined
                    }
                );

                if (response.success) {
                    const msg = response.data as Message;
                    if (msg && msg.id) {
                        // Nếu có reply, thêm thông tin parentMessage vào tin nhắn mới
                        if (replyTo) {
                            const messageWithReply: Message = {
                                ...msg,
                                parentMessageId: replyTo.id,
                                parentMessage: replyTo
                            };
                            addMessage(conversationId, messageWithReply);
                        } else {
                            addMessage(conversationId, msg);
                        }
                    }
                    // Clear reply state after successful send
                    if (replyTo) {
                        setReplyToMessage(null);
                    }
                }
            }
        } catch (err) {
        } finally {
            setIsUploading(false);
        }
    }, [conversationId, activeChatType, activeChatId]);

    // Send files
    const handleSendFiles = useCallback(async () => {
        if (!conversationId || selectedFiles.length === 0) return;

        setIsUploading(true);
        try {
            if (activeChatType === 'direct') {
                const response = await uploadFilesToConversation(conversationId, selectedFiles);

                if (response.success) {
                    // Add messages to store
                    response.data.forEach(message => {
                        addMessage(
                            conversationId,
                            message as unknown as Message
                        );
                    });

                    // Clear files after successful send
                    removeAllFiles();
                }
            } else if (activeChatType === 'group' && activeChatId) {
                const response = await uploadFilesToGroup(activeChatId, selectedFiles);

                if (response.success) {
                    // Add messages to store
                    response.data.forEach(message => {
                        addMessage(
                            conversationId,
                            message as unknown as Message
                        );
                    });

                    // Clear files after successful send
                    removeAllFiles();
                }
            }
        } catch (err) {
        } finally {
            setIsUploading(false);
        }
    }, [conversationId, selectedFiles, removeAllFiles, activeChatType]);

    // Handle message input
    const handleMessageInput = useCallback((content: string, type: string, replyTo?: Message) => {
        if (type === 'text' && content.trim()) {
            handleSendText(content.trim(), replyTo);
        } else if (type === 'files' && selectedFiles.length > 0) {
            handleSendFiles();
        }
    }, [handleSendText, handleSendFiles, selectedFiles.length]);

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
            ) : activeChatType === 'group' && currentGroup ? (
                <GroupChatHeader
                    group={currentGroup}
                    onVideoCall={() => {
                        // TODO: Implement video call for group chat
                    }}
                    onSearchMessages={() => {
                        // TODO: Implement message search
                    }}
                    onShowGroupInfo={() => {
                        setIsGroupInfoOpen(true);
                    }}
                />
            ) : null}

            {/* Messages area */}
            <div className="flex-1 overflow-hidden">
                <MessageList
                    conversationId={conversationId!}
                    partnerName={activeChatType === 'group'
                        ? (currentGroup?.name || currentGroup?.groupName || "Unknown Group")
                        : (currentConversation?.displayName || "Unknown")
                    }
                    partnerAvatar={activeChatType === 'group'
                        ? currentGroup?.avatarUrl
                        : currentConversation?.avatarUrl
                    }
                    onReplyToMessage={setReplyToMessage}
                />
            </div>

            {/* File Preview */}
            {selectedFiles.length > 0 && (
                <FilePreviewGallery
                    files={filePreviews}
                    onRemoveFile={removeFile}
                    onRemoveAll={removeAllFiles}
                />
            )}

            {/* Message input */}
            <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
                <ChatInput
                    onSendMessage={handleMessageInput}
                    conversationId={conversationId!}
                    disabled={isUploading}
                    placeholder="Nhập tin nhắn..."
                    replyTo={replyToMessage as any}
                    onCancelReply={() => setReplyToMessage(null)}
                />
            </div>

            {/* Group Info Modal */}
            {currentGroup && (
                <GroupInfoModal
                    group={currentGroup}
                    isOpen={isGroupInfoOpen}
                    onClose={() => setIsGroupInfoOpen(false)}
                />
            )}
        </div>
    );
}
