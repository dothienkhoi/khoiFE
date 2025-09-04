// components/features/chat/ChatInput.tsx
"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Send,
    Paperclip,
    X,
    FileText,
    Smile
} from "lucide-react";
import { Message } from "@/types/customer.types";
import { cn } from "@/lib/utils";
import { uploadFilesToConversation } from "@/lib/customer-api-client";
import { toast } from "sonner";
import { useCustomerStore } from "@/store/customerStore";
import { useAuthStore } from "@/store/authStore";
import { useChatHub } from "@/components/providers/ChatHubProvider";
import { getMessagePreview, getMessageTypeFromFile } from "@/lib/utils/messageUtils";
import { EmojiPicker } from "../boback/EmojiPicker";
import { AttachmentPopup } from "./AttachmentPopup";
import { FilePreview } from "../boback/FilePreview";
import { ReplyPreview } from "../boback/ReplyPreview";

interface ChatInputProps {
    onSendMessage: (content: string, type: 'text' | 'image' | 'file', replyTo?: Message) => void;
    onTyping?: (isTyping: boolean) => void;
    replyTo?: Message | null;
    onCancelReply?: () => void;
    disabled?: boolean;
    placeholder?: string;
    conversationId?: number;
}

interface FilePreview {
    file: File;
    previewUrl: string | null;
    type: 'image' | 'file';
}

