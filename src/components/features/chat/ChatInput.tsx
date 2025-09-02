// components/features/chat/ChatInput.tsx
"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Send,
    Paperclip,
    X,
    Image,
    FileText,
    Download,
    Smile
} from "lucide-react";
import { Message } from "@/types/customer.types";
import { cn } from "@/lib/utils";
import { uploadFilesToConversation } from "@/lib/customer-api-client";
import { toast } from "sonner";
import { useCustomerStore } from "@/store/customerStore";

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
    const [message, setMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);

    // Format file size helper function
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
        return `${size} ${sizes[i]}`;
    };

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const attachmentRef = useRef<HTMLDivElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    const { addMessage } = useCustomerStore();

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
    }, [isTyping]);

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

        if ((!hasContent && !hasFiles) || disabled) return;

        setIsUploading(true);

        try {
            // Handle file uploads
            if (hasFiles && conversationId) {
                const files = selectedFiles.map(fp => fp.file);
                const response = await uploadFilesToConversation(conversationId, files);

                if (response.success) {
                    const createdMessages = response.data || [];

                    // Add messages to store
                    createdMessages.forEach((msg: any) => {
                        addMessage(conversationId, msg as unknown as Message);
                    });
                } else {
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

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            // Handle images
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (file) {
                    // Convert clipboard image to File object
                    const imageFile = new File([file], `clipboard-image-${Date.now()}.png`, {
                        type: file.type || 'image/png'
                    });

                    // Create preview URL and FilePreview object
                    const previewUrl = URL.createObjectURL(imageFile);
                    const filePreview: FilePreview = {
                        file: imageFile,
                        previewUrl,
                        type: 'image'
                    };

                    // Add to selected files silently
                    setSelectedFiles(prev => [...prev, filePreview]);
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

                    // Add to selected files silently
                    setSelectedFiles(prev => [...prev, filePreview]);
                    hasFiles = true;
                }
            }
        }

        // No toast notifications - silent operation
        if (hasFiles) {
            // Optionally add a subtle visual indicator instead of toast
            // For now, just silently add the files
        }

        // Handle text paste - check length limit
        const pastedText = e.clipboardData?.getData('text');
        if (pastedText && message.length + pastedText.length > 100) {
            e.preventDefault();
            // Silent validation - no toast, just prevent paste
        }
    }, [message, setSelectedFiles]);

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

        const file = files[0];
        const maxSize = 10 * 1024 * 1024; // 10MB

        // Validate file size
        if (file.size > maxSize) {
            toast.error(`File quá lớn. Kích thước tối đa là 10MB`);
            return;
        }

        // Validate image type for image uploads
        if (type === 'image' && !file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file hình ảnh');
            return;
        }

        // Create preview
        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
        const filePreview: FilePreview = { file, previewUrl, type };

        setSelectedFiles(prev => [...prev, filePreview]);
        setShowAttachments(false);

        // Reset input
        if (type === 'image' && imageInputRef.current) {
            imageInputRef.current.value = '';
        } else if (type === 'file' && fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

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
                <div className="mb-3 p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border-l-4 border-primary shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                <p className="font-semibold text-xs text-primary">
                                    Trả lời {replyTo.sender?.displayName || 'Người dùng'}
                                </p>
                            </div>
                            <div className="bg-background/90 rounded-md p-2 border border-primary/20 shadow-sm">
                                {replyTo.content ? (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {replyTo.content}
                                    </p>
                                ) : replyTo.attachments && replyTo.attachments.length > 0 ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-muted rounded flex items-center justify-center">
                                            <FileText className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {replyTo.attachments.length} tệp đính kèm
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                        Tin nhắn không có nội dung
                                    </p>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                            onClick={onCancelReply}
                            title="Hủy trả lời"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            )}

            {/* File/Image Preview */}
            {selectedFiles.length > 0 && (
                <div className={cn(
                    "mb-3 p-3 rounded-lg border transition-all duration-300",
                    isUploading
                        ? "bg-primary/5 border-primary/20 shadow-lg shadow-primary/10"
                        : "bg-muted/50 border-border"
                )}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">
                                File đã chọn ({selectedFiles.length})
                            </span>
                            {isUploading && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                                    <div className="loader"></div>
                                    <span className="text-xs font-medium text-primary">Đang tải lên...</span>
                                </div>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground hover:text-destructive"
                            onClick={clearSelectedFiles}
                            disabled={isUploading}
                        >
                            Xóa tất cả
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {selectedFiles.map((filePreview, index) => (
                            <div key={`${filePreview.file.name}-${index}`} className="flex items-center gap-3">
                                {filePreview.previewUrl ? (
                                    <img
                                        src={filePreview.previewUrl}
                                        alt="Preview"
                                        className="w-16 h-16 object-cover rounded border"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center">
                                        <FileText className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{filePreview.file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatFileSize(filePreview.file.size)}
                                    </p>
                                </div>



                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => removeFile(index)}
                                    disabled={isUploading}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="flex items-end gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                {/* Attachment Button */}
                <div className="relative" ref={attachmentRef}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-10 w-10 transition-all duration-200 hover:scale-105",
                            showAttachments && "bg-accent text-accent-foreground shadow-md"
                        )}
                        onClick={() => setShowAttachments(!showAttachments)}
                        disabled={disabled || isUploading}
                    >
                        <Paperclip className="h-4 w-4" />
                    </Button>

                    {/* Attachment Popup */}
                    {showAttachments && (
                        <div className="absolute bottom-full left-0 mb-3 p-4 bg-background border rounded-xl shadow-2xl z-50 min-w-[320px]">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-sm text-foreground">Đính kèm tệp</h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 hover:bg-muted"
                                    onClick={() => setShowAttachments(false)}
                                    disabled={disabled || isUploading}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>

                            {/* Attachment Options Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-3 h-auto p-4 hover:scale-105 transition-all duration-200 bg-blue-50 dark:bg-blue-950/20 hover:shadow-md border border-transparent hover:border-border"
                                    onClick={() => {
                                        imageInputRef.current?.click();
                                        setShowAttachments(false);
                                    }}
                                    disabled={disabled || isUploading}
                                >
                                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                                        <Image className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium text-sm text-blue-600 dark:text-blue-400">
                                            Hình ảnh
                                        </div>
                                    </div>
                                </Button>

                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-3 h-auto p-4 hover:scale-105 transition-all duration-200 bg-gray-50 dark:bg-gray-950/20 hover:shadow-md border border-transparent hover:border-border"
                                    onClick={() => {
                                        fileInputRef.current?.click();
                                        setShowAttachments(false);
                                    }}
                                    disabled={disabled || isUploading}
                                >
                                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-950/20">
                                        <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium text-sm text-gray-600 dark:text-gray-400">
                                            File khác
                                        </div>
                                    </div>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Emoji Button */}
                <div className="relative" ref={emojiPickerRef}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-10 w-10 transition-all duration-200 hover:scale-105",
                            showEmojiPicker && "bg-accent text-accent-foreground shadow-md"
                        )}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        disabled={disabled || isUploading}
                        title="Chọn emoji"
                    >
                        <Smile className="h-4 w-4" />
                    </Button>

                    {/* Emoji Picker Popup */}
                    {showEmojiPicker && (
                        <div className="absolute bottom-full left-0 mb-3 p-4 bg-background border rounded-xl shadow-2xl z-50 min-w-[280px]">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-sm text-foreground">Chọn emoji</h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 hover:bg-muted"
                                    onClick={() => setShowEmojiPicker(false)}
                                    disabled={disabled || isUploading}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>

                            {/* Emoji Grid */}
                            <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                                {[
                                    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
                                    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
                                    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
                                    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
                                    '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
                                    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
                                    '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
                                    '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
                                    '😶', '😐', '😑', '😯', '😦', '😧', '😮', '😲',
                                    '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢',
                                    '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '💩',
                                    '👻', '💀', '☠️', '👽', '👾', '🤖', '😺', '😸',
                                    '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈',
                                    '🙉', '🙊', '💌', '💘', '💝', '💖', '💗', '💙',
                                    '💚', '❤️', '🧡', '💛', '💜', '🖤', '💯', '💢',
                                    '💥', '💫', '💦', '💨', '🕳️', '💬', '🗨️', '🗯️',
                                    '💭', '💤', '💮', '💯', '🎵', '🎶', '💤', '💤'
                                ].map((emoji, index) => (
                                    <Button
                                        key={index}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 p-0 text-lg hover:bg-accent hover:scale-110 transition-all duration-200"
                                        onClick={() => insertEmoji(emoji)}
                                        disabled={disabled || isUploading}
                                    >
                                        {emoji}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Hidden file inputs */}
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileSelection(e.target.files, 'file')}
                    accept="*/*"
                />
                <input
                    ref={imageInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileSelection(e.target.files, 'image')}
                    accept="image/*"
                />

                {/* Text Input */}
                <div className="flex-1 relative">
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
                            "min-h-[40px] max-h-32 resize-none pr-12 leading-relaxed transition-all duration-200",
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
                        "h-10 w-10 transition-all duration-200",
                        canSend && "hover:scale-105"
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
