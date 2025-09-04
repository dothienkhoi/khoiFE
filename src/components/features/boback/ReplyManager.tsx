"use client";

import { Message, ParentMessage } from "@/types/customer.types";
import { ReplyPreview } from "./ReplyPreview";
import { ReplyMessage } from "./ReplyMessage";
import { MessageReplyActions } from "./MessageReplyActions";

interface ReplyManagerProps {
    // For ReplyPreview (in input)
    replyTo?: Message | null;
    onCancelReply?: () => void;

    // For ReplyMessage (in message list)
    parentMessage?: ParentMessage | null;
    parentMessageId?: string | null; // Thêm prop này
    isOwnMessage?: boolean;
    onScrollToMessage?: (messageId: string) => void;

    // For MessageReplyActions
    message: Message;
    onReplyToMessage?: (message: Message) => void;
    onToggleReaction?: (message: Message, reactionCode: string) => void;

    // Display mode
    mode: 'preview' | 'message' | 'actions';
    className?: string;
}

export function ReplyManager({
    replyTo,
    onCancelReply,
    parentMessage,
    parentMessageId,
    isOwnMessage = false,
    onScrollToMessage,
    message,
    onReplyToMessage,
    onToggleReaction,
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
                    parentMessageId={parentMessageId}
                    className={className}
                />
            ) : null;

        case 'actions':
            return (
                <MessageReplyActions
                    message={message}
                    isOwnMessage={isOwnMessage}
                    onReplyToMessage={onReplyToMessage}
                    onToggleReaction={onToggleReaction}
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

export function ReplyMessageWrapper({ parentMessage, parentMessageId, isOwnMessage, onScrollToMessage, className }: {
    parentMessage?: ParentMessage | null;
    parentMessageId?: string | null;
    isOwnMessage?: boolean;
    onScrollToMessage?: (messageId: string) => void;
    className?: string;
}) {
    return (
        <ReplyManager
            parentMessage={parentMessage}
            parentMessageId={parentMessageId}
            isOwnMessage={isOwnMessage}
            onScrollToMessage={onScrollToMessage}
            message={{} as Message} // Dummy for type safety
            mode="message"
            className={className}
        />
    );
}

export function ReplyActionsWrapper({ message, isOwnMessage, onReplyToMessage, onToggleReaction, className }: {
    message: Message;
    isOwnMessage: boolean;
    onReplyToMessage?: (message: Message) => void;
    onToggleReaction?: (message: Message, reactionCode: string) => void;
    className?: string;
}) {
    return (
        <ReplyManager
            message={message}
            isOwnMessage={isOwnMessage}
            onReplyToMessage={onReplyToMessage}
            onToggleReaction={onToggleReaction}
            mode="actions"
            className={className}
        />
    );
}
