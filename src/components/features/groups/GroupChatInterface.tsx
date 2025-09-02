"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageList } from "../chat/MessageList";
import { ChatInput } from "../chat/ChatInput";
import { useCustomerStore } from "@/store/customerStore";
import { sendGroupMessage, uploadFilesToGroup } from "@/lib/customer-api-client";
import { Message } from "@/types/customer.types";
import { MessageCircle, Users, Settings, Search, Phone, Video } from "lucide-react";
import { toast } from "sonner";
import { FilePreviewGallery } from "../chat/FilePreviewGallery";

interface FilePreview {
    url: string;
    name: string;
    size: number;
    type: string;
}

interface GroupChatInterfaceProps {
    groupId?: string;
    groupName?: string;
    groupAvatar?: string;
}

export function GroupChatInterface({ groupId, groupName, groupAvatar }: GroupChatInterfaceProps) {
    const {
        activeChatId,
        activeChatType,
        messages,
        addMessage
    } = useCustomerStore();

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
    const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);

    // Get current group messages
    const currentMessages = useMemo(() => {
        if (groupId) {
            return messages[Number(groupId)] || [];
        }
        return [];
    }, [messages, groupId]);

    // Join/leave group chat when active chat changes
    useEffect(() => {
        // TODO: Implement real-time group chat management later
        // if (groupId) {
        //     // Real-time features will be implemented here
        // }
    }, [groupId]);

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
        setFilePreviews(prev => {
            prev.forEach(preview => {
                if (preview.url) {
                    URL.revokeObjectURL(preview.url);
                }
            });
            return [];
        });
    }, []);

    // Handle send text message
    const handleSendText = useCallback(async (content: string, replyTo?: Message) => {
        if (!groupId) return;

        try {
            // TODO: Implement real-time messaging later
            // const realTimeService = getRealTimeService();
            // if (realTimeService && realTimeService.isConnected()) {
            //     await realTimeService.sendMessage(Number(groupId), content, replyTo?.id);
            //     console.log("Message sent via real-time service successfully");
            // } else {
            //     console.log("Real-time service not available, using REST API fallback");

            // Fallback to REST API for now
            const response = await sendGroupMessage(groupId, {
                content,
                parentMessageId: replyTo?.id || null
            });

            if (response.success) {
                console.log("Message sent via REST API successfully");
                // Add message to store immediately for optimistic update
                const newMessage: Message = {
                    id: response.data.id || `temp-${Date.now()}`,
                    conversationId: Number(groupId),
                    content: content,
                    sender: response.data.sender || {
                        userId: "current-user",
                        displayName: "Bạn",
                        avatarUrl: ""
                    },
                    sentAt: new Date().toISOString(),
                    messageType: "Text",
                    parentMessageId: replyTo?.id || null,
                    isDeleted: false,
                    attachments: [],
                    reactions: [],
                    parentMessage: replyTo || null
                };
                addMessage(Number(groupId), newMessage);
            } else {
                console.error("Failed to send message:", response.message);
                toast.error("Không thể gửi tin nhắn: " + (response.message || "Lỗi không xác định"));
            }
        } catch (error) {
            console.error("Error sending message:", error);

            // Hiển thị thông báo lỗi chi tiết hơn
            if (error instanceof Error) {
                if (error.message.includes("Backend chưa hỗ trợ gửi tin nhắn nhóm với GUID")) {
                    toast.error("Tính năng gửi tin nhắn nhóm chưa được hỗ trợ. Vui lòng liên hệ admin.");
                } else {
                    toast.error("Không thể gửi tin nhắn: " + error.message);
                }
            } else {
                toast.error("Không thể gửi tin nhắn. Vui lòng thử lại.");
            }
        }
    }, [groupId, addMessage]);

    // Handle send files
    const handleSendFiles = useCallback(async () => {
        if (!groupId || selectedFiles.length === 0) return;

        setIsUploading(true);
        try {
            const response = await uploadFilesToGroup(groupId, selectedFiles);

            if (response.success) {
                // Add messages to store
                response.data.forEach(message => {
                    addMessage(
                        Number(groupId),
                        message as unknown as Message
                    );
                });

                // Clear files after successful send
                removeAllFiles();
            }
        } catch (err) {
            console.error("Error uploading files:", err);
        } finally {
            setIsUploading(false);
        }
    }, [groupId, selectedFiles, addMessage, removeAllFiles]);

    // Handle message input
    const handleMessageInput = useCallback((content: string, type: string, replyTo?: Message) => {
        if (type === 'text' && content.trim()) {
            handleSendText(content.trim(), replyTo);
        } else if (type === 'files' && selectedFiles.length > 0) {
            handleSendFiles();
        }
    }, [handleSendText, handleSendFiles, selectedFiles.length]);

    // If no group is selected, show welcome screen
    if (!groupId || !groupName) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white dark:bg-gray-800">
                <div className="w-32 h-32 bg-gradient-to-r from-[#ad46ff]/10 to-[#1447e6]/10 rounded-full flex items-center justify-center mb-6">
                    <MessageCircle className="w-16 h-16 text-[#ad46ff]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Chào mừng đến với FastBite Chat
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-6 max-w-md">
                    Chọn một nhóm từ danh sách bên trái để bắt đầu nhắn tin
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
                            <h2 className="font-semibold text-gray-900 dark:text-white">{groupName}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Nhóm chat</p>
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

            {/* File Preview */}
            {selectedFiles.length > 0 && (
                <FilePreviewGallery
                    files={filePreviews}
                    onRemoveFile={removeFile}
                    onRemoveAll={removeAllFiles}
                />
            )}

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
                <MessageList
                    conversationId={Number(groupId)}
                    partnerName={groupName}
                    partnerAvatar={groupAvatar}
                    onReplyToMessage={setReplyToMessage}
                />
            </div>

            {/* Message input */}
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <ChatInput
                    onSendMessage={handleMessageInput}
                    conversationId={Number(groupId)}
                    disabled={isUploading}
                    placeholder="Nhập tin nhắn..."
                    replyTo={replyToMessage as any}
                    onCancelReply={() => setReplyToMessage(null)}
                />
            </div>
        </div>
    );
}
