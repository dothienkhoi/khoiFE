import { useState, useCallback, useEffect } from 'react'
import { videoCallService, VideoCallResponse } from '@/lib/video-call-service'

export interface VideoCallState {
    isOutgoingCallOpen: boolean
    isIncomingCallOpen: boolean
    recipientName: string
    recipientAvatar?: string
    callerName: string
    callerAvatar?: string
    callDuration: number
    isRinging: boolean
    // Thêm các trường mới cho video call thực tế
    conversationId?: number
    sessionId?: string
    livekitToken?: string
    livekitServerUrl?: string
    isConnecting: boolean
    error?: string
}

export interface VideoCallActions {
    startOutgoingCall: (recipientName: string, conversationId: number, recipientAvatar?: string) => void
    startIncomingCall: (callerName: string, sessionId: string, callerAvatar?: string) => void
    cancelCall: () => void
    acceptCall: () => void
    rejectCall: () => void
    closeModals: () => void
    // Thêm các action mới
    onCallAccepted: () => void
    onCallRejected: () => void
    onCallEnded: () => void
    retryOutgoingCall: () => void
}

export const useVideoCall = (): [VideoCallState, VideoCallActions] => {
    const [state, setState] = useState<VideoCallState>({
        isOutgoingCallOpen: false,
        isIncomingCallOpen: false,
        recipientName: '',
        recipientAvatar: undefined,
        callerName: '',
        callerAvatar: undefined,
        callDuration: 0,
        isRinging: false,
        conversationId: undefined,
        sessionId: undefined,
        livekitToken: undefined,
        livekitServerUrl: undefined,
        isConnecting: false,
        error: undefined
    })

    // Callback functions
    const onCallAccepted = useCallback(async () => {
        console.log('✅ Call accepted callback')

        try {
            if (state.sessionId) {
                // Gọi API để lấy token cho người gọi
                const response = await videoCallService.getCallerToken(state.sessionId)

                if (response.success) {
                    setState(prev => ({
                        ...prev,
                        livekitToken: response.data.livekitToken,
                        livekitServerUrl: response.data.livekitServerUrl,
                        isRinging: false,
                        isConnecting: false,
                        error: undefined
                    }))

                    console.log('✅ Caller token received successfully')
                    // TODO: Chuyển đến LiveKit client với token
                } else {
                    throw new Error(response.message || 'Failed to get caller token')
                }
            }
        } catch (error) {
            console.error('Error getting caller token:', error)
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to get caller token',
                isConnecting: false
            }))
        }
    }, [state.sessionId])

    const onCallRejected = useCallback(() => {
        console.log('❌ Call rejected callback')

        setState(prev => ({
            ...prev,
            isOutgoingCallOpen: false,
            isRinging: false,
            callDuration: 0,
            error: 'Cuộc gọi bị từ chối'
        }))
    }, [])

    const onCallEnded = useCallback(() => {
        console.log('🔚 Call ended callback')

        setState(prev => ({
            ...prev,
            isOutgoingCallOpen: false,
            isRinging: false,
            callDuration: 0,
            error: 'Cuộc gọi đã kết thúc'
        }))
    }, [])

    // Auto-close timer effect
    useEffect(() => {
        let timer: NodeJS.Timeout

        if ((state.isOutgoingCallOpen || state.isIncomingCallOpen) && state.isRinging && !state.error) {
            timer = setTimeout(() => {
                if (state.isOutgoingCallOpen) {
                    cancelCall()
                } else if (state.isIncomingCallOpen) {
                    rejectCall()
                }
            }, 5000)
        }

        return () => {
            if (timer) clearTimeout(timer)
        }
    }, [state.isOutgoingCallOpen, state.isIncomingCallOpen, state.isRinging, state.error])

    // Call duration timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout

        if ((state.isOutgoingCallOpen || state.isIncomingCallOpen) && state.isRinging && !state.error) {
            interval = setInterval(() => {
                setState(prev => ({
                    ...prev,
                    callDuration: prev.callDuration + 1
                }))
            }, 1000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [state.isOutgoingCallOpen, state.isIncomingCallOpen, state.isRinging, state.error])

    const startOutgoingCall = useCallback(async (recipientName: string, conversationId: number, recipientAvatar?: string) => {
        try {
            setState(prev => ({
                ...prev,
                isOutgoingCallOpen: true,
                isIncomingCallOpen: false,
                recipientName,
                recipientAvatar,
                conversationId,
                callDuration: 0,
                isRinging: true,
                isConnecting: true,
                error: undefined
            }))

            // Gọi API để bắt đầu cuộc gọi video
            const response: VideoCallResponse = await videoCallService.startVideoCall(conversationId)

            if (response.success) {
                setState(prev => ({
                    ...prev,
                    sessionId: response.data.videoCallSessionId,
                    livekitToken: response.data.livekitToken,
                    livekitServerUrl: response.data.livekitServerUrl,
                    isConnecting: false
                }))

                console.log('Video call started successfully:', response.data)
            } else {
                throw new Error(response.message || 'Failed to start video call')
            }
        } catch (error) {
            console.error('Error starting video call:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to start video call'

            setState(prev => ({
                ...prev,
                error: errorMessage,
                isConnecting: false
            }))

            // Không tự động đóng modal nếu có lỗi - để user có thể retry
        }
    }, [])

    const startIncomingCall = useCallback((callerName: string, sessionId: string, callerAvatar?: string) => {
        setState(prev => ({
            ...prev,
            isIncomingCallOpen: true,
            isOutgoingCallOpen: false,
            callerName,
            callerAvatar,
            sessionId,
            callDuration: 0,
            isRinging: true,
            error: undefined
        }))
    }, [])

    const rejectCall = useCallback(async () => {
        try {
            console.log('❌ Rejecting video call...')

            // Chỉ gọi API nếu có sessionId thực tế (không phải test)
            if (state.sessionId && !state.sessionId.includes('test-')) {
                await videoCallService.rejectVideoCall(state.sessionId)
                console.log('✅ Call rejected successfully')
            } else {
                console.log('🧪 Test call rejected (no API call)')
            }

            // Đóng modal và reset state
            setState(prev => ({
                ...prev,
                isIncomingCallOpen: false,
                isOutgoingCallOpen: false,
                isRinging: false,
                callDuration: 0,
                sessionId: undefined,
                livekitToken: undefined,
                livekitServerUrl: undefined,
                isConnecting: false,
                error: undefined
            }))

            // Gọi callback nếu có
            if (onCallRejected) {
                onCallRejected()
            }
        } catch (error) {
            console.error('Error rejecting video call:', error)
            setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Unknown error' }))
        }
    }, [state.sessionId, onCallRejected])

    const cancelCall = useCallback(async () => {
        try {
            console.log('🚫 Cancelling video call...')

            // Chỉ gọi API nếu có sessionId thực tế (không phải test)
            if (state.sessionId && !state.sessionId.includes('test-')) {
                await videoCallService.endVideoCall(state.sessionId)
                console.log('✅ Call ended successfully')
            } else {
                console.log('🧪 Test call cancelled (no API call)')
            }

            // Đóng modal và reset state
            setState(prev => ({
                ...prev,
                isOutgoingCallOpen: false,
                isIncomingCallOpen: false,
                isRinging: false,
                callDuration: 0,
                sessionId: undefined,
                livekitToken: undefined,
                livekitServerUrl: undefined,
                isConnecting: false,
                error: undefined
            }))

            // Gọi callback nếu có
            if (onCallEnded) {
                onCallEnded()
            }
        } catch (error) {
            console.error('Error ending video call:', error)
            setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Unknown error' }))
        }
    }, [state.sessionId, onCallEnded])

    const acceptCall = useCallback(async () => {
        try {
            console.log('✅ Accepting video call...')

            if (state.sessionId) {
                // Gọi API để chấp nhận cuộc gọi
                const response = await videoCallService.acceptVideoCall(state.sessionId)

                // Cập nhật state với thông tin LiveKit
                setState(prev => ({
                    ...prev,
                    livekitToken: response.data.livekitToken,
                    livekitServerUrl: response.data.livekitServerUrl,
                    isConnecting: false,
                    error: undefined
                }))

                console.log('✅ Call accepted successfully')

                // Gọi callback
                onCallAccepted()
            }
        } catch (error) {
            console.error('Error accepting video call:', error)
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Unknown error',
                isConnecting: false
            }))
        }
    }, [state.sessionId])

    const closeModals = useCallback(() => {
        setState(prev => ({
            ...prev,
            isOutgoingCallOpen: false,
            isIncomingCallOpen: false,
            isRinging: false,
            callDuration: 0,
            isConnecting: false,
            error: undefined
        }))
    }, [])

    // Retry functionality
    const retryOutgoingCall = useCallback(() => {
        if (state.conversationId) {
            console.log('Retrying outgoing call...')
            startOutgoingCall(state.recipientName, state.conversationId, state.recipientAvatar)
        }
    }, [state.conversationId, state.recipientName, state.recipientAvatar, startOutgoingCall])

    const actions: VideoCallActions = {
        startOutgoingCall,
        startIncomingCall,
        cancelCall,
        acceptCall,
        rejectCall,
        closeModals,
        onCallAccepted,
        onCallRejected,
        onCallEnded,
        retryOutgoingCall
    }

    return [state, actions]
}