export function ChatInput({
    onSendMessage,
    onTyping,
    replyTo,
    onCancelReply,
    disabled = false,
    placeholder = "Nhập tin nhắn...",
    conversationId
}: ChatInputProps) {
    const { startTyping, stopTyping } = useChatHub();
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [message, setMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);



    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const attachmentRef = useRef<HTMLDivElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    const { addMessage, updateMessage, updateConversation, removeMessage } = useCustomerStore();
    const { user: currentUser } = useAuthStore();

    // Auto-focus textarea on mount
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    // Handle typing indicator
    useEffect(() => {
        let timeout: NodeJS.Timeout;

        if (isTyping) {
            onTyping?.(true);

            // TODO: Send typing indicator via real-time service later
            // const realTimeService = getRealTimeService();
            // if (realTimeService && conversationId) {
            //     realTimeService.sendTypingIndicator(conversationId, true);
            // }

            timeout = setTimeout(() => {
                setIsTyping(false);
                onTyping?.(false);

                // TODO: Send stop typing indicator via real-time service later
                // if (realTimeService && conversationId) {
                //     realTimeService.sendTypingIndicator(conversationId, false);
                // }
            }, 1000);
        }

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [isTyping, onTyping, conversationId]);

    // Close attachment menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (attachmentRef.current && !attachmentRef.current.contains(event.target as Node)) {
                setShowAttachments(false);
            }
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };

        if (showAttachments || showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAttachments, showEmojiPicker]);

    // Handle input change with typing indicator
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;

        // Limit message to 100 characters
        if (value.length > 100) {
            return;
        }

        setMessage(value);

        // Auto-resize textarea based on content
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`; // max 128px (max-h-32)
        }

        if (value.trim() && !isTyping) {
            setIsTyping(true);
        } else if (!value.trim() && isTyping) {
            setIsTyping(false);
        }

        // SignalR typing indicators
        if (conversationId && value.length > 0) {
            startTyping(conversationId);

            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Set new timeout to stop typing
            typingTimeoutRef.current = setTimeout(() => {
                if (conversationId) {
                    stopTyping(conversationId);
                }
            }, 2000); // Stop typing after 2 seconds of inactivity
        }
    }, [isTyping, conversationId, startTyping, stopTyping]);

    // Send message function
    const handleSendMessage = useCallback(async () => {
        const trimmedMessage = message.trim();
        const hasContent = trimmedMessage.length > 0;
        const hasFiles = selectedFiles.length > 0;

        // Validate message length
        if (hasContent && trimmedMessage.length > 100) {
            toast.error("Tin nhắn không được vượt quá 100 ký tự");
            return;
        }

        // Validate file count
        if (hasFiles && selectedFiles.length > 5) {
            return;
        }

        if ((!hasContent && !hasFiles) || disabled) return;

        setIsUploading(true);
        let optimisticMessages: any[] = [];

        try {
            // Handle file uploads
            if (hasFiles && conversationId) {
                const files = selectedFiles.map(fp => fp.file);

                // Create optimistic messages for files
                optimisticMessages = selectedFiles.map((filePreview, index) => {
                    const messageType = getMessageTypeFromFile(filePreview.file.type);
                    const messagePreview = getMessagePreview(
                        messageType,
                        filePreview.file.name,
                        currentUser?.fullName || 'Bạn'
                    );

                    return {
                        id: `temp-${Date.now()}-${index}`,
                        conversationId: conversationId!,
                        content: messagePreview,
                        messageType: messageType,
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
                            contentSnippet: replyTo.content.substring(0, 50)
                        } : null
                    };
                });

                // Add optimistic messages to store
                optimisticMessages.forEach((msg: any) => {
                    addMessage(conversationId, msg as unknown as Message);
                });

                // Update conversation preview immediately for real-time display
                if (optimisticMessages.length > 0) {
                    const firstMessage = optimisticMessages[0];
                    updateConversation(conversationId, {
                        lastMessagePreview: firstMessage.content,
                        lastMessageTimestamp: firstMessage.sentAt,
                        lastMessageType: firstMessage.messageType
                    });
                }

                const response = await uploadFilesToConversation(conversationId, files);

                if (response.success) {
                    const createdMessages = response.data || [];

                    // Update optimistic messages with real data
                    createdMessages.forEach((msg: any, index: number) => {
                        if (optimisticMessages[index]) {
                            updateMessage(conversationId, optimisticMessages[index].id, {
                                id: msg.id,
                                content: msg.content,
                                attachments: msg.attachments,
                                sentAt: msg.sentAt
                            });
                        }
                    });
                } else {
                    // Remove optimistic messages if API failed
                    optimisticMessages.forEach((msg: any) => {
                        removeMessage(conversationId, msg.id);
                    });

                    // Check if it's a file type error
                    if (response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
                        const fileTypeError = response.errors.find((error: any) => {
                            const errorText = typeof error === 'string' ? error : error?.message || '';
                            return errorText.includes('không được phép') ||
                                errorText.includes('không hỗ trợ') ||
                                errorText.includes('INVALID_FILE_TYPE');
                        });

                        if (fileTypeError) {
                            const errorMessage = typeof fileTypeError === 'string'
                                ? fileTypeError
                                : (fileTypeError as any)?.message || 'File không được hỗ trợ';
                            toast.error(`File này không được hỗ trợ: ${errorMessage}`);
                        } else {
                            toast.error(response.message || "Không thể gửi file");
                        }
                    } else {
                        toast.error(response.message || "Không thể gửi file");
                    }
                }
            }

            // Handle text message
            if (hasContent) {
                // Format long messages for better display
                const formattedMessage = trimmedMessage.length > 50
                    ? trimmedMessage.replace(/(.{50})/g, '$1\n').trim()
                    : trimmedMessage;
                onSendMessage(formattedMessage, 'text', replyTo || undefined);

                // Update conversation preview for text messages
                if (conversationId) {
                    updateConversation(conversationId, {
                        lastMessagePreview: formattedMessage,
                        lastMessageTimestamp: new Date().toISOString(),
                        lastMessageType: 'Text'
                    });
                }
            }

            // Reset state after successful send
            setMessage("");
            setIsTyping(false);
            onTyping?.(false);
            clearSelectedFiles();

            // Clear reply after successful send
            if (replyTo && onCancelReply) {
                onCancelReply();
            }

            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = '40px'; // min-h-[40px]
            }

        } catch (error: any) {
            // Remove optimistic messages if there's an error
            if (hasFiles && conversationId) {
                optimisticMessages.forEach((msg: any) => {
                    removeMessage(conversationId, msg.id);
                });
            }

            // Check if it's a file type error from API response
            if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                const fileTypeError = error.response.data.errors.find((errorItem: any) =>
                    errorItem.message && (
                        errorItem.message.includes('không được phép') ||
                        errorItem.message.includes('không hỗ trợ') ||
                        errorItem.message.includes('INVALID_FILE_TYPE')
                    )
                );

                if (fileTypeError) {
                    toast.error(`File này không được hỗ trợ: ${fileTypeError.message}`);
                } else {
                    toast.error("Có lỗi xảy ra khi gửi tin nhắn");
                }
            } else {
                toast.error("Có lỗi xảy ra khi gửi tin nhắn");
            }
        } finally {
            setIsUploading(false);
        }
    }, [message, selectedFiles, disabled, conversationId, onSendMessage, onTyping, addMessage]);

    // Handle key press events
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);

    // Insert emoji into message
    const insertEmoji = useCallback((emoji: string) => {
        setMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
        // Focus back to textarea
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    // Handle paste events for images (silent - no notifications)
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        let hasFiles = false;
        const maxFiles = 5;
        const remainingSlots = maxFiles - selectedFiles.length;

        // Check if we can add more files
        if (remainingSlots <= 0) {
            return;
        }

        const newFilePreviews: FilePreview[] = [];
        let processedCount = 0;

        for (let i = 0; i < items.length && processedCount < remainingSlots; i++) {
            const item = items[i];

            // Handle images
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (file) {
                    // Convert clipboard image to File object
                    const imageFile = new File([file], `clipboard-image-${Date.now()}-${processedCount}.png`, {
                        type: file.type || 'image/png'
                    });

                    // Create preview URL and FilePreview object
                    const previewUrl = URL.createObjectURL(imageFile);
                    const filePreview: FilePreview = {
                        file: imageFile,
                        previewUrl,
                        type: 'image'
                    };

                    newFilePreviews.push(filePreview);
                    processedCount++;
                    hasFiles = true;
                }
            }
            // Handle other file types
            else if (item.type.indexOf('file') !== -1) {
                const file = item.getAsFile();
                if (file) {
                    // Create preview URL and FilePreview object
                    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
                    const filePreview: FilePreview = {
                        file,
                        previewUrl,
                        type: file.type.startsWith('image/') ? 'image' : 'file'
                    };

                    newFilePreviews.push(filePreview);
                    processedCount++;
                    hasFiles = true;
                }
            }
        }

        // Add valid files to selected files
        if (newFilePreviews.length > 0) {
            setSelectedFiles(prev => [...prev, ...newFilePreviews]);
        }

        // Show warning if some files were skipped
        if (items.length > remainingSlots) {
            // Silent validation - no toast, validation will be shown in dialog
        }

        // Handle text paste - check length limit
        const pastedText = e.clipboardData?.getData('text');
        if (pastedText && message.length + pastedText.length > 100) {
            e.preventDefault();
            // Silent validation - no toast, just prevent paste
        }
    }, [message, selectedFiles.length]);

    // Clear selected files and cleanup URLs
    const clearSelectedFiles = useCallback(() => {
        selectedFiles.forEach(filePreview => {
            if (filePreview.previewUrl) {
                URL.revokeObjectURL(filePreview.previewUrl);
            }
        });
        setSelectedFiles([]);
    }, [selectedFiles]);

    // Handle file selection
    const handleFileSelection = useCallback((files: FileList | null, type: 'image' | 'file') => {
        if (!files || files.length === 0) return;

        const maxSize = 10 * 1024 * 1024; // 10MB
        const maxFiles = 5;
        const remainingSlots = maxFiles - selectedFiles.length;
        const filesToProcess = Math.min(files.length, remainingSlots);

        // Check if we can add more files
        if (remainingSlots <= 0) {
            return;
        }

        const newFilePreviews: FilePreview[] = [];
        let hasError = false;

        // Process each file
        for (let i = 0; i < filesToProcess; i++) {
            const file = files[i];

            // Validate file size
            if (file.size > maxSize) {
                toast.error(`File "${file.name}" quá lớn. Kích thước tối đa là 10MB`);
                hasError = true;
                continue;
            }

            // Validate image type for image uploads
            if (type === 'image' && !file.type.startsWith('image/')) {
                toast.error(`File "${file.name}" không phải là hình ảnh`);
                hasError = true;
                continue;
            }

            // Create preview
            const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
            const filePreview: FilePreview = { file, previewUrl, type };
            newFilePreviews.push(filePreview);
        }

        // Add valid files to selected files
        if (newFilePreviews.length > 0) {
            setSelectedFiles(prev => [...prev, ...newFilePreviews]);
        }

        // Show warning if some files were skipped
        if (files.length > remainingSlots) {
            // Silent validation - no toast, validation will be shown in dialog
        }

        setShowAttachments(false);

        // Reset input
        if (type === 'image' && imageInputRef.current) {
            imageInputRef.current.value = '';
        } else if (type === 'file' && fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [selectedFiles.length]);

    // Remove specific file
    const removeFile = useCallback((index: number) => {
        setSelectedFiles(prev => {
            const newFiles = prev.filter((_, i) => i !== index);
            // Cleanup URL for removed file
            if (prev[index]?.previewUrl) {
                URL.revokeObjectURL(prev[index].previewUrl!);
            }
            return newFiles;
        });
    }, []);

    // Check if can send message
    const canSend = useMemo(() =>
        (message.trim().length > 0 || selectedFiles.length > 0) && !disabled,
        [message, selectedFiles.length, disabled]
    );

    return (
        <div className="relative">
            {/* Reply Preview */}
            {replyTo && (
                <ReplyPreview
                    replyTo={replyTo}
                    onCancelReply={onCancelReply}
                />
            )}

            {/* File/Image Preview */}
            <FilePreview
                files={selectedFiles}
                isUploading={isUploading}
                onRemoveFile={removeFile}
                onClearAll={clearSelectedFiles}
                hideWhenPopupOpen={showAttachments}
            />

            {/* Input Area */}
            <div className="flex items-end gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg min-h-[60px] max-w-full chat-input-container border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                {/* Attachment Button */}
                <div className="relative flex-shrink-0" ref={attachmentRef}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-10 w-10 transition-all duration-300 hover:scale-110 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400",
                            showAttachments && "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 shadow-md"
                        )}
                        onClick={() => setShowAttachments(!showAttachments)}
                        disabled={disabled || isUploading}
                    >
                        <Paperclip className="h-4 w-4" />
                    </Button>

                    {/* Attachment Popup */}
                    <AttachmentPopup
                        isOpen={showAttachments}
                        onClose={() => setShowAttachments(false)}
                        onImageSelect={() => imageInputRef.current?.click()}
                        onFileSelect={() => fileInputRef.current?.click()}
                        selectedFilesCount={selectedFiles.length}
                        disabled={disabled}
                        isUploading={isUploading}
                    />
                </div>

                {/* Emoji Button */}
                <div className="relative flex-shrink-0" ref={emojiPickerRef}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-10 w-10 transition-all duration-300 hover:scale-110 rounded-xl hover:bg-gradient-to-r hover:from-[#ad46ff]/10 hover:to-[#1447e6]/10 hover:text-[#ad46ff] dark:hover:text-[#1447e6]",
                            showEmojiPicker && "bg-gradient-to-r from-[#ad46ff]/10 to-[#1447e6]/10 text-[#ad46ff] dark:text-[#1447e6] shadow-md"
                        )}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        disabled={disabled || isUploading}
                        title="Chọn emoji"
                    >
                        <Smile className="h-4 w-4" />
                    </Button>

                    {/* Emoji Picker Component */}
                    <EmojiPicker
                        isOpen={showEmojiPicker}
                        onClose={() => setShowEmojiPicker(false)}
                        onEmojiSelect={insertEmoji}
                        disabled={disabled || isUploading}
                    />
                </div>

                {/* Hidden file inputs */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelection(e.target.files, 'file')}
                    accept="*/*"
                />
                <input
                    ref={imageInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelection(e.target.files, 'image')}
                    accept="image/*"
                />

                {/* Text Input */}
                <div className="flex-1 relative min-w-0">
                    {/* Validation Message Above Input */}
                    {message.length > 0 && (
                        <div className={cn(
                            "absolute -top-8 left-0 right-0 transition-all duration-300",
                            message.length === 100
                                ? "opacity-100 translate-y-0"
                                : message.length > 90
                                    ? "opacity-80 translate-y-0"
                                    : "opacity-0 -translate-y-2 pointer-events-none"
                        )}>
                            <div className={cn(
                                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm",
                                message.length === 100
                                    ? "bg-red-100 text-red-700 border border-red-200"
                                    : "bg-orange-100 text-orange-700 border border-orange-200"
                            )}>
                                {message.length === 100 ? (
                                    <>
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                        <span>Đã đạt giới hạn 100 ký tự</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                        <span>Còn {100 - message.length} ký tự</span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <Textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder={`${placeholder}`}
                        className={cn(
                            "min-h-[40px] max-h-32 resize-none pr-12 leading-relaxed transition-all duration-200 w-full chat-textarea rounded-xl border-0 bg-transparent focus:ring-0 focus:border-0 shadow-none",
                            message.length === 100 && "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-400/20"
                        )}
                        disabled={disabled || isUploading}
                        rows={1}
                        maxLength={100}
                        style={{
                            wordWrap: 'break-word',
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'break-word'
                        }}
                    />
                </div>

                {/* Send Button */}
                <Button
                    size="icon"
                    className={cn(
                        "h-10 w-10 transition-all duration-300 flex-shrink-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-110",
                        canSend && "hover:scale-110"
                    )}
                    onClick={handleSendMessage}
                    disabled={!canSend || isUploading}
                >
                    {isUploading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </div>
    );
}
