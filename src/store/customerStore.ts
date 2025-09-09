// store/customerStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
    ChatMessage,
    Contact,
    UserProfile,
    CustomerNotification,
    ChatSettings,
    Post,
    Comment,
    CustomerNavItem,
    Conversation,
    Message
} from '@/types/customer.types';

interface CustomerState {
    // Current active chat
    activeChatId: string | null;
    activeChatType: 'direct' | null;

    // Navigation
    activeNavItem: CustomerNavItem;
    isSidebarOpen: boolean;

    // Data
    contacts: Contact[];
    conversations: Conversation[];
    messages: Record<number, Message[]>; // conversationId -> messages
    notifications: CustomerNotification[];
    unreadCount: number;
    userProfile: UserProfile | null;
    posts: Post[];

    // UI State
    isSearchOpen: boolean;
    isSettingsOpen: boolean;
    isProfileOpen: boolean;
    isCreatePostOpen: boolean;

    // Loading states
    isLoadingContacts: boolean;
    isLoadingPosts: boolean;
    isPageTransitioning: boolean;

    // Settings
    settings: ChatSettings;

    // Actions
    setActiveChat: (chatId: string, type: 'direct') => void;
    clearActiveChat: () => void;
    setActiveNavItem: (item: CustomerNavItem) => void;

    // Chat actions
    startDirectChat: (userId: string) => Promise<{ success: boolean; conversationId?: string; conversation?: Conversation; message?: string }>;
    refreshConversations: () => Promise<{ success: boolean; conversations?: Conversation[]; message?: string }>;

    // Contacts
    setContacts: (contacts: Contact[]) => void;
    addContact: (contact: Contact) => void;
    updateContact: (contactId: string, updates: Partial<Contact>) => void;
    removeContact: (contactId: string) => void;

    // Conversations
    setConversations: (conversations: Conversation[]) => void;
    addConversation: (conversation: Conversation) => void;
    updateConversation: (conversationId: number, updates: Partial<Conversation>) => void;
    removeConversation: (conversationId: number) => void;
    markConversationAsRead: (conversationId: number) => Promise<void>;

    // Messages
    setMessages: (conversationId: number, messages: Message[]) => void;
    addMessage: (conversationId: number, message: Message) => void;
    updateMessage: (conversationId: number, messageId: string, updates: Partial<Message>) => void;
    removeMessage: (conversationId: number, messageId: string) => void;
    clearMessages: (conversationId: number) => void;
    markMessagesAsRead: (conversationId: number, messageIds: string[]) => void;

    // Posts
    setPosts: (posts: Post[]) => void;
    addPost: (post: Post) => void;
    updatePost: (postId: string, updates: Partial<Post>) => void;
    removePost: (postId: string) => void;
    likePost: (postId: string) => void;
    unlikePost: (postId: string) => void;

    // Notifications
    setNotifications: (notifications: CustomerNotification[]) => void;
    addNotification: (notification: CustomerNotification) => void;
    markNotificationAsRead: (notificationId: string) => void;
    markAllNotificationsAsRead: () => void;
    removeNotification: (notificationId: string) => void;
    setUnreadCount: (count: number) => void;

    // User Profile
    setUserProfile: (profile: UserProfile) => void;
    updateUserProfile: (updates: Partial<UserProfile>) => void;

    // UI Actions
    toggleSidebar: () => void;
    toggleSearch: () => void;
    toggleSettings: () => void;
    toggleProfile: () => void;
    toggleCreatePost: () => void;

    // Loading actions
    setLoadingContacts: (loading: boolean) => void;
    setLoadingPosts: (loading: boolean) => void;
    setPageTransitioning: (loading: boolean) => void;

    // Settings actions
    updateSettings: (updates: Partial<ChatSettings>) => void;

    // Reset
    reset: () => void;
}

// Default settings
const defaultSettings: ChatSettings = {
    theme: 'light',
    notifications: {
        sound: true,
        desktop: true,
        mentions: true,
        groupMessages: false,
        postNotifications: true
    },
    privacy: {
        showOnlineStatus: true,
        showLastSeen: true,
        allowFriendRequests: true,
        allowGroupInvites: false
    },
    appearance: {
        fontSize: 'medium',
        compactMode: false,
        showAvatars: true
    }
};

