// store/customerStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
    ChatMessage,
    ChatGroup,
    Contact,
    UserProfile,
    CustomerNotification,
    ChatSettings,
    Post,
    Comment,
    GroupCategory,
    CustomerNavItem,
    Conversation,
    Message
} from '@/types/customer.types';

interface CustomerState {
    // Current active chat/group
    activeChatId: string | null;
    activeChatType: 'direct' | 'group' | null;

    // Navigation
    activeNavItem: CustomerNavItem;
    isSidebarOpen: boolean;

    // Data
    contacts: Contact[];
    conversations: Conversation[];
    groups: ChatGroup[];
    myGroups: ChatGroup[];
    messages: Record<number, Message[]>; // conversationId -> messages
    notifications: CustomerNotification[];
    unreadCount: number;
    userProfile: UserProfile | null;
    posts: Post[];
    groupCategories: GroupCategory[];

    // UI State
    isSearchOpen: boolean;
    isSettingsOpen: boolean;
    isProfileOpen: boolean;
    isCreateGroupOpen: boolean;
    isCreatePostOpen: boolean;

    // Loading states
    isLoadingContacts: boolean;
    isLoadingGroups: boolean;
    isLoadingMessages: boolean;
    isLoadingPosts: boolean;
    isPageTransitioning: boolean;

    // Settings
    settings: ChatSettings;

    // Actions
    setActiveChat: (chatId: string, type: 'direct' | 'group') => void;
    clearActiveChat: () => void;
    setActiveNavItem: (item: CustomerNavItem) => void;

    // Chat actions
    startDirectChat: (userId: string) => Promise<{ success: boolean; conversationId?: string; conversation?: Conversation; message?: string }>;
    refreshConversations: () => Promise<{ success: boolean; conversations?: Conversation[]; message?: string }>;
    loadMyGroups: () => Promise<{ success: boolean; groups?: ChatGroup[]; message?: string }>;

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

    // Groups
    setGroups: (groups: ChatGroup[]) => void;
    setMyGroups: (groups: ChatGroup[]) => void;
    addGroup: (group: ChatGroup) => void;
    updateGroup: (groupId: string, updates: Partial<ChatGroup>) => void;
    removeGroup: (groupId: string) => void;

    // Messages
    setMessages: (conversationId: number, messages: Message[]) => void;
    addMessage: (conversationId: number, message: Message) => void;
    updateMessage: (conversationId: number, messageId: string, updates: Partial<Message>) => void;
    removeMessage: (conversationId: number, messageId: string) => void;
    clearMessages: (conversationId: number) => void;

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

    // Group Categories
    setGroupCategories: (categories: GroupCategory[]) => void;

    // UI Actions
    toggleSidebar: () => void;
    toggleSearch: () => void;
    toggleSettings: () => void;
    toggleProfile: () => void;
    toggleCreateGroup: () => void;
    closeCreateGroup: () => void;
    toggleCreatePost: () => void;

    // Loading Actions
    setLoadingContacts: (loading: boolean) => void;
    setLoadingGroups: (loading: boolean) => void;
    setLoadingMessages: (loading: boolean) => void;
    setLoadingPosts: (loading: boolean) => void;
    setPageTransitioning: (loading: boolean) => void;

    // Settings Actions
    updateSettings: (updates: Partial<ChatSettings>) => void;

    // Reset
    reset: () => void;
}

const defaultSettings: ChatSettings = {
    theme: 'auto',
    notifications: {
        sound: true,
        desktop: true,
        mentions: true,
        groupMessages: true,
        postNotifications: true,
    },
    privacy: {
        showOnlineStatus: true,
        showLastSeen: true,
        allowFriendRequests: true,
        allowGroupInvites: true,
    },
    appearance: {
        fontSize: 'medium',
        compactMode: false,
        showAvatars: true,
    },
};

