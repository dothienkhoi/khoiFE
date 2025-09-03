"use client";

import { Button } from "@/components/ui/button";
import { Reply, Heart } from "lucide-react";
import { Message } from "@/types/customer.types";

interface MessageReplyActionsProps {
    message: Message;
    isOwnMessage: boolean;
    onReplyToMessage?: (message: Message) => void;
    className?: string;
}

export function MessageReplyActions({
    message,
    isOwnMessage,
    onReplyToMessage,
    className
}: MessageReplyActionsProps) {
    return (
        <div className={`flex items-center gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity ${className || ''}`}>
            {/* Reply Button - Available for all messages */}
            <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-accent/50"
                onClick={() => onReplyToMessage?.(message)}
                title="Trả lời tin nhắn"
            >
                <Reply className="h-3 w-3" />
            </Button>

            {/* Additional actions - Only for own messages */}
            {isOwnMessage && (
                <>
                    {/* Like/Heart Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-accent/50"
                        title="Thích tin nhắn"
                    >
                        <Heart className="h-3 w-3" />
                    </Button>
                </>
            )}
        </div>
    );
}
