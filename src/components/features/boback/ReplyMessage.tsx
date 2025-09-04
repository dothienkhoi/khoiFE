"use client";

import { cn } from "@/lib/utils";
import { ParentMessage } from "@/types/customer.types";
import { FileText, Image } from "lucide-react";

interface ReplyMessageProps {
    parentMessage: ParentMessage;
    isOwnMessage?: boolean;
    className?: string;
    onScrollToMessage?: (messageId: string) => void;
    parentMessageId?: string | null; // Thêm prop này để truyền trực tiếp
}

export function ReplyMessage({ parentMessage, isOwnMessage = false, className, onScrollToMessage, parentMessageId }: ReplyMessageProps) {
    if (!parentMessage) return null;

    const handleClick = () => {
        const targetMessageId = parentMessageId || parentMessage.parentMessageId;

        if (onScrollToMessage && targetMessageId) {
            onScrollToMessage(targetMessageId);
        }
    };

    const renderContent = () => {
        // Kiểm tra loại tin nhắn để hiển thị phù hợp
        if (parentMessage.messageType === 'Image') {
            return (
                <div className="flex items-center gap-2">
                    <Image className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground text-xs">Hình ảnh</span>
                </div>
            );
        }

        if (parentMessage.messageType === 'File') {
            return (
                <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground text-xs">Tệp tin</span>
                </div>
            );
        }

        // Tin nhắn văn bản
        if (parentMessage.contentSnippet) {
            return (
                <p className="text-muted-foreground text-xs font-medium leading-relaxed">
                    {parentMessage.contentSnippet}
                </p>
            );
        }

        // Tin nhắn không có nội dung
        return (
            <p className="text-muted-foreground text-xs font-medium italic">
                Tin nhắn không có nội dung
            </p>
        );
    };

    return (
        <div className={cn("", className)}>
            {/* Reply Header */}
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-primary/20">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-primary font-semibold text-xs">
                    Trả lời {parentMessage.senderName || 'Người dùng'}
                </span>
            </div>

            {/* Original Message Content - Clickable */}
            <div
                className="bg-background/95 rounded-md p-2 border border-primary/20 shadow-sm cursor-pointer hover:bg-background/80 transition-colors"
                onClick={handleClick}
                title="Nhấp để xem tin nhắn gốc"
            >
                {renderContent()}
            </div>
        </div>
    );
}