export const useCustomerStore = create<CustomerState>()(
    devtools(
        (set, get) => ({
            // Initial state
            activeChatId: null,
            activeChatType: null,
            activeNavItem: 'chats',
            contacts: [],
            conversations: [],
            groups: [],
            myGroups: [],
            messages: {},
            notifications: [],
            userProfile: null,
            posts: [],
            groupCategories: [],
            isSidebarOpen: true,
            isSearchOpen: false,
            isSettingsOpen: false,
            isProfileOpen: false,
            isCreateGroupOpen: false,
            isCreatePostOpen: false,
            isLoadingContacts: false,
            isLoadingGroups: false,
            isLoadingMessages: false,
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

            // Groups actions
            setGroups: (groups) => set({ groups }),
            setMyGroups: (groups) => set({ myGroups: groups }),
            addGroup: (group) => set((state) => ({
                groups: [...state.groups, group]
            })),
            updateGroup: (groupId, updates) => set((state) => ({
                groups: state.groups.map(group =>
                    group.id === groupId ? { ...group, ...updates } : group
                )
            })),
            removeGroup: (groupId) => set((state) => ({
                groups: state.groups.filter(group => group.id !== groupId)
            })),

            // Messages actions
            setMessages: (conversationId, messages) => set((state) => ({
                messages: { ...state.messages, [conversationId]: messages }
            })),
            addMessage: (conversationId, message) => set((state) => {
                const existingMessages = state.messages[conversationId] || [];

                // Kiểm tra tin nhắn đã tồn tại bằng ID
                const messageExists = existingMessages.some(existing => existing.id === message.id);

                if (messageExists) {
                    console.warn(`[Store] Message with ID ${message.id} already exists, skipping...`);
                    return state; // Không thêm duplicate
                }

                // Thêm tin nhắn mới
                return {
                    messages: {
                        ...state.messages,
                        [conversationId]: [...existingMessages, message]
                    }
                };
            }),
            updateMessage: (conversationId, messageId, updates) => set((state) => ({
                messages: {
                    ...state.messages,
                    [conversationId]: (state.messages[conversationId] || []).map(message =>
                        message.id === messageId ? { ...message, ...updates } : message
                    )
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
            clearMessages: (conversationId) => set((state) => {
                const newMessages = { ...state.messages };
                delete newMessages[conversationId];
                return { messages: newMessages };
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
                    post.id === postId
                        ? { ...post, isLiked: true, likeCount: post.likeCount + 1 }
                        : post
                )
            })),
            unlikePost: (postId) => set((state) => ({
                posts: state.posts.map(post =>
                    post.id === postId
                        ? { ...post, isLiked: false, likeCount: Math.max(0, post.likeCount - 1) }
                        : post
                )
            })),

            // Notifications actions
            setNotifications: (notifications) => set({ notifications }),
            addNotification: (notification) => set((state) => ({
                notifications: [notification, ...state.notifications]
            })),
            markNotificationAsRead: (notificationId) => set((state) => ({
                notifications: state.notifications.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, isRead: true }
                        : notification
                )
            })),
            markAllNotificationsAsRead: () => set((state) => ({
                notifications: state.notifications.map(notification => ({
                    ...notification,
                    isRead: true
                }))
            })),
            removeNotification: (notificationId) => set((state) => ({
                notifications: state.notifications.filter(
                    notification => notification.id !== notificationId
                )
            })),
            setUnreadCount: (count) => set({ unreadCount: count }),

            // User profile actions
            setUserProfile: (profile) => set({ userProfile: profile }),
            updateUserProfile: (updates) => set((state) => ({
                userProfile: state.userProfile ? { ...state.userProfile, ...updates } : null
            })),

            // Group categories actions
            setGroupCategories: (categories) => set({ groupCategories: categories }),

            // UI actions
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
            toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
            toggleProfile: () => set((state) => ({ isProfileOpen: !state.isProfileOpen })),
            toggleCreateGroup: () => set((state) => ({ isCreateGroupOpen: !state.isCreateGroupOpen })),
            closeCreateGroup: () => set({ isCreateGroupOpen: false }),
            toggleCreatePost: () => set((state) => ({ isCreatePostOpen: !state.isCreatePostOpen })),

            // Loading actions
            setLoadingContacts: (loading) => set({ isLoadingContacts: loading }),
            setLoadingGroups: (loading) => set({ isLoadingGroups: loading }),
            setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
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

            loadMyGroups: async () => {
                try {
                    // Import API function to avoid circular dependency
                    const { getMyGroups } = await import('@/lib/customer-api-client');

                    const response = await getMyGroups();

                    if (response.success) {
                        // Convert API response to ChatGroup format
                        const apiGroups = response.data.items.map(item => ({
                            id: item.groupId,
                            name: item.groupName,
                            description: item.description,
                            avatarUrl: item.avatarUrl || undefined,
                            isPrivate: true, // Default to private
                            memberCount: 1, // Default member count
                            unreadCount: 0,
                            isOnline: false,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            isMyGroup: true,
                            category: undefined,
                            tags: []
                        }));

                        set({ myGroups: apiGroups });
                        return { success: true, groups: apiGroups };
                    } else {
                        return { success: false, message: response.message };
                    }
                } catch (error) {
                    return { success: false, message: 'Có lỗi xảy ra khi tải danh sách nhóm' };
                }
            },

            // Reset
            reset: () => set({
                activeChatId: null,
                activeChatType: null,
                activeNavItem: 'chats',
                contacts: [],
                conversations: [],
                groups: [],
                myGroups: [],
                messages: {},
                notifications: [],
                unreadCount: 0,
                userProfile: null,
                posts: [],
                groupCategories: [],
                isSidebarOpen: true,
                isSearchOpen: false,
                isSettingsOpen: false,
                isProfileOpen: false,
                isCreateGroupOpen: false,
                isCreatePostOpen: false,
                isLoadingContacts: false,
                isLoadingGroups: false,
                isLoadingMessages: false,
                isLoadingPosts: false,
                isPageTransitioning: false,
                settings: defaultSettings,
            }),
        }),
        {
            name: 'customer-store',
        }
    )
);
