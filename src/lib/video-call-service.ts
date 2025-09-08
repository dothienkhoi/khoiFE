// Service để gọi API video call
import { useAuthStore } from '@/store/authStore'

export interface VideoCallResponse {
    success: boolean
    message: string
    data: {
        videoCallSessionId?: string
        livekitToken: string
        livekitServerUrl: string
    }
    errors: any[] | null
    statusCode: number
}

export interface StartVideoCallRequest {
    conversationId: number
}

export interface AcceptVideoCallRequest {
    sessionId: string
}

class VideoCallService {
    private baseUrl: string

    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7007'
        console.log('🎥 VideoCallService initialized with baseUrl:', this.baseUrl)
    }

    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`

        // Lấy token từ useAuthStore
        const authStore = useAuthStore.getState()
        const token = authStore.accessToken

        if (!token) {
            console.error('❌ No access token found in auth store!')
            throw new Error('Authentication required. Please login first.')
        }

        console.log('✅ Access token found, adding Authorization header')

        const defaultOptions: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers,
            },
            ...options,
        }

        console.log('🌐 Making request to:', url)
        console.log('📤 Request options:', {
            method: defaultOptions.method,
            headers: defaultOptions.headers,
            body: defaultOptions.body
        })

        try {
            const response = await fetch(url, defaultOptions)

            console.log('📥 Response status:', response.status)
            console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()))

            if (!response.ok) {
                // Log response body for debugging
                let errorBody = ''
                try {
                    errorBody = await response.text()
                    console.error('❌ Error response body:', errorBody)
                } catch (e) {
                    console.error('❌ Could not read error response body')
                }

                // Xử lý các lỗi cụ thể
                if (response.status === 401) {
                    console.error('🔐 Authentication failed - token may be invalid or expired')
                    throw new Error('Authentication failed. Please login again.')
                } else if (response.status === 403) {
                    console.error('🚫 Access forbidden - user may not have permission')
                    throw new Error('Access forbidden. You do not have permission to perform this action.')
                } else if (response.status === 404) {
                    console.error('🔍 Resource not found')
                    throw new Error('Resource not found. Please check the conversation ID.')
                } else if (response.status >= 500) {
                    console.error('💥 Server error')
                    throw new Error('Server error. Please try again later.')
                } else {
                    throw new Error(`Request failed with status ${response.status}${errorBody ? ` - ${errorBody}` : ''}`)
                }
            }

            const data = await response.json()
            console.log('✅ Response data:', data)
            return data
        } catch (error) {
            console.error('💥 Video call API error:', error)
            throw error
        }
    }

    /**
     * Bắt đầu một cuộc gọi video mới trong cuộc hội thoại
     */
    async startVideoCall(conversationId: number): Promise<VideoCallResponse> {
        console.log('📞 Starting video call for conversation:', conversationId)

        // Validate conversationId
        if (!conversationId || conversationId <= 0) {
            throw new Error('Invalid conversation ID')
        }

        return this.makeRequest<VideoCallResponse>(
            `/api/v1/conversations/${conversationId}/calls`,
            {
                method: 'POST',
            }
        )
    }

    /**
     * Chấp nhận lời mời gọi video trực tiếp
     */
    async acceptVideoCall(sessionId: string): Promise<VideoCallResponse> {
        console.log('✅ Accepting video call for session:', sessionId)

        // Validate sessionId
        if (!sessionId) {
            throw new Error('Invalid session ID')
        }

        return this.makeRequest<VideoCallResponse>(
            `/api/v1/video-calls/${sessionId}/accept`,
            {
                method: 'POST',
            }
        )
    }

    /**
     * Từ chối cuộc gọi video
     */
    async rejectVideoCall(sessionId: string): Promise<VideoCallResponse> {
        console.log('❌ Rejecting video call for session:', sessionId)

        // Validate sessionId
        if (!sessionId) {
            throw new Error('Invalid session ID')
        }

        return this.makeRequest<VideoCallResponse>(
            `/api/v1/video-calls/${sessionId}/reject`,
            {
                method: 'POST',
            }
        )
    }

    /**
     * Lấy token LiveKit cho người gọi sau khi cuộc gọi được chấp nhận
     */
    async getCallerToken(sessionId: string): Promise<VideoCallResponse> {
        console.log('🎫 Getting caller token for session:', sessionId)

        // Validate sessionId
        if (!sessionId) {
            throw new Error('Invalid session ID')
        }

        return this.makeRequest<VideoCallResponse>(
            `/api/v1/video-calls/${sessionId}/token`,
            {
                method: 'GET',
            }
        )
    }

    /**
     * Kết thúc cuộc gọi video
     */
    async endVideoCall(sessionId: string): Promise<VideoCallResponse> {
        console.log('🔚 Ending video call for session:', sessionId)

        // Validate sessionId
        if (!sessionId) {
            throw new Error('Invalid session ID')
        }

        return this.makeRequest<VideoCallResponse>(
            `/api/v1/video-calls/${sessionId}/end`,
            {
                method: 'POST',
            }
        )
    }
}

export const videoCallService = new VideoCallService()
