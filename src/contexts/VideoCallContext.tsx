"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useVideoCall } from '@/hooks/useVideoCall'

interface VideoCallContextType {
    // State
    isOutgoingCallOpen: boolean
    isIncomingCallOpen: boolean
    recipientName: string
    recipientAvatar?: string
    callerName: string
    callerAvatar?: string
    callDuration: number
    isRinging: boolean
    conversationId?: number
    sessionId?: string
    livekitToken?: string
    livekitServerUrl?: string
    isConnecting: boolean
    error?: string

    // Actions
    startOutgoingCall: (recipientName: string, conversationId: number, recipientAvatar?: string) => void
    startIncomingCall: (callerName: string, sessionId: string, callerAvatar?: string) => void
    cancelCall: () => void
    acceptCall: () => void
    rejectCall: () => void
    closeModals: () => void
    retryOutgoingCall: () => void
    onCallAccepted: () => void
    onCallRejected: () => void
    onCallEnded: () => void

    // Real-time handlers
    handleIncomingCallNotification: (data: IncomingCallData) => void
}

interface IncomingCallData {
    sessionId: string
    callerName: string
    callerAvatar?: string
    conversationId: number
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined)

export const useVideoCallContext = () => {
    const context = useContext(VideoCallContext)
    if (!context) {
        throw new Error('useVideoCallContext must be used within VideoCallProvider')
    }
    return context
}

export const VideoCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [videoCallState, videoCallActions] = useVideoCall()

    // Real-time incoming call handler
    const handleIncomingCallNotification = useCallback((data: IncomingCallData) => {
        // Hiển thị modal cuộc gọi đến
        videoCallActions.startIncomingCall(
            data.callerName,
            data.sessionId,
            data.callerAvatar
        )
    }, [videoCallActions])

    // Setup real-time listeners for video call events
    useEffect(() => {
        // Listen for incoming call notifications from VideoCallHub
        const handleIncomingCall = (event: CustomEvent) => {
            const { sessionId, callerName, callerAvatar, conversationId } = event.detail;
            handleIncomingCallNotification({
                sessionId,
                callerName,
                callerAvatar,
                conversationId
            });
        };

        // Listen for call accepted notifications
        const handleCallAccepted = (event: CustomEvent) => {
            const { sessionId, callerName } = event.detail;
            console.log("Call accepted:", sessionId);

            // Nếu đây là outgoing call và được accept
            if (videoCallState.isOutgoingCallOpen && videoCallState.sessionId === sessionId) {
                // Gọi API để lấy token cho người gọi
                videoCallActions.onCallAccepted();
            }
        };

        // Listen for call rejected notifications
        const handleCallRejected = (event: CustomEvent) => {
            const { sessionId, callerName } = event.detail;
            console.log("Call rejected:", sessionId);

            // Nếu đây là outgoing call và bị reject
            if (videoCallState.isOutgoingCallOpen && videoCallState.sessionId === sessionId) {
                videoCallActions.onCallRejected();
            }
        };

        // Listen for call ended notifications
        const handleCallEnded = (event: CustomEvent) => {
            const { sessionId, callerName } = event.detail;
            console.log("Call ended:", sessionId);

            // Nếu đây là outgoing call và bị end
            if (videoCallState.isOutgoingCallOpen && videoCallState.sessionId === sessionId) {
                videoCallActions.onCallEnded();
            }
        };

        // Add event listeners
        window.addEventListener('incomingCall', handleIncomingCall as EventListener);
        window.addEventListener('callAccepted', handleCallAccepted as EventListener);
        window.addEventListener('callRejected', handleCallRejected as EventListener);
        window.addEventListener('callEnded', handleCallEnded as EventListener);

        return () => {
            // Cleanup event listeners
            window.removeEventListener('incomingCall', handleIncomingCall as EventListener);
            window.removeEventListener('callAccepted', handleCallAccepted as EventListener);
            window.removeEventListener('callRejected', handleCallRejected as EventListener);
            window.removeEventListener('callEnded', handleCallEnded as EventListener);
        };
    }, [handleIncomingCallNotification, videoCallActions, videoCallState.isOutgoingCallOpen, videoCallState.sessionId])

    const contextValue: VideoCallContextType = {
        // State
        ...videoCallState,

        // Actions
        ...videoCallActions,

        // Real-time handlers
        handleIncomingCallNotification
    }

    return (
        <VideoCallContext.Provider value={contextValue}>
            {children}
        </VideoCallContext.Provider>
    )
}
