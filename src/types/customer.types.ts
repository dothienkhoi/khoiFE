// types/customer.types.ts

// =================================================================
// CUSTOMER CHAT APP TYPES
// =================================================================

/**
 * Chat Message Types
 */
export interface ChatMessage {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    timestamp: string;
    messageType: 'text' | 'image' | 'file' | 'video' | 'audio' | 'system';
    isEdited?: boolean;
    replyTo?: {
        messageId: string;
        content: string;
        senderName: string;
    };
    attachments?: Array<{
        fileId: number;
        fileName: string;
        storageUrl: string;
        fileType: string;
        fileSize: number;
    }>;
}

/**
 * User Profile Types
 */
export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    avatarUrl?: string;
    status: 'online' | 'offline' | 'away' | 'busy';
    lastSeen?: string;
    bio?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    username?: string;
    coverPhoto?: string;
    followersCount?: number;
    followingCount?: number;
    postsCount?: number;
    // Additional fields from API response
    twoFactorEnabled?: boolean;
    emailConfirmed?: boolean;
    isActive?: boolean;
    createdAt?: string;
    roles?: string[];
}

/**
 * Friend/Contact Types
 */
export interface Contact {
    id: string;
    user: UserProfile;
    isOnline: boolean;
    lastSeen?: string;
    unreadCount: number;
    lastMessage?: {
        content: string;
        timestamp: string;
        isFromMe: boolean;
    };
}

/**
 * Post Types
 */
export interface Post {
    id: string;
    postId?: number; // Database ID
    title: string;
    content: string;
    contentMarkdown?: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    author?: {
        userId: string;
        displayName: string;
        avatarUrl?: string;
    };
    groupId: string;
    images?: string[];
    likeCount: number;
    commentCount: number;
    sharesCount: number;
    isLiked?: boolean;
    isShared?: boolean;
    isPinned?: boolean;
    isDeleted?: boolean;
    createdAt: string;
    updatedAt?: string;
    tags?: string[];
    location?: string;
    attachmentFileIds?: string[];
}

/**
 * Comment Types
 */
export interface Comment {
    id: string;
    commentId?: number; // Database ID
    content: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    author?: {
        userId: string;
        displayName: string;
        avatarUrl?: string;
    };
    postId: string;
    parentCommentId?: number;
    likeCount: number;
    isLiked?: boolean;
    createdAt: string;
    updatedAt?: string;
    replies?: Comment[];
}

/**
 * Notification Types for Customer
 */
export interface CustomerNotification {
    id: string;
    contentPreview: string;
    isRead: boolean;
    createdAt: string;
    relatedObject?: {
        objectType: string;
        objectId: string;
        navigateUrl: string;
    };
    type: 'NewMessage' | 'GroupInvitation' | 'FriendRequest' | 'Mention' | 'System' | 'PostLike' | 'PostComment';
}

/**
 * Search Results
 */
export interface SearchResult {
    users: UserProfile[];
    messages: ChatMessage[];
    posts: Post[];
}

/**
 * File Upload Types
 */
export interface FileUpload {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    uploadedAt: string;
    uploadedBy: string;
}

/**
 * Group Member Types
 */
export interface GroupMember {
    userId: string;
    fullName: string;
    avatarUrl?: string;
    role: 'admin' | 'moderator' | 'member' | 'Admin' | 'Moderator' | 'Member';
    presenceStatus: 'Online' | 'Offline' | 'Away' | 'Busy';
    joinedAt: string;
    lastSeen?: string;
}

/**
 * Chat Settings Types
 */
export interface ChatSettings {
    theme: 'light' | 'dark' | 'auto';
    notifications: {
        sound: boolean;
        desktop: boolean;
        mentions: boolean;
        groupMessages: boolean;
        postNotifications: boolean;
    };
    privacy: {
        showOnlineStatus: boolean;
        showLastSeen: boolean;
        allowFriendRequests: boolean;
        allowGroupInvites: boolean;
    };
    appearance: {
        fontSize: 'small' | 'medium' | 'large';
        compactMode: boolean;
        showAvatars: boolean;
    };
}

/**
 * Real-time Event Types
 */
export interface RealtimeEvent {
    type: 'message' | 'typing' | 'online_status' | 'notification' | 'post_update';
    data: any;
    timestamp: string;
}

/**
 * API Response Types for Customer
 */
export interface CustomerApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    errors?: string[];
}

/**
 * Paginated Results for Customer
 */
export interface CustomerPagedResult<T> {
    items: T[];
    pageNumber: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

/**
 * Conversation Types
 */
export interface ConversationPartner {
    userId: string;
    fullName: string;
    avatarUrl: string;
    presenceStatus: 'Online' | 'Offline' | 'Away' | 'Busy';
}

export interface Conversation {
    conversationId: number;
    conversationType: 'Direct' | 'Group';
    displayName: string;
    avatarUrl: string;
    lastMessagePreview: string;
    lastMessageType: 'Text' | 'Image' | 'File' | 'System' | 'Poll';
    lastMessageTimestamp: string;
    unreadCount: number;
}

export interface CreateConversationResponse {
    conversationId: number;
    partner: ConversationPartner;
    wasCreated: boolean;
}

/**
 * Message Types
 */
export interface MessageSender {
    userId: string;
    displayName: string;
    avatarUrl: string | null;
}

export interface MessageAttachment {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
}

export interface MessageReaction {
    id: string;
    emoji: string;
    userId: string;
    displayName: string;
}

export interface Message {
    id: string;
    conversationId: number;
    sender: MessageSender;
    content: string;
    messageType: 'Text' | 'Image' | 'File' | 'System' | 'Poll';
    sentAt: string;
    isDeleted: boolean;
    attachments: MessageAttachment[];
    reactions: MessageReaction[];
    parentMessageId: string | null;
    parentMessage: Message | null;
}

export interface MessageHistoryResponse {
    messages: Message[];
    hasMore: boolean;
    nextCursor: string | null;
}

/**
 * Navigation Types
 */
export type CustomerNavItem = 'chats' | 'groups' | 'communities' | 'profile' | 'notifications';

/**
 * Group Categories
 */
export interface GroupCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
}
