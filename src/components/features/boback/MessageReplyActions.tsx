"use client";

import { Button } from "@/components/ui/button";
import { Reply, Heart } from "lucide-react";
import { Message } from "@/types/customer.types";
import { cn } from "@/lib/utils";

interface MessageReplyActionsProps {
    message: Message;
    isOwnMessage: boolean;
    onReplyToMessage?: (message: Message) => void;
    onToggleReaction?: (message: Message, reactionCode: string) => void;
    className?: string;
}

export function MessageReplyActions({
    message,
    isOwnMessage,
    onReplyToMessage,
    onToggleReaction,
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

            {/* Like/Heart Button - Available for all messages */}
            <Button
                variant="ghost"
                size="sm"
                className={cn(
                    "h-6 w-6 p-0 hover:bg-accent/50",
                    message.reactions?.some(r => r.emoji === '❤️' || r.emoji === '♥️') && "text-red-500"
                )}
                onClick={() => onToggleReaction?.(message, 'heart')}
                title="Thích tin nhắn"
            >
                <Heart className={cn(
                    "h-3 w-3",
                    message.reactions?.some(r => r.emoji === '❤️' || r.emoji === '♥️') && "fill-current"
                )} />
            </Button>
        </div>
    );
}
