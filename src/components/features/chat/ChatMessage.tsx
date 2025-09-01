// components/features/chat/ChatMessage.tsx
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    MoreHorizontal,
    Reply,
    Edit,
    Trash2,
    Copy,
    Check,
    Clock,
    Download,
    FileText,
    Image,
    Video,
    Music
} from "lucide-react";
import { ChatMessage as ChatMessageType } from "@/types/customer.types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ChatMessageProps {
    message: ChatMessageType;
    isOwnMessage: boolean;
    showAvatar: boolean;
    onReply?: (message: ChatMessageType) => void;
    onEdit?: (message: ChatMessageType) => void;
    onDelete?: (messageId: string) => void;
}

export function ChatMessage({
    message,
    isOwnMessage,
    showAvatar,
    onReply,
    onEdit,
    onDelete
}: ChatMessageProps) {
    const [showActions, setShowActions] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return format(date, 'HH:mm', { locale: vi });
    };

    const renderMessageContent = () => {
        switch (message.messageType) {
            case 'text':
                return (
                    <div className="break-words">
                        {message.replyTo && (
                            <div className="mb-2 p-2 bg-muted/50 rounded text-sm border-l-2 border-primary">
                                <p className="font-medium text-xs text-muted-foreground">
                                    {message.replyTo.senderName}
                                </p>
                                <p className="text-muted-foreground truncate">
                                    {message.replyTo.content}
                                </p>
                            </div>
                        )}
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                );

            case 'image':
                return (
                    <div className="space-y-2">
                        {message.replyTo && (
                            <div className="p-2 bg-muted/50 rounded text-sm border-l-2 border-primary">
                                <p className="font-medium text-xs text-muted-foreground">
                                    {message.replyTo.senderName}
                                </p>
                                <p className="text-muted-foreground truncate">
                                    {message.replyTo.content}
                                </p>
                            </div>
                        )}
                        {/* Handle attachments from API response */}
                        {message.attachments && message.attachments.length > 0 ? (
                            <div className="space-y-2">
                                {message.attachments.map((attachment, index) => (
                                    <div key={index} className="relative group/image">
                                        <img
                                            src={attachment.storageUrl}
                                            alt={attachment.fileName}
                                            className="max-w-xs max-h-64 object-contain rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                            onClick={() => window.open(attachment.storageUrl, '_blank')}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover/image:opacity-100">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="bg-white/90 text-black hover:bg-white shadow-lg"
                                                onClick={() => window.open(attachment.storageUrl, '_blank')}
                                            >
                                                <Image className="h-4 w-4 mr-1" />
                                                Xem ảnh
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Fallback for old format */
                            <div className="relative group/image">
                                <img
                                    src={message.content}
                                    alt="Image"
                                    className="max-w-xs max-h-64 object-contain rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                    onClick={() => window.open(message.content, '_blank')}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover/image:opacity-100">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="bg-white/90 text-black hover:bg-white shadow-lg"
                                        onClick={() => window.open(message.content, '_blank')}
                                    >
                                        <Image className="h-4 w-4 mr-1" />
                                        Xem ảnh
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'file':
                return (
                    <div className="space-y-2">
                        {message.replyTo && (
                            <div className="p-2 bg-muted/50 rounded text-sm border-l-2 border-primary">
                                <p className="font-medium text-xs text-muted-foreground">
                                    {message.replyTo.senderName}
                                </p>
                                <p className="text-muted-foreground truncate">
                                    {message.replyTo.content}
                                </p>
                            </div>
                        )}
                        {/* Handle attachments from API response */}
                        {message.attachments && message.attachments.length > 0 ? (
                            <div className="space-y-2">
                                {message.attachments.map((attachment, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border hover:bg-muted/70 transition-colors">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            {attachment.fileType.startsWith('image/') ? (
                                                <Image className="w-5 h-5 text-blue-500" />
                                            ) : attachment.fileType.startsWith('video/') ? (
                                                <Video className="w-5 h-5 text-purple-500" />
                                            ) : attachment.fileType.startsWith('audio/') ? (
                                                <Music className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <FileText className="w-5 h-5 text-primary" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate text-sm">{attachment.fileName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="hover:bg-primary/10"
                                            onClick={() => window.open(attachment.storageUrl, '_blank')}
                                        >
                                            <Download className="h-4 w-4 mr-1" />
                                            Tải xuống
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Fallback for old format */
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border hover:bg-muted/70 transition-colors">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-sm">File đính kèm</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {message.content}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="hover:bg-primary/10"
                                    onClick={() => {
                                        // Extract URL from message content if it contains one
                                        const urlMatch = message.content.match(/\((https?:\/\/[^)]+)\)/);
                                        if (urlMatch) {
                                            window.open(urlMatch[1], '_blank');
                                        }
                                    }}
                                >
                                    <Download className="h-4 w-4 mr-1" />
                                    Tải xuống
                                </Button>
                            </div>
                        )}
                    </div>
                );

            case 'video':
                return (
                    <div className="space-y-2">
                        {message.replyTo && (
                            <div className="p-2 bg-muted/50 rounded text-sm border-l-2 border-primary">
                                <p className="font-medium text-xs text-muted-foreground">
                                    {message.replyTo.senderName}
                                </p>
                                <p className="text-muted-foreground truncate">
                                    {message.replyTo.content}
                                </p>
                            </div>
                        )}
                        {/* Handle attachments from API response */}
                        {message.attachments && message.attachments.length > 0 ? (
                            <div className="space-y-2">
                                {message.attachments.map((attachment, index) => (
                                    <div key={index} className="relative group/video">
                                        <video
                                            src={attachment.storageUrl}
                                            controls
                                            className="max-w-xs max-h-64 rounded-lg cursor-pointer"
                                            preload="metadata"
                                        />
                                        <div className="absolute top-2 right-2 bg-black/50 rounded-lg p-1">
                                            <Video className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Fallback for old format */
                            <div className="relative group/video">
                                <video
                                    src={message.content}
                                    controls
                                    className="max-w-xs max-h-64 rounded-lg cursor-pointer"
                                    preload="metadata"
                                />
                                <div className="absolute top-2 right-2 bg-black/50 rounded-lg p-1">
                                    <Video className="h-4 w-4 text-white" />
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'audio':
                return (
                    <div className="space-y-2">
                        {message.replyTo && (
                            <div className="p-2 bg-muted/50 rounded text-sm border-l-2 border-primary">
                                <p className="font-medium text-xs text-muted-foreground">
                                    {message.replyTo.senderName}
                                </p>
                                <p className="text-muted-foreground truncate">
                                    {message.replyTo.content}
                                </p>
                            </div>
                        )}
                        {/* Handle attachments from API response */}
                        {message.attachments && message.attachments.length > 0 ? (
                            <div className="space-y-2">
                                {message.attachments.map((attachment, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                            <Music className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate text-sm">{attachment.fileName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                        <audio controls className="h-8">
                                            <source src={attachment.storageUrl} type={attachment.fileType} />
                                        </audio>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Fallback for old format */
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                    <Music className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-sm">Audio</p>
                                </div>
                                <audio controls className="h-8">
                                    <source src={message.content} />
                                </audio>
                            </div>
                        )}
                    </div>
                );

            case 'system':
                return (
                    <div className="text-center">
                        <Badge variant="secondary" className="text-xs">
                            {message.content}
                        </Badge>
                    </div>
                );

            default:
                return <p>{message.content}</p>;
        }
    };

    if (message.messageType === 'system') {
        return (
            <div className="flex justify-center my-4">
                {renderMessageContent()}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "group flex gap-3 mb-4",
                isOwnMessage ? "flex-row-reverse" : "flex-row"
            )}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* Avatar */}
            {showAvatar && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={message.senderAvatar} />
                    <AvatarFallback>
                        {message.senderName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                </Avatar>
            )}

            {/* Message Content */}
            <div className={cn(
                "flex flex-col max-w-[70%]",
                isOwnMessage ? "items-end" : "items-start"
            )}>
                {/* Sender Name (for group chats) */}
                {!isOwnMessage && !showAvatar && (
                    <p className="text-xs text-muted-foreground mb-1 px-2">
                        {message.senderName}
                    </p>
                )}

                {/* Message Bubble */}
                <div className={cn(
                    "relative group/message px-3 py-2",
                    isOwnMessage
                        ? "text-foreground"
                        : "bg-muted"
                )}>
                    {renderMessageContent()}

                    {/* Message Actions */}
                    {showActions && (
                        <div className={cn(
                            "absolute top-0 flex items-center gap-1 p-1 rounded bg-background/90 border shadow-sm",
                            isOwnMessage ? "-left-2 transform -translate-x-full" : "-right-2 transform translate-x-full"
                        )}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => onReply?.(message)}
                            >
                                <Reply className="h-3 w-3" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={handleCopy}
                            >
                                {copied ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                    <Copy className="h-3 w-3" />
                                )}
                            </Button>

                            {isOwnMessage && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => onEdit?.(message)}
                                    >
                                        <Edit className="h-3 w-3" />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-destructive"
                                        onClick={() => onDelete?.(message.id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Message Info */}
                <div className={cn(
                    "flex items-center gap-2 mt-1 px-2",
                    isOwnMessage ? "justify-end" : "justify-start"
                )}>
                    <span className="text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                    </span>

                    {isOwnMessage && (
                        <div className="flex items-center gap-1">
                            {message.isEdited && (
                                <span className="text-xs text-muted-foreground">(đã chỉnh sửa)</span>
                            )}
                            <Clock className="h-3 w-3 text-muted-foreground" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
