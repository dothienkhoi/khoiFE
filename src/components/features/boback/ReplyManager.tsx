"use client";

import { Message } from "@/types/customer.types";
import { ReplyPreview } from "./ReplyPreview";
import { ReplyMessage } from "./ReplyMessage";
import { MessageReplyActions } from "./MessageReplyActions";

interface ReplyManagerProps {
    // For ReplyPreview (in input)
    replyTo?: Message | null;
    onCancelReply?: () => void;

    // For ReplyMessage (in message list)
    parentMessage?: Message | null;
    isOwnMessage?: boolean;
    onScrollToMessage?: (messageId: string) => void;

    // For MessageReplyActions
    message: Message;
    onReplyToMessage?: (message: Message) => void;

    // Display mode
    mode: 'preview' | 'message' | 'actions';
    className?: string;
}

export function ReplyManager({
    replyTo,
    onCancelReply,
    parentMessage,
    isOwnMessage = false,
    onScrollToMessage,
    message,
    onReplyToMessage,
    mode,
    className
}: ReplyManagerProps) {
    switch (mode) {
        case 'preview':
            return replyTo ? (
                <ReplyPreview
                    replyTo={replyTo}
                    onCancelReply={onCancelReply}
                />
            ) : null;

        case 'message':
            return parentMessage ? (
                <ReplyMessage
                    parentMessage={parentMessage}
                    isOwnMessage={isOwnMessage}
                    onScrollToMessage={onScrollToMessage}
                    className={className}
                />
            ) : null;

        case 'actions':
            return (
                <MessageReplyActions
                    message={message}
                    isOwnMessage={isOwnMessage}
                    onReplyToMessage={onReplyToMessage}
                    className={className}
                />
            );

        default:
            return null;
    }
}

// Convenience components for specific use cases
export function ReplyPreviewWrapper({ replyTo, onCancelReply }: { replyTo?: Message | null; onCancelReply?: () => void }) {
    return (
        <ReplyManager
            replyTo={replyTo}
            onCancelReply={onCancelReply}
            message={{} as Message} // Dummy for type safety
            mode="preview"
        />
    );
}

export function ReplyMessageWrapper({ parentMessage, isOwnMessage, onScrollToMessage, className }: {
    parentMessage?: Message | null;
    isOwnMessage?: boolean;
    onScrollToMessage?: (messageId: string) => void;
    className?: string;
}) {
    return (
        <ReplyManager
            parentMessage={parentMessage}
            isOwnMessage={isOwnMessage}
            onScrollToMessage={onScrollToMessage}
            message={{} as Message} // Dummy for type safety
            mode="message"
            className={className}
        />
    );
}

export function ReplyActionsWrapper({ message, isOwnMessage, onReplyToMessage, className }: {
    message: Message;
    isOwnMessage: boolean;
    onReplyToMessage?: (message: Message) => void;
    className?: string;
}) {
    return (
        <ReplyManager
            message={message}
            isOwnMessage={isOwnMessage}
            onReplyToMessage={onReplyToMessage}
            mode="actions"
            className={className}
        />
    );
}