export const useCustomerStore = create<CustomerState>()(
    devtools(
        (set, get) => ({
            // Initial state
            activeChatId: null,
            activeChatType: null,
            activeNavItem: 'chats',
            isSidebarOpen: true,
            contacts: [],
            conversations: [],
            messages: {},
            notifications: [],
            unreadCount: 0,
            userProfile: null,
            posts: [],
            isSearchOpen: false,
            isSettingsOpen: false,
            isProfileOpen: false,
            isCreatePostOpen: false,
            isLoadingContacts: false,
            isLoadingPosts: false,
            isPageTransitioning: false,
            settings: defaultSettings,

            // Chat actions
            setActiveChat: (chatId, type) => set({ activeChatId: chatId, activeChatType: type }),
            clearActiveChat: () => set({ activeChatId: null, activeChatType: null }),
            setActiveNavItem: (item) => set({ activeNavItem: item }),

            // Contacts actions
            setContacts: (contacts) => set({ contacts }),
            addContact: (contact) => set((state) => ({
                contacts: [...state.contacts, contact]
            })),
            updateContact: (contactId, updates) => set((state) => ({
                contacts: state.contacts.map(contact =>
                    contact.id === contactId ? { ...contact, ...updates } : contact
                )
            })),
            removeContact: (contactId) => set((state) => ({
                contacts: state.contacts.filter(contact => contact.id !== contactId)
            })),

            // Conversations actions
            setConversations: (conversations) => set({ conversations }),
            addConversation: (conversation) => set((state) => ({
                conversations: [conversation, ...state.conversations]
            })),
            updateConversation: (conversationId, updates) => set((state) => ({
                conversations: state.conversations.map(conversation =>
                    conversation.conversationId === conversationId ? { ...conversation, ...updates } : conversation
                )
            })),
            removeConversation: (conversationId) => set((state) => ({
                conversations: state.conversations.filter(conversation => conversation.conversationId !== conversationId)
            })),
            markConversationAsRead: async (conversationId) => {
                try {
                    // Import API function to avoid circular dependency
                    const { markConversationAsRead: markAsReadApi } = await import('@/lib/customer-api-client');

                    const response = await markAsReadApi(conversationId);

                    if (response.success) {
                        // Update local state only if API call succeeds
                        set((state) => ({
                            conversations: state.conversations.map(conversation =>
                                conversation.conversationId === conversationId
                                    ? { ...conversation, unreadCount: 0 }
                                    : conversation
                            )
                        }));
                    } else {
                        console.error('Failed to mark conversation as read:', response.message);
                    }
                } catch (error) {
                    console.error('Error marking conversation as read:', error);
                }
            },

            // Messages actions
            setMessages: (conversationId, messages) => set((state) => {
                // Đảm bảo tất cả tin nhắn có trường isRead với giá trị mặc định
                const messagesWithDefaults = messages.map(message => ({
                    ...message,
                    isRead: message.isRead ?? false
                }));


                return {
                    messages: { ...state.messages, [conversationId]: messagesWithDefaults }
                };
            }),
            addMessage: (conversationId, message) => set((state) => {
                const existingMessages = state.messages[conversationId] || [];

                // Kiểm tra tin nhắn đã tồn tại bằng ID
                const messageExists = existingMessages.some(existing => existing.id === message.id);

                if (messageExists) {
                    console.warn(`[Store] Message with ID ${message.id} already exists, skipping...`);
                    return state; // Không thêm duplicate
                }

                // Đảm bảo tin nhắn có trường isRead với giá trị mặc định
                const messageWithDefaults = {
                    ...message,
                    isRead: message.isRead ?? false
                };


                // Thêm tin nhắn mới
                return {
                    messages: {
                        ...state.messages,
                        [conversationId]: [...existingMessages, messageWithDefaults]
                    }
                };
            }),
            updateMessage: (conversationId, messageId, updates) => set((state) => ({
                messages: {
                    ...state.messages,
                    [conversationId]: (state.messages[conversationId] || []).map(message => {
                        if (message.id === messageId) {
                            const updatedMessage = { ...message, ...updates };
                            // Đảm bảo isRead có giá trị mặc định nếu không được cung cấp
                            if (updates.isRead === undefined && message.isRead === undefined) {
                                updatedMessage.isRead = false;
                            }
                            return updatedMessage;
                        }
                        return message;
                    })
                }
            })),
            removeMessage: (conversationId, messageId) => set((state) => ({
                messages: {
                    ...state.messages,
                    [conversationId]: (state.messages[conversationId] || []).filter(
                        message => message.id !== messageId
                    )
                }
            })),
            clearMessages: (conversationId) => set((state) => ({
                messages: { ...state.messages, [conversationId]: [] }
            })),
            markMessagesAsRead: (conversationId, messageIds) => set((state) => {
                const updatedMessages = {
                    ...state.messages,
                    [conversationId]: (state.messages[conversationId] || []).map(message => {
                        if (messageIds.includes(message.id)) {
                            return { ...message, isRead: true };
                        }
                        return message;
                    })
                };
                return { messages: updatedMessages };
            }),

            // Posts actions
            setPosts: (posts) => set({ posts }),
            addPost: (post) => set((state) => ({
                posts: [post, ...state.posts]
            })),
            updatePost: (postId, updates) => set((state) => ({
                posts: state.posts.map(post =>
                    post.id === postId ? { ...post, ...updates } : post
                )
            })),
            removePost: (postId) => set((state) => ({
                posts: state.posts.filter(post => post.id !== postId)
            })),
            likePost: (postId) => set((state) => ({
                posts: state.posts.map(post =>
                    post.id === postId ? { ...post, isLiked: true, likeCount: post.likeCount + 1 } : post
                )
            })),
            unlikePost: (postId) => set((state) => ({
                posts: state.posts.map(post =>
                    post.id === postId ? { ...post, isLiked: false, likeCount: Math.max(0, post.likeCount - 1) } : post
                )
            })),

            // Notifications actions
            setNotifications: (notifications) => set({ notifications }),
            addNotification: (notification) => set((state) => ({
                notifications: [notification, ...state.notifications]
            })),
            markNotificationAsRead: (notificationId) => set((state) => ({
                notifications: state.notifications.map(notification =>
                    notification.id === notificationId ? { ...notification, isRead: true } : notification
                )
            })),
            markAllNotificationsAsRead: () => set((state) => ({
                notifications: state.notifications.map(notification => ({ ...notification, isRead: true }))
            })),
            removeNotification: (notificationId) => set((state) => ({
                notifications: state.notifications.filter(notification => notification.id !== notificationId)
            })),
            setUnreadCount: (count) => set({ unreadCount: count }),

            // User profile actions
            setUserProfile: (profile) => set({ userProfile: profile }),
            updateUserProfile: (updates) => set((state) => ({
                userProfile: state.userProfile ? { ...state.userProfile, ...updates } : null
            })),

            // UI actions
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
            toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
            toggleProfile: () => set((state) => ({ isProfileOpen: !state.isProfileOpen })),
            toggleCreatePost: () => set((state) => ({ isCreatePostOpen: !state.isCreatePostOpen })),

            // Loading actions
            setLoadingContacts: (loading) => set({ isLoadingContacts: loading }),
            setLoadingPosts: (loading) => set({ isLoadingPosts: loading }),
            setPageTransitioning: (loading: boolean) => set({ isPageTransitioning: loading }),

            // Settings actions
            updateSettings: (updates) => set((state) => ({
                settings: { ...state.settings, ...updates }
            })),

            // Chat actions
            startDirectChat: async (userId: string) => {
                try {
                    // Import API function to avoid circular dependency
                    const { findOrCreateConversation } = await import('@/lib/customer-api-client');

                    const response = await findOrCreateConversation(userId);

                    if (response.success) {
                        const { conversationId, partner } = response.data;

                        // Create a new conversation object based on API response
                        const newConversation: Conversation = {
                            conversationId: conversationId,
                            conversationType: 'Direct',
                            displayName: partner.fullName,
                            avatarUrl: partner.avatarUrl,
                            lastMessagePreview: '',
                            lastMessageType: 'Text',
                            lastMessageTimestamp: new Date().toISOString(),
                            unreadCount: 0
                        };

                        // Add conversation to store
                        set((state) => ({
                            conversations: [newConversation, ...state.conversations],
                            activeChatId: conversationId.toString(),
                            activeChatType: 'direct'
                        }));

                        return { success: true, conversationId, conversation: newConversation };
                    } else {
                        console.error('Failed to create conversation:', response.message);
                        return { success: false, message: response.message };
                    }
                } catch (error) {
                    console.error('Error starting direct chat:', error);
                    return { success: false, message: 'Có lỗi xảy ra khi tạo cuộc trò chuyện' };
                }
            },

            refreshConversations: async () => {
                try {
                    // Import API function to avoid circular dependency
                    const { getConversations } = await import('@/lib/customer-api-client');

                    const response = await getConversations('direct');

                    if (response.success) {
                        set({ conversations: response.data });
                        return { success: true, conversations: response.data };
                    } else {
                        console.error('Failed to refresh conversations:', response.message);
                        return { success: false, message: response.message };
                    }
                } catch (error) {
                    console.error('Error refreshing conversations:', error);
                    return { success: false, message: 'Có lỗi xảy ra khi tải danh sách trò chuyện' };
                }
            },

            // Reset
            reset: () => set({
                activeChatId: null,
                activeChatType: null,
                activeNavItem: 'chats',
                contacts: [],
                conversations: [],
                messages: {},
                notifications: [],
                unreadCount: 0,
                userProfile: null,
                posts: [],
                isSidebarOpen: true,
                isSearchOpen: false,
                isSettingsOpen: false,
                isProfileOpen: false,
                isCreatePostOpen: false,
                isLoadingContacts: false,
                isLoadingPosts: false,
                isPageTransitioning: false,
                settings: defaultSettings
            })
        }),
        {
            name: 'customer-store'
        }
    )
);
