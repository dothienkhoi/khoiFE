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

    // Setup real-time listeners (SignalR/WebSocket)
    useEffect(() => {
        // TODO: Kết nối SignalR/WebSocket để nhận thông báo cuộc gọi đến
        // Ví dụ:
        // const connection = new signalR.HubConnectionBuilder()
        //     .withUrl("/videoCallHub")
        //     .build()

        // connection.on("IncomingCall", handleIncomingCallNotification)
        // connection.start()

        // return () => {
        //     connection.stop()
        // }

        // Chờ Backend implement VideoCallHub để có real-time notifications

    }, [handleIncomingCallNotification])

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
