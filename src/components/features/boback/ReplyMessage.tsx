"use client";

import { cn } from "@/lib/utils";
import { Message } from "@/types/customer.types";

interface ReplyMessageProps {
    parentMessage: Message;
    isOwnMessage?: boolean;
    className?: string;
    onScrollToMessage?: (messageId: string) => void;
}

export function ReplyMessage({ parentMessage, isOwnMessage = false, className, onScrollToMessage }: ReplyMessageProps) {
    if (!parentMessage || !parentMessage.sender) return null;

    const handleClick = () => {
        if (onScrollToMessage && parentMessage.id) {
            onScrollToMessage(parentMessage.id);
        }
    };

    return (
        <div className={cn("", className)}>
            {/* Reply Header */}
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-primary/20">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-primary font-semibold text-xs">
                    Trả lời {parentMessage.sender.displayName || 'Người dùng'}
                </span>
            </div>

            {/* Original Message Content - Clickable */}
            <div
                className="bg-background/95 rounded-md p-2 border border-primary/20 shadow-sm cursor-pointer hover:bg-background/80 transition-colors"
                onClick={handleClick}
                title="Nhấp để xem tin nhắn gốc"
            >
                {parentMessage.content ? (
                    <p className="text-muted-foreground text-xs font-medium leading-relaxed">
                        {parentMessage.content}
                    </p>
                ) : parentMessage.attachments && parentMessage.attachments.length > 0 ? (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-muted rounded flex items-center justify-center">
                            <span className="text-[8px] text-muted-foreground">📎</span>
                        </div>
                        <span className="text-muted-foreground text-xs">
                            {parentMessage.attachments.length} tệp đính kèm
                        </span>
                    </div>
                ) : (
                    <p className="text-muted-foreground text-xs font-medium italic">
                        Tin nhắn không có nội dung
                    </p>
                )}
            </div>
        </div>
    );
}
