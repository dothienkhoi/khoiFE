// lib/customer-api-client.ts
import axios from "axios";
import {
    CustomerApiResponse,
    CustomerPagedResult,
    Contact,
    ChatGroup,
    ChatMessage,
    UserProfile,
    CustomerNotification,
    SearchResult,
    GroupMember,
    ChatSettings,
    Conversation,
    CreateConversationResponse,
    MessageHistoryResponse,
    Message
} from "@/types/customer.types";
import { useAuthStore } from "@/store/authStore";

// Extend Window interface for error logging flags
declare global {
    interface Window {
        __notificationErrorLogged?: boolean;
        __notificationFallbackLogged?: boolean;
        __notificationToastShown?: boolean;
        __notificationsEnabled?: boolean;
        __notificationsDisabled?: boolean;
    }
}

// Reset error flags when page loads
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        window.__notificationErrorLogged = false;
        window.__notificationFallbackLogged = false;
        window.__notificationToastShown = false;
        window.__notificationsEnabled = true; // Enable real API
        window.__notificationsDisabled = false; // Mark as enabled
    });
}

export const customerApiClient = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7007"}/api/v1`,
    timeout: 15000, // Reduced to 15s for faster failure detection
});

// Request Interceptor: Tự động gắn AccessToken vào mỗi request
customerApiClient.interceptors.request.use(
    (config) => {
        // Try to get token from store first
        const accessToken = useAuthStore.getState().accessToken;

        // Fallback to cookie if store doesn't have token
        if (!accessToken) {
            // Our app stores the JWT in the 'auth_token' cookie (see LoginForm)
            const tokenCookie = document.cookie.split('; ').find(row => row.startsWith('auth_token='));
            if (tokenCookie) {
                const token = tokenCookie.split('=')[1];
                if (token && config.headers) {
                    config.headers["Authorization"] = `Bearer ${token}`;
                }
            }
        } else if (config.headers) {
            config.headers["Authorization"] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Xử lý khi AccessToken hết hạn
customerApiClient.interceptors.response.use(
    (response) => response,
    async (error: any) => {
        const originalRequest = error.config;
        const authStore = useAuthStore.getState();

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._isRetry
        ) {
            originalRequest._isRetry = true;

            try {
                const refreshToken = authStore.refreshToken;
                if (!refreshToken) {
                    authStore.logout();
                    return Promise.reject(error);
                }

                const response = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7007"}/api/v1/Auth/refresh-token`,
                    { token: refreshToken }
                );

                const responseData = response.data as any;
                const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
                    responseData.data;

                authStore.login(
                    responseData.data.user,
                    newAccessToken,
                    newRefreshToken
                );

                originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
                return customerApiClient(originalRequest);
            } catch (refreshError) {
                authStore.logout();
                window.location.href = "/auth/login";
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

// ===============================
// FILE UPLOAD API FUNCTIONS
// ===============================

// File size limits in bytes
const FILE_SIZE_LIMITS = {
    image: 10 * 1024 * 1024,    // 10MB
    file: 50 * 1024 * 1024,     // 50MB
    video: 100 * 1024 * 1024,   // 100MB
    audio: 20 * 1024 * 1024     // 20MB
};

// Validate file size before upload
const validateFileSize = (file: File, type: keyof typeof FILE_SIZE_LIMITS): string | null => {
    const maxSize = FILE_SIZE_LIMITS[type];
    if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        return `File quá lớn. Kích thước tối đa: ${maxSizeMB}MB`;
    }
    return null;
};

// Main upload function
export const uploadFile = async (
    file: File,
    type: 'image' | 'file' | 'video' | 'audio',
    onProgress?: (progress: number) => void
) => {
    // Validate file size first
    const sizeError = validateFileSize(file, type);
    if (sizeError) {
        throw new Error(sizeError);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
        const response = await customerApiClient.post<CustomerApiResponse<{
            fileUrl: string;
            fileName: string;
            fileSize: number;
            fileType: string;
            fileId: number;
            id: string;
        }>>(
            '/files/upload',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                // Note: onUploadProgress is not available in this axios version
                // Progress tracking will be handled by the calling component
            }
        );

        return response.data;
    } catch (error: any) {
        // Handle specific API errors
        if (error.response?.status === 400) {
            const errorData = error.response.data;
            if (errorData.errors && errorData.errors.length > 0) {
                throw new Error(errorData.errors[0].message || 'File không hợp lệ');
            }
            throw new Error(errorData.message || 'File không hợp lệ');
        }

        if (error.response?.status === 413) {
            throw new Error('File quá lớn');
        }

        throw new Error('Không thể tải lên file. Vui lòng thử lại.');
    }
};

// Upload multiple files
export const uploadMultipleFiles = async (
    files: File[],
    type: 'image' | 'file' | 'video' | 'audio' = 'file',
    onProgress?: (progress: number) => void
) => {
    const results = [];
    let totalProgress = 0;

    for (let i = 0; i < files.length; i++) {
        try {
            const fileProgress = (progress: number) => {
                const fileWeight = 100 / files.length;
                const currentFileProgress = (progress * fileWeight) / 100;
                const previousFilesProgress = (i * fileWeight);
                totalProgress = Math.round(previousFilesProgress + currentFileProgress);
                onProgress?.(totalProgress);
            };

            const result = await uploadFile(files[i], type, fileProgress);
            results.push(result);
        } catch (error: any) {
            // Continue with other files if one fails
            results.push({ success: false, error: error.message, fileName: files[i].name });
        }
    }

    return {
        success: results.some(r => r.success),
        data: results,
        message: results.length > 0 ? 'Upload hoàn tất' : 'Không có file nào được tải lên'
    };
};

// Convenience functions
export const uploadImage = (file: File, onProgress?: (progress: number) => void) =>
    uploadFile(file, 'image', onProgress);

export const uploadDocument = (file: File, onProgress?: (progress: number) => void) =>
    uploadFile(file, 'file', onProgress);

export const uploadVideo = (file: File, onProgress?: (progress: number) => void) =>
    uploadFile(file, 'video', onProgress);

export const uploadAudio = (file: File, onProgress?: (progress: number) => void) =>
    uploadFile(file, 'audio', onProgress);

// Upload files to conversation
export const uploadFilesToConversation = async (conversationId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const response = await customerApiClient.post<CustomerApiResponse<Message[]>>(
        `/conversations/${conversationId}/files`,
        formData,
        {
            headers: { 'Content-Type': 'multipart/form-data' }
        }
    );
    return response.data;
};

// Upload files to group
export const uploadFilesToGroup = async (groupId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const response = await customerApiClient.post<CustomerApiResponse<Message[]>>(
        `/groups/${groupId}/files`,
        formData,
        {
            headers: { 'Content-Type': 'multipart/form-data' }
        }
    );
    return response.data;
};

// ===============================
// GROUPS API FUNCTIONS
// ===============================

export const getMyGroups = async () => {
    const response = await customerApiClient.get<CustomerApiResponse<{
        items: Array<{
            groupId: string;
            groupName: string;
            description: string;
            avatarUrl: string | null;
        }>;
        pageNumber: number;
        pageSize: number;
        totalRecords: number;
        totalPages: number;
    }>>(
        "/me/groups"
    );
    return response.data;
};

export const createGroupInviteLink = async (groupId: string, options?: {
    expiresInHours?: number;
    maxUses?: number;
}) => {
    const response = await customerApiClient.post<CustomerApiResponse<{
        invitationCode: string;
        fullUrl: string;
    }>>(
        `/groups/${groupId}/invite-links`,
        {
            expiresInHours: options?.expiresInHours || 0,
            maxUses: options?.maxUses || 0
        }
    );
    return response.data;
};

// Lấy thông tin xem trước của nhóm từ mã mời
export const getGroupPreviewByInviteCode = async (invitationCode: string) => {
    const response = await customerApiClient.get<CustomerApiResponse<{
        groupId: string;
        groupName: string;
        groupAvatarUrl: string;
        memberCount: number;
    }>>(
        `/invitations/link/${invitationCode}`
    );
    return response.data;
};

// Chấp nhận lời mời và tham gia nhóm qua mã mời
export const acceptGroupInvitation = async (invitationCode: string) => {
    const response = await customerApiClient.post<CustomerApiResponse<{
        groupId: string;
        groupName: string | null;
        defaultConversationId: number;
    }>>(
        `/invitations/link/${invitationCode}/accept`
    );
    return response.data;
};

export const getGroupConversations = async () => {
    const response = await customerApiClient.get<CustomerApiResponse<Array<{
        conversationId: number;
        conversationType: string;
        displayName: string;
        avatarUrl: string | null;
        lastMessagePreview: string | null;
        lastMessageType: string | null;
        lastMessageTimestamp: string | null;
        unreadCount: number;
    }>>>(
        "/conversations/me?filter=group"
    );
    return response.data;
};

export const getGroupConversationId = async (groupId: string, groupName?: string) => {
    // First get all group conversations
    const response = await customerApiClient.get<CustomerApiResponse<Array<{
        conversationId: number;
        conversationType: string;
        displayName: string;
        avatarUrl: string | null;
        lastMessagePreview: string | null;
        lastMessageType: string | null;
        lastMessageTimestamp: string | null;
        unreadCount: number;
    }>>>(
        "/conversations/me?filter=group"
    );

    if (response.data.success) {
        const conversations = response.data.data.filter(conv => conv.conversationType === "Group");



        if (conversations.length === 0) {
            return {
                success: false,
                message: "Không tìm thấy cuộc hội thoại nhóm nào",
                data: null
            };
        }

        // Create a simple mapping based on group creation order
        // This is a temporary solution until we have proper groupId-conversationId mapping from backend
        let conversation = null;

        // Try to match by groupName first
        if (groupName) {
            conversation = conversations.find(conv =>
                conv.displayName === groupName ||
                conv.displayName.toLowerCase() === groupName.toLowerCase()
            );
        }

        // If not found, try to match based on known patterns
        if (!conversation) {
            if (groupName === "oktesstvip pro" || groupId.includes("28d51fe9-6bb7-492c-58ec-08dddee689e8")) {
                conversation = conversations.find(conv => conv.conversationId === 9);
            } else if (groupName === "oktesstv2" || groupId.includes("oktesstv2")) {
                conversation = conversations.find(conv => conv.conversationId === 11);
            }
        }

        // Fallback: use first available conversation
        if (!conversation && conversations.length > 0) {
            conversation = conversations[0];
        }

        if (conversation) {
            return {
                success: true,
                data: {
                    conversationId: conversation.conversationId,
                    groupId: groupId,
                    groupName: conversation.displayName
                }
            };
        }
    }

    // Fallback: return error
    return {
        success: false,
        message: "Không tìm thấy cuộc hội thoại cho nhóm này",
        data: null
    };
};

// ===============================
// CONTACTS API FUNCTIONS
// ===============================

export const getContacts = async () => {
    const response = await customerApiClient.get<CustomerApiResponse<Contact[]>>(
        "/contacts"
    );
    return response.data;
};

export const addContact = async (userId: string) => {
    const response = await customerApiClient.post<CustomerApiResponse<Contact>>(
        "/contacts",
        { userId }
    );
    return response.data;
};

export const removeContact = async (contactId: string) => {
    const response = await customerApiClient.delete<CustomerApiResponse<boolean>>(
        `/contacts/${contactId}`
    );
    return response.data;
};

// ===============================
// GROUPS API FUNCTIONS
// ===============================

export const getGroups = async () => {
    const response = await customerApiClient.get<CustomerApiResponse<ChatGroup[]>>(
        "/groups"
    );
    return response.data;
};

export const createGroup = async (data: {
    groupName: string;
    description?: string;
    groupType: "Private" | "Public";
    groupAvatarUrl?: string;
}) => {
    const response = await customerApiClient.post<CustomerApiResponse<{
        groupId: string;
        groupName: string;
        defaultConversationId: number;
    }>>(
        "/groups",
        data,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return response.data;
};

export const updateGroup = async (
    groupId: string,
    data: Partial<{
        name: string;
        description: string;
        isPrivate: boolean;
    }>
) => {
    const response = await customerApiClient.put<CustomerApiResponse<ChatGroup>>(
        `/groups/${groupId}`,
        data
    );
    return response.data;
};

export const deleteGroup = async (groupId: string) => {
    const response = await customerApiClient.delete<CustomerApiResponse<boolean>>(
        `/groups/${groupId}`
    );
    return response.data;
};

export const joinGroup = async (groupId: string) => {
    const response = await customerApiClient.post<CustomerApiResponse<boolean>>(
        `/groups/${groupId}/join`
    );
    return response.data;
};

export const leaveGroup = async (groupId: string) => {
    const response = await customerApiClient.post<CustomerApiResponse<boolean>>(
        `/groups/${groupId}/leave`
    );
    return response.data;
};

export const getGroupDetails = async (groupId: string) => {
    const response = await customerApiClient.get<CustomerApiResponse<{
        groupId: string;
        groupName: string;
        description: string;
        groupType: string;
        groupAvatarUrl: string;
        memberCount: number;
        members: GroupMember[];
    }>>(
        `/groups/${groupId}`
    );
    return response.data;
};

export const getGroupMembers = async (groupId: string) => {
    const response = await customerApiClient.get<CustomerApiResponse<GroupMember[]>>(
        `/groups/${groupId}/members`
    );
    return response.data;
};

// Group invitation functions
export const searchUsersForInvite = async (groupId: string, searchTerm?: string) => {
    const params = searchTerm ? `?searchTerm=${encodeURIComponent(searchTerm)}` : '';
    const response = await customerApiClient.get<CustomerApiResponse<{
        userId: string;
        fullName: string;
        avatarUrl?: string;
    }[]>>(`/groups/${groupId}/invite-candidates${params}`);
    return response.data;
};

export const inviteUserToGroup = async (groupId: string, invitedUserIds: string[]) => {
    const response = await customerApiClient.post<CustomerApiResponse<any>>(
        `/groups/${groupId}/invitations`,
        { invitedUserIds }
    );
    return response.data;
};

// Get pending invitations
export const getPendingInvitations = async () => {
    const response = await customerApiClient.get<CustomerApiResponse<{
        invitationId: number;
        groupName: string;
        groupAvatarUrl: string;
        invitedByName: string;
    }[]>>('/invitations/me');
    return response.data;
};

// Respond to invitation (accept/reject)
export const respondToInvitation = async (invitationId: number, accept: boolean) => {
    const requestBody = { accept };

    const response = await customerApiClient.post<CustomerApiResponse<any>>(
        `/invitations/${invitationId}/respond`,
        requestBody,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return response.data;
};

export const generateGroupInviteLink = async (groupId: string) => {
    const response = await customerApiClient.post<CustomerApiResponse<{
        inviteLink: string;
        expiresAt: string;
    }>>(`/groups/${groupId}/invite-link`);
    return response.data;
};

// ===============================
// MESSAGES API FUNCTIONS
// ===============================

export const getMessages = async (
    chatId: string,
    pageNumber: number = 1,
    pageSize: number = 50
) => {
    const params = new URLSearchParams({
        pageNumber: pageNumber.toString(),
        pageSize: pageSize.toString(),
    });

    const response = await customerApiClient.get<CustomerApiResponse<CustomerPagedResult<ChatMessage>>>(
        `/messages/${chatId}?${params.toString()}`
    );
    return response.data;
};

export const sendMessage = async (data: {
    chatId: string;
    content: string;
    messageType: 'text' | 'image' | 'file';
    replyToMessageId?: string;
}) => {
    const response = await customerApiClient.post<CustomerApiResponse<ChatMessage>>(
        "/messages",
        data
    );
    return response.data;
};

export const editMessage = async (
    messageId: string,
    content: string
) => {
    const response = await customerApiClient.put<CustomerApiResponse<ChatMessage>>(
        `/messages/${messageId}`,
        { content }
    );
    return response.data;
};

export const deleteMessage = async (messageId: string) => {
    const response = await customerApiClient.delete<CustomerApiResponse<boolean>>(
        `/messages/${messageId}`
    );
    return response.data;
};

// ===============================
// USER PROFILE API FUNCTIONS
// ===============================

export const getUserProfile = async () => {
    const response = await customerApiClient.get<CustomerApiResponse<UserProfile>>(
        "/profile"
    );
    return response.data;
};

export const updateUserProfile = async (data: Partial<{
    firstName: string;
    lastName: string;
    bio: string;
    phoneNumber: string;
    dateOfBirth: string;
}>) => {
    const response = await customerApiClient.put<CustomerApiResponse<UserProfile>>(
        "/profile",
        data
    );
    return response.data;
};

export const updateUserAvatar = async (avatarFile: File) => {
    const formData = new FormData();
    formData.append("avatar", avatarFile);

    const response = await customerApiClient.post<CustomerApiResponse<{ avatarUrl: string }>>(
        "/profile/avatar",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );
    return response.data;
};

// ===============================
// NOTIFICATIONS API FUNCTIONS
// ===============================

// Test all API endpoints
export const testAllAPIs = async () => {
    console.log('[API] Testing all API endpoints...');

    const results = {
        server: false,
        notifications: false,
        conversations: false
    };

    // Test server health
    try {
        results.server = await isServerAvailable();
        console.log('[API] Server health test:', results.server ? 'PASS' : 'FAIL');
    } catch (error) {
        console.error('[API] Server health test failed:', error);
    }

    // Test notifications API
    try {
        const response = await customerApiClient.get('/notifications/me?PageNumber=1&PageSize=5', {
            timeout: 5000
        });
        results.notifications = response.status === 200;
        console.log('[API] Notifications API test:', results.notifications ? 'PASS' : 'FAIL');
    } catch (error: any) {
        console.error('[API] Notifications API test failed:', error?.response?.status);
    }

    // Test conversations API
    try {
        const response = await customerApiClient.get('/conversations/me', {
            timeout: 5000
        });
        results.conversations = response.status === 200;
        console.log('[API] Conversations API test:', results.conversations ? 'PASS' : 'FAIL');
    } catch (error: any) {
        console.error('[API] Conversations API test failed:', error?.response?.status);
    }

    console.log('[API] All API tests completed:', results);
    return results;
};

// Enable notifications API when server is working
export const enableNotificationsAPI = () => {
    window.__notificationsEnabled = true;
    window.__notificationsDisabled = false;
    console.log('[API] Notifications API enabled');
};

// Disable notifications API due to server issues
export const disableNotificationsAPI = () => {
    window.__notificationsEnabled = false;
    window.__notificationsDisabled = true;
    console.log('[API] Notifications API disabled due to server issues');
};

// Debug notifications API step by step
export const debugNotificationsAPI = async () => {
    try {
        console.log('=== [API] DEBUG NOTIFICATIONS API ===');
        console.log('[API] 1. Checking API client config:', {
            baseURL: customerApiClient.defaults.baseURL,
            timeout: customerApiClient.defaults.timeout,
            headers: customerApiClient.defaults.headers
        });

        // Test basic connectivity
        console.log('[API] 2. Testing basic connectivity...');
        try {
            const healthResponse = await axios.get(`${customerApiClient.defaults.baseURL?.replace('/api/v1', '')}/health`, {
                timeout: 5000
            });
            console.log('[API] Health check successful:', healthResponse.status);
        } catch (healthError: any) {
            console.warn('[API] Health check failed:', healthError?.message);
        }

        // Test notifications endpoint
        console.log('[API] 3. Testing notifications endpoint...');
        const testParams = new URLSearchParams({
            PageNumber: '1',
            PageSize: '5'
        });

        const fullUrl = `${customerApiClient.defaults.baseURL}/notifications/me?${testParams.toString()}`;
        console.log('[API] Full test URL:', fullUrl);

        const response = await customerApiClient.get(`/notifications/me?${testParams.toString()}`, {
            timeout: 30000 // 30s for debugging
        });

        console.log('[API] Notifications API test successful:', {
            status: response.status,
            statusText: response.statusText,
            data: response.data
        });

        console.log('=== [API] DEBUG COMPLETED ===');
        return true;
    } catch (error: any) {
        console.error('=== [API] DEBUG FAILED ===');
        console.error('[API] Debug error details:', {
            status: error?.response?.status || 'No status',
            message: error?.message || 'No message',
            code: error?.code || 'No code',
            responseData: error?.response?.data || 'No response data',
            fullError: error
        });
        return false;
    }
};

// Test notifications API directly
export const testNotificationsAPI = async () => {
    try {
        console.log('[API] Testing notifications API directly...', {
            baseURL: customerApiClient.defaults.baseURL,
            timeout: customerApiClient.defaults.timeout
        });

        // Test with different endpoints and longer timeout
        const endpoints = [
            '/notifications/me?PageNumber=1&PageSize=5',
            '/notification?PageNumber=1&PageSize=5',
            '/notifications?PageNumber=1&PageSize=5'
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`[API] Testing endpoint: ${endpoint}`);
                const fullUrl = `${customerApiClient.defaults.baseURL}${endpoint}`;
                console.log(`[API] Full URL: ${fullUrl}`);

                const response = await customerApiClient.get(endpoint, {
                    timeout: 20000 // 20s timeout for testing
                });
                console.log(`[API] Notifications API test successful via ${endpoint}:`, {
                    status: response.status,
                    statusText: response.statusText,
                    data: response.data
                });
                return true;
            } catch (error: any) {
                console.error(`[API] Endpoint ${endpoint} failed:`, {
                    status: error?.response?.status || 'No status',
                    message: error?.message || 'No message',
                    code: error?.code || 'No code',
                    responseData: error?.response?.data || 'No response data',
                    fullError: error
                });
                // Continue to next endpoint
            }
        }

        console.error('[API] All notifications endpoints failed');
        return false;
    } catch (error: any) {
        console.error('[API] Notifications API test failed:', {
            status: error?.response?.status || 'No status',
            message: error?.message || 'No message',
            code: error?.code || 'No code',
            responseData: error?.response?.data || 'No response data',
            fullError: error
        });
        return false;
    }
};

// Check if server is available
export const isServerAvailable = async () => {
    try {
        console.log('[API] Checking server availability...');

        // Try multiple endpoints to check server availability
        const endpoints = [
            '/health',
            '/api/v1/health',
            '/api/v1/notifications/me?PageNumber=1&PageSize=1',
            '/api/v1/conversations/me'
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7007"}${endpoint}`, {
                    timeout: 3000
                });
                console.log(`[API] Server is available via ${endpoint}:`, response.status);
                return true;
            } catch (error: any) {
                console.log(`[API] Endpoint ${endpoint} failed:`, error?.response?.status || error?.message);
                // Continue to next endpoint
            }
        }

        console.error('[API] All endpoints failed - server not available');
        return false;
    } catch (error: any) {
        console.error('[API] Server check failed:', error?.message);
        return false;
    }
};

