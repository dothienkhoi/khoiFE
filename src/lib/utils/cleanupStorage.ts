/**
 * Utility function to clean up unnecessary localStorage keys
 */

export const cleanupUnnecessaryStorage = () => {
    const keysToRemove = [
        'call_end_notification_call_1754542487109_customer_001',
        'channel_invitationschannels',
        'chat-storage',
        'conversation-storage',
        'conversation_conv-user-001-user-002',
        'currentUser',
        'customer-store',
        'darkMode',
        'epr_suggested',
        'fasi-bite-theme',
        'friend-storage',
        'groupConversationMap',
        'lk-user-choices',
        'pinnedChats',
        'profile_active_tab',
        'respondedInvitations',
        'simple-chat-storage',
        'teamchat-posts',
        'testAccessToken',
        'theme',
        'userToken',
        'video-call-storage'
    ];

    keysToRemove.forEach(key => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            // Silent cleanup - no logging needed
        }
    });

    // Also clean up sessionStorage
    keysToRemove.forEach(key => {
        try {
            sessionStorage.removeItem(key);
        } catch (error) {
            // Silent cleanup - no logging needed
        }
    });
};
