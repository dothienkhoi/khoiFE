// lib/utils/realTimeUtils.ts

import { Message } from "@/types/customer.types";
import { getMessagePreview } from "./messageUtils";

/**
 * Convert numeric message type to string
 */
export const convertMessageType = (type: number): 'Text' | 'Image' | 'File' | 'System' | 'Poll' => {
    switch (type) {
        case 1: return 'Text';
        case 2: return 'Image';
        case 3: return 'File';
        case 4: return 'System';
        case 5: return 'Poll';
        default: return 'Text';
    }
};

/**
 * Create Message object from messageDto
 */
export const createMessageFromDto = (messageDto: any): Message => {
    const message = {
        id: messageDto.id,
        conversationId: messageDto.conversationId,
        content: messageDto.content,
        messageType: convertMessageType(messageDto.messageType),
        sender: {
            userId: messageDto.sender.userId,
            displayName: messageDto.sender.displayName,
            avatarUrl: messageDto.sender.avatarUrl
        },
        sentAt: messageDto.sentAt,
        isDeleted: messageDto.isDeleted || false,
        isRead: false, // Always start as unread for new messages
        attachments: messageDto.attachments || [],
        reactions: messageDto.reactions || [],
        parentMessageId: messageDto.parentMessageId,
        parentMessage: messageDto.parentMessage
    };


    return message;
};

/**
 * Get message preview for conversation
 */
export const getMessagePreviewForConversation = (messageDto: any): string => {
    return getMessagePreview(
        convertMessageType(messageDto.messageType),
        messageDto.content,
        messageDto.sender.displayName
    );
};

/**
 * Check if conversation is direct (not group)
 */
export const isDirectConversation = (conversations: any[], conversationId: number): boolean => {
    const conversation = conversations.find(c => c.conversationId === conversationId);
    return conversation && conversation.conversationType !== 'Group';
};

/**
 * Check if user is currently viewing the conversation
 */
export const isCurrentlyViewing = (activeChatId: string | null, activeChatType: string | null, conversationId: number): boolean => {
    return activeChatId === conversationId.toString() && activeChatType === 'direct';
};