// Check if notifications server is available
export const isNotificationsServerAvailable = async () => {
    try {
        const response = await customerApiClient.get('/health', { timeout: 3000 });
        return response.status === 200;
    } catch (error) {
        return false;
    }
};

// Get user notifications
export const getNotifications = async (
    pageNumber: number = 1,
    pageSize: number = 20
) => {
    console.log('[API] Attempting to fetch notifications from real API...', {
        pageNumber,
        pageSize,
        baseURL: customerApiClient.defaults.baseURL,
        timeout: customerApiClient.defaults.timeout
    });

    const params = new URLSearchParams({
        PageNumber: pageNumber.toString(),
        PageSize: pageSize.toString(),
    });

    console.log('[API] Request params:', params.toString());
    console.log('[API] Full URL:', `${customerApiClient.defaults.baseURL}/notifications/me?${params.toString()}`);

    // Retry logic for timeout issues
    let lastError: any;
    const maxRetries = 2;

    console.log('[API] Starting retry loop with', maxRetries, 'attempts');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const currentTimeout = attempt === 1 ? 15000 : 20000;
            console.log(`[API] Notifications attempt ${attempt}/${maxRetries}...`, {
                attempt,
                timeout: currentTimeout,
                url: `/notifications/me?${params.toString()}`
            });

            const response = await customerApiClient.get<CustomerApiResponse<CustomerPagedResult<CustomerNotification>>>(
                `/notifications/me?${params.toString()}`,
                {
                    timeout: currentTimeout
                }
            );

            console.log('[API] Notifications fetched successfully:', {
                success: response.data.success,
                itemsCount: response.data.data?.items?.length || 0,
                totalRecords: response.data.data?.totalRecords
            });

            return response.data;
        } catch (error: any) {
            lastError = error;

            // Check if it's a timeout error
            const isTimeout = error?.code === 'ECONNABORTED' || error?.message?.includes('timeout');
            const isNetworkError = !error?.response;

            console.warn(`[API] Notifications attempt ${attempt} failed:`, {
                attempt: attempt,
                status: error?.response?.status || 'No status',
                message: error?.message || 'No message',
                code: error?.code || 'No code',
                isTimeout: isTimeout,
                isNetworkError: isNetworkError,
                responseData: error?.response?.data || 'No response data',
                fullError: error
            });

            // If it's the last attempt, break
            if (attempt === maxRetries) {
                break;
            }

            // Wait before retry (exponential backoff)
            const delay = attempt * 1000; // 1s, 2s
            console.log(`[API] Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    console.log('[API] Retry loop completed. lastError:', lastError);

    // All attempts failed
    if (lastError) {
        console.error('[API] All notifications attempts failed:', {
            status: lastError?.response?.status || 'No status',
            message: lastError?.message || 'No message',
            code: lastError?.code || 'No code',
            response: lastError?.response?.data || 'No response data',
            fullError: lastError
        });
    } else {
        console.error('[API] All notifications attempts failed: No error object available');
    }

    // Return empty notifications on error
    const fallbackMessage = lastError
        ? `Không thể tải thông báo: ${lastError?.message || 'Unknown error'}. Vui lòng thử lại sau.`
        : 'Không thể tải thông báo. Vui lòng thử lại sau.';

    console.log('[API] Returning fallback response:', fallbackMessage);

    return {
        success: false,
        message: fallbackMessage,
        data: {
            items: [],
            pageNumber: pageNumber,
            pageSize: pageSize,
            totalRecords: 0,
            totalPages: 0
        }
    };
};

export const markNotificationAsRead = async (notificationId: string) => {
    try {
        const response = await customerApiClient.post<CustomerApiResponse<boolean>>(
            `/notifications/${notificationId}/mark-as-read`,
            {},
            { timeout: 10000 }
        );
        console.log('[API] Mark as read successful:', notificationId);
        return response.data;
    } catch (error: any) {
        console.error('[API] Mark as read failed:', error?.response?.status, error?.message);
        return {
            success: false,
            message: 'Không thể đánh dấu đã đọc',
            data: false
        };
    }
};

export const markAllNotificationsAsRead = async () => {
    try {
        const response = await customerApiClient.post<CustomerApiResponse<boolean>>(
            "/notifications/me/mark-all-as-read",
            {},
            { timeout: 10000 }
        );
        console.log('[API] Mark all as read successful');
        return response.data;
    } catch (error: any) {
        console.error('[API] Mark all as read failed:', error?.response?.status, error?.message);
        return {
            success: false,
            message: 'Không thể đánh dấu tất cả đã đọc',
            data: false
        };
    }
};

// =================================================================
// CONVERSATION API FUNCTIONS
// =================================================================

/**
 * Find or create a direct conversation with a user
 */
export const findOrCreateConversation = async (partnerUserId: string) => {
    const response = await customerApiClient.post<CustomerApiResponse<CreateConversationResponse>>(
        `/conversations/direct`,
        { partnerUserId }
    );
    return response.data;
};

/**
 * Get list of conversations for current user
 */
export const getConversations = async (filter: 'all' | 'direct' | 'group' = 'all') => {
    try {
        // Skip server check and try direct API call
        console.log('[API] Attempting direct conversations API call...');

        const params = new URLSearchParams();
        if (filter !== 'all') {
            params.append('filter', filter);
        }

        const response = await customerApiClient.get<CustomerApiResponse<Conversation[]>>(
            `/conversations/me${params.toString() ? `?${params.toString()}` : ''}`
        );
        return response.data;
    } catch (error: any) {
        console.error('[API] Error getting conversations:', error);

        // Return a safe fallback response
        return {
            success: false,
            message: error.response?.data?.message || error.message || 'Failed to load conversations',
            data: [] as Conversation[]
        };
    }
};

/**
 * Get message history of a conversation (supports cursor pagination)
 */
export const getMessageHistory = async (
    conversationId: number,
    beforeMessageId?: string,
    limit: number = 20
) => {
    try {
        const params = new URLSearchParams();
        if (beforeMessageId) {
            params.append('beforeMessageId', beforeMessageId);
        }
        params.append('limit', limit.toString());

        const response = await customerApiClient.get<CustomerApiResponse<MessageHistoryResponse>>(
            `/conversations/${conversationId}/messages?${params.toString()}`
        );
        return response.data;
    } catch (error: any) {
        console.error('[API] Error getting message history:', error);

        // Return a safe fallback response
        return {
            success: false,
            message: error.response?.data?.message || error.message || 'Failed to load messages',
            data: {
                messages: [],
                hasMore: false,
                nextCursor: null
            }
        };
    }
};

/**
 * Create a new direct conversation
 */
export const createDirectConversation = async (userId: string) => {
    const response = await customerApiClient.post<
        CustomerApiResponse<{ conversationId: number; isNew: boolean; conversation: Conversation }>
    >(`/conversations/direct`, { userId });
    return response.data;
};

/**
 * Send a new message in a conversation
 */
export const sendConversationMessage = async (
    conversationId: number,
    payload: { content: string; parentMessageId?: string | null }
) => {
    const body: { content: string; parentMessageId?: string | null } = {
        content: payload.content,
    };
    if (payload.parentMessageId) {
        body.parentMessageId = payload.parentMessageId;
    }

    const response = await customerApiClient.post<
        CustomerApiResponse<Message>
    >(`/conversations/${conversationId}/messages`, body);
    return response.data;
};

/**
 * Send a new message in a group conversation
 */
export const sendGroupMessage = async (
    groupId: string,
    payload: { content: string; parentMessageId?: string | null }
) => {
    const body: { content: string; parentMessageId?: string | null } = {
        content: payload.content,
    };
    if (payload.parentMessageId) {
        body.parentMessageId = payload.parentMessageId;
    }

    const response = await customerApiClient.post<
        CustomerApiResponse<Message>
    >(`/groups/${groupId}/messages`, body);
    return response.data;
};

// ===============================
// SEARCH API FUNCTIONS
// ===============================

export const search = async (query: string) => {
    const response = await customerApiClient.get<CustomerApiResponse<SearchResult>>(
        `/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
};

// Tạo API client riêng cho User search endpoint
const userSearchApiClient = axios.create({
    baseURL: "https://localhost:7007/api/v1",
});

// Request Interceptor: Tự động gắn AccessToken vào mỗi request
userSearchApiClient.interceptors.request.use(
    (config) => {
        const accessToken = useAuthStore.getState().accessToken;
        if (accessToken && config.headers) {
            config.headers["Authorization"] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Xử lý khi AccessToken hết hạn
userSearchApiClient.interceptors.response.use(
    (response) => response,
    async (error: any) => {
        const originalRequest = error.config;
        const authStore = useAuthStore.getState();

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._isRetry
        ) {
            originalRequest._isRetry = true;

            try {
                const refreshToken = authStore.refreshToken;
                if (!refreshToken) {
                    authStore.logout();
                    return Promise.reject(error);
                }

                const response = await axios.post(
                    "https://localhost:7007/api/v1/Auth/refresh-token",
                    { token: refreshToken }
                );

                const responseData = response.data as any;
                const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
                    responseData.data;

                authStore.login(
                    responseData.data.user,
                    newAccessToken,
                    newRefreshToken
                );

                originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
                return userSearchApiClient(originalRequest);
            } catch (refreshError) {
                authStore.logout();
                window.location.href = "/auth/login";
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);



export const searchUsers = async (params: {
    query: string;
    excludeGroupId?: string;
    pageNumber?: number;
    pageSize?: number;
}) => {
    const searchParams = new URLSearchParams({
        Query: params.query, // Chữ Q viết hoa theo Swagger UI
        PageNumber: (params.pageNumber || 1).toString(), // Chữ P viết hoa
        PageSize: (params.pageSize || 20).toString(), // Chữ P viết hoa
    });

    if (params.excludeGroupId) {
        searchParams.append('ExcludeGroupId', params.excludeGroupId); // Chữ E viết hoa
    }

    const response = await userSearchApiClient.get<CustomerApiResponse<CustomerPagedResult<{
        userId: string;
        displayName: string;
        email: string;
        avatarUrl: string | null;
    }>>>(
        `/User/search?${searchParams.toString()}`
    );
    return response.data;
};

// ===============================
// SETTINGS API FUNCTIONS
// ===============================

export const getChatSettings = async () => {
    const response = await customerApiClient.get<CustomerApiResponse<ChatSettings>>(
        "/settings"
    );
    return response.data;
};

export const updateChatSettings = async (settings: Partial<ChatSettings>) => {
    const response = await customerApiClient.put<CustomerApiResponse<ChatSettings>>(
        "/settings",
        settings
    );
    return response.data;
};

// ===============================
// POLL API FUNCTIONS
// ===============================

export const createPoll = async (conversationId: number, pollData: {
    question: string;
    options: string[];
    closesAt: string;
    allowMultipleChoices: boolean;
}) => {
    const response = await customerApiClient.post<CustomerApiResponse<any>>(
        `/conversations/${conversationId}/polls`,
        pollData
    );
    return response.data;
};

export const getPollDetails = async (conversationId: number, pollId: number) => {
    const response = await customerApiClient.get<CustomerApiResponse<any>>(
        `/conversations/${conversationId}/polls/${pollId}`
    );
    return response.data;
};

export const castVote = async (conversationId: number, pollId: number, pollOptionId: number | null) => {
    const response = await customerApiClient.post<CustomerApiResponse<any>>(
        `/conversations/${conversationId}/polls/${pollId}/vote`,
        { pollOptionId }
    );
    return response.data;
};

// ===============================
// GROUP POSTS API FUNCTIONS
// ===============================

export const getGroupPosts = async (
    groupId: string,
    pageNumber: number = 1,
    pageSize: number = 10,
    searchTerm?: string,
    authorId?: string
): Promise<CustomerApiResponse<CustomerPagedResult<any>>> => {
    try {
        // Try to get posts without strict authentication check
        // Let the server handle authentication

        const params = new URLSearchParams({
            pageNumber: pageNumber.toString(),
            pageSize: pageSize.toString()
        });

        if (searchTerm) {
            params.append("searchTerm", searchTerm);
        }

        if (authorId) {
            params.append("authorId", authorId);
        }

        const url = `/groups/${groupId}/posts?${params.toString()}`;
        console.log("Calling API:", url);
        console.log("Base URL:", customerApiClient.defaults.baseURL);

        const response = await customerApiClient.get(url);
        console.log("Raw response:", response);

        // Map database response to Post interface
        const responseData = response.data as any;
        if (responseData?.success && responseData?.data?.items) {
            console.log("Raw database posts:", responseData.data.items);

            const mappedPosts = responseData.data.items.map((dbPost: any) => {
                console.log("Mapping post:", dbPost);

                const mappedPost = {
                    id: dbPost.postId?.toString() || dbPost.id || dbPost.PostID?.toString(),
                    postId: dbPost.postId || dbPost.PostID,
                    title: dbPost.title || dbPost.Title || "Không có tiêu đề",
                    content: dbPost.content || dbPost.Content || "",
                    contentMarkdown: dbPost.contentMarkdown || dbPost.content || dbPost.Content || "",
                    authorId: dbPost.authorUserId || dbPost.authorId || dbPost.AuthorUserID || "unknown",
                    authorName: dbPost.authorDisplayName || dbPost.authorName || dbPost.AuthorDisplayName || "Unknown User",
                    authorAvatar: dbPost.authorAvatarUrl || dbPost.authorAvatar || dbPost.AuthorAvatarUrl || "",
                    author: {
                        userId: dbPost.authorUserId || dbPost.authorId || dbPost.AuthorUserID || "unknown",
                        displayName: dbPost.authorDisplayName || dbPost.authorName || dbPost.AuthorDisplayName || "Unknown User",
                        avatarUrl: dbPost.authorAvatarUrl || dbPost.authorAvatar || dbPost.AuthorAvatarUrl || ""
                    },
                    groupId: dbPost.groupId || dbPost.GroupID || groupId,
                    likeCount: dbPost.likeCount || dbPost.LikeCount || 0,
                    commentCount: dbPost.commentCount || dbPost.CommentCount || 0,
                    sharesCount: dbPost.sharesCount || dbPost.SharesCount || 0,
                    isPinned: dbPost.isPinned || dbPost.IsPinned || false,
                    isDeleted: dbPost.isDeleted || dbPost.IsDeleted || false,
                    createdAt: dbPost.createdAt || dbPost.CreatedAt,
                    updatedAt: dbPost.updatedAt || dbPost.UpdatedAt
                };

                console.log("Mapped post:", mappedPost);
                return mappedPost;
            });

            responseData.data.items = mappedPosts;
            console.log("Final mapped posts:", mappedPosts);
        }

        return responseData;
    } catch (error: any) {
        console.error("Error getting group posts:", error);

        // Handle specific error cases
        if (error.response?.status === 403) {
            return {
                success: false,
                message: "Bạn không có quyền truy cập nhóm này",
                data: {
                    items: [],
                    totalRecords: 0,
                    pageNumber: 1,
                    pageSize: 10,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false
                }
            };
        } else if (error.response?.status === 401) {
            return {
                success: false,
                message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
                data: {
                    items: [],
                    totalRecords: 0,
                    pageNumber: 1,
                    pageSize: 10,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false
                }
            };
        } else if (error.response?.status === 404) {
            return {
                success: false,
                message: "Nhóm không tồn tại",
                data: {
                    items: [],
                    totalRecords: 0,
                    pageNumber: 1,
                    pageSize: 10,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false
                }
            };
        }

        return {
            success: false,
            message: error.response?.data?.message || "Không thể lấy danh sách bài đăng",
            data: {
                items: [],
                totalRecords: 0,
                pageNumber: 1,
                pageSize: 10,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false
            }
        };
    }
};

export const createGroupPost = async (
    groupId: string,
    postData: {
        title: string;
        contentMarkdown: string;
        attachmentFileIds?: string[];
    }
): Promise<CustomerApiResponse<any>> => {
    try {
        console.log("Creating post for group:", groupId);
        console.log("Post data:", postData);
        console.log("API URL:", `/groups/${groupId}/posts`);

        const response = await customerApiClient.post(`/groups/${groupId}/posts`, postData);
        console.log("Create post response:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("Error creating group post:", error);
        console.error("Error response:", error.response);
        console.error("Error status:", error.response?.status);
        console.error("Error data:", error.response?.data);

        return {
            success: false,
            message: error.response?.data?.message || "Không thể tạo bài đăng",
            data: null
        };
    }
};

// Legacy uploadFiles function - use uploadMultipleFiles instead
export const uploadFiles = async (files: File[]): Promise<CustomerApiResponse<{ fileIds: string[] }>> => {
    try {
        const results = await uploadMultipleFiles(files, 'file');

        if (results.success) {
            // Extract file IDs from successful uploads
            const fileIds = results.data
                .filter((result: any) => result.success && result.data?.fileId)
                .map((result: any) => result.data.fileId.toString());

            return {
                success: true,
                message: 'Upload thành công',
                data: { fileIds }
            };
        } else {
            return {
                success: false,
                message: results.message || 'Không thể tải lên file',
                data: { fileIds: [] }
            };
        }
    } catch (error: any) {
        console.error("Error uploading files:", error);
        return {
            success: false,
            message: error.response?.data?.message || "Không thể tải lên file",
            data: { fileIds: [] }
        };
    }
};

// ===============================
// POST INTERACTIONS API FUNCTIONS
// ===============================

export const togglePostLike = async (postId: string): Promise<CustomerApiResponse<any>> => {
    try {
        const response = await customerApiClient.post(`/posts/${postId}/toggle-like`);
        return response.data;
    } catch (error: any) {
        // Don't log errors for demo mode
        if (postId.startsWith('temp-')) {
            return {
                success: false,
                message: "Chức năng này cần API thật để hoạt động",
                data: null
            };
        }
        console.error("Error toggling post like:", error);
        return {
            success: false,
            message: error.response?.data?.message || "Không thể thích/bỏ thích bài đăng",
            data: null
        };
    }
};

export const addPostComment = async (
    postId: string,
    commentData: {
        content: string;
        parentCommentId?: number;
    }
): Promise<CustomerApiResponse<any>> => {
    try {
        const response = await customerApiClient.post(`/posts/${postId}/comments`, commentData);
        return response.data;
    } catch (error: any) {
        // Don't log errors for demo mode
        if (postId.startsWith('temp-')) {
            return {
                success: false,
                message: "Chức năng này cần API thật để hoạt động",
                data: null
            };
        }
        console.error("Error adding post comment:", error);
        return {
            success: false,
            message: error.response?.data?.message || "Không thể thêm bình luận",
            data: null
        };
    }
};

export const getPostDetail = async (postId: string): Promise<CustomerApiResponse<any>> => {
    try {
        const response = await customerApiClient.get(`/posts/${postId}`);

        // Map database response to Post interface with comments
        if (response.data?.success && response.data?.data) {
            const dbPost = response.data.data;
            console.log("Raw post detail:", dbPost);

            const mappedPost = {
                id: dbPost.postId?.toString() || dbPost.id || dbPost.PostID?.toString(),
                postId: dbPost.postId || dbPost.PostID,
                title: dbPost.title || dbPost.Title || "Không có tiêu đề",
                content: dbPost.content || dbPost.Content || "",
                contentMarkdown: dbPost.contentMarkdown || dbPost.content || dbPost.Content || "",
                authorId: dbPost.authorUserId || dbPost.authorId || dbPost.AuthorUserID || "unknown",
                authorName: dbPost.authorDisplayName || dbPost.authorName || dbPost.AuthorDisplayName || "Unknown User",
                authorAvatar: dbPost.authorAvatarUrl || dbPost.authorAvatar || dbPost.AuthorAvatarUrl || "",
                author: {
                    userId: dbPost.authorUserId || dbPost.authorId || dbPost.AuthorUserID || "unknown",
                    displayName: dbPost.authorDisplayName || dbPost.authorName || dbPost.AuthorDisplayName || "Unknown User",
                    avatarUrl: dbPost.authorAvatarUrl || dbPost.authorAvatar || dbPost.AuthorAvatarUrl || ""
                },
                groupId: dbPost.groupId || dbPost.GroupID,
                likeCount: dbPost.likeCount || dbPost.LikeCount || 0,
                commentCount: dbPost.commentCount || dbPost.CommentCount || 0,
                isPinned: dbPost.isPinned || dbPost.IsPinned || false,
                isDeleted: dbPost.isDeleted || dbPost.IsDeleted || false,
                createdAt: dbPost.createdAt || dbPost.CreatedAt,
                updatedAt: dbPost.updatedAt || dbPost.UpdatedAt,
                comments: dbPost.comments?.map((dbComment: any) => {
                    console.log("Mapping comment:", dbComment);
                    return {
                        id: dbComment.commentId?.toString() || dbComment.id || dbComment.CommentID?.toString(),
                        commentId: dbComment.commentId || dbComment.CommentID,
                        content: dbComment.content || dbComment.Content,
                        authorId: dbComment.authorUserId || dbComment.authorId || dbComment.AuthorUserID || "unknown",
                        authorName: dbComment.authorDisplayName || dbComment.authorName || dbComment.AuthorDisplayName || "Unknown User",
                        authorAvatar: dbComment.authorAvatarUrl || dbComment.authorAvatar || dbComment.AuthorAvatarUrl || "",
                        author: {
                            userId: dbComment.authorUserId || dbComment.authorId || dbComment.AuthorUserID || "unknown",
                            displayName: dbComment.authorDisplayName || dbComment.authorName || dbComment.AuthorDisplayName || "Unknown User",
                            avatarUrl: dbComment.authorAvatarUrl || dbComment.authorAvatar || dbComment.AuthorAvatarUrl || ""
                        },
                        postId: dbComment.postId || dbComment.PostID,
                        parentCommentId: dbComment.parentCommentId || dbComment.ParentCommentID,
                        likeCount: dbComment.likeCount || dbComment.LikeCount || 0,
                        isLiked: dbComment.isLiked || dbComment.IsLiked || false,
                        createdAt: dbComment.createdAt || dbComment.CreatedAt,
                        updatedAt: dbComment.updatedAt || dbComment.UpdatedAt
                    };
                }) || []
            };

            console.log("Mapped post detail:", mappedPost);
            response.data.data = mappedPost;
        }

        return response.data;
    } catch (error: any) {
        // Don't log errors for demo mode
        if (postId.startsWith('temp-')) {
            return {
                success: false,
                message: "Chức năng này cần API thật để hoạt động",
                data: null
            };
        }
        console.error("Error fetching post detail:", error);
        return {
            success: false,
            message: error.response?.data?.message || "Không thể lấy chi tiết bài đăng",
            data: null
        };
    }
};
