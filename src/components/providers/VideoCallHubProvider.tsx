"use client"

import { useEffect, useRef, useCallback } from "react"
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr"
import { useAuthStore } from "@/store/authStore"
import { useVideoCallContext } from "@/contexts/VideoCallContext"
import { toast } from "sonner"

/**
 * VideoCallHubProvider manages the real-time connection for video call functionality.
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_API_URL: Base URL for the API (defaults to https://localhost:7007)
 * 
 * Hub Configuration:
 * - Hub URL: ${API_URL}/hubs/videoCall
 * - Authentication: JWT Bearer token from auth store
 * - Events: "IncomingCall", "CallAccepted", "CallRejected", "CallEnded"
 */

export function VideoCallHubProvider({ children }: { children: React.ReactNode }) {
    const { accessToken, isAuthenticated } = useAuthStore()
    const { handleIncomingCallNotification } = useVideoCallContext()
    const connectionRef = useRef<HubConnection | null>(null)
    const isComponentMountedRef = useRef(true)

    // Handle incoming call notification
    const handleIncomingCall = useCallback((data: any) => {
        console.log("[VideoCallHub] Incoming call received:", data)

        if (isComponentMountedRef.current) {
            // Hiển thị toast notification
            toast.info("📞 Cuộc gọi đến", {
                description: `${data.callerName} đang gọi cho bạn`,
                duration: 5000,
            })

            // Gửi thông báo đến VideoCallContext
            handleIncomingCallNotification({
                sessionId: data.sessionId,
                callerName: data.callerName,
                callerAvatar: data.callerAvatar,
                conversationId: data.conversationId
            })
        }
    }, [handleIncomingCallNotification])

    // Handle call accepted
    const handleCallAccepted = useCallback((data: any) => {
        console.log("[VideoCallHub] Call accepted:", data)

        if (isComponentMountedRef.current) {
            toast.success("✅ Cuộc gọi được chấp nhận", {
                description: "Bắt đầu phiên video call",
                duration: 3000,
            })
        }
    }, [])

    // Handle call rejected
    const handleCallRejected = useCallback((data: any) => {
        console.log("[VideoCallHub] Call rejected:", data)

        if (isComponentMountedRef.current) {
            toast.info("❌ Cuộc gọi bị từ chối", {
                description: "Cuộc gọi đã kết thúc",
                duration: 3000,
            })
        }
    }, [])

    // Handle call ended
    const handleCallEnded = useCallback((data: any) => {
        console.log("[VideoCallHub] Call ended:", data)

        if (isComponentMountedRef.current) {
            toast.info("🔚 Cuộc gọi kết thúc", {
                description: "Phiên video call đã kết thúc",
                duration: 3000,
            })
        }
    }, [])

    // Connect to video call hub
    const connectToHub = useCallback(async () => {
        if (!accessToken || !isAuthenticated) {
            console.log("[VideoCallHub] No access token or not authenticated, skipping connection")
            return
        }

        try {
            const hubUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7007'}/hubs/videoCall`
            console.log("[VideoCallHub] Attempting to connect to:", hubUrl)

            const connection = new HubConnectionBuilder()
                .withUrl(hubUrl, {
                    accessTokenFactory: () => accessToken,
                    skipNegotiation: false,
                    transport: 1, // WebSocket transport
                })
                .withAutomaticReconnect({
                    nextRetryDelayInMilliseconds: (retryContext) => {
                        if (retryContext.previousRetryCount === 0) return 0
                        if (retryContext.previousRetryCount === 1) return 5000
                        if (retryContext.previousRetryCount === 2) return 15000
                        if (retryContext.previousRetryCount === 3) return 30000
                        return null // Stop retrying
                    }
                })
                .configureLogging("Information")
                .build()

            // Set up event handlers
            connection.on("IncomingCall", handleIncomingCall)
            connection.on("CallAccepted", handleCallAccepted)
            connection.on("CallRejected", handleCallRejected)
            connection.on("CallEnded", handleCallEnded)

            // Start connection
            await connection.start()
            console.log("[VideoCallHub] Successfully connected to hub")
            console.log("[VideoCallHub] Connection ID:", connection.connectionId)

            connectionRef.current = connection

            // Set up connection event handlers
            connection.onclose((error) => {
                console.log("[VideoCallHub] Connection closed:", error)
                if (isComponentMountedRef.current) {
                    toast.error("🔌 Mất kết nối", {
                        description: "Không thể kết nối thời gian thực",
                        duration: 5000,
                    })
                }
            })

            connection.onreconnecting((error) => {
                console.log("[VideoCallHub] Reconnecting:", error)
                if (isComponentMountedRef.current) {
                    toast.info("🔄 Đang kết nối lại...", {
                        description: "Thiết lập lại kết nối thời gian thực",
                        duration: 3000,
                    })
                }
            })

            connection.onreconnected((connectionId) => {
                console.log("[VideoCallHub] Reconnected with ID:", connectionId)
                if (isComponentMountedRef.current) {
                    toast.success("✅ Đã kết nối lại", {
                        description: "Kết nối thời gian thực đã được thiết lập",
                        duration: 3000,
                    })
                }
            })

        } catch (error) {
            console.error("[VideoCallHub] Failed to connect to hub:", error)
            if (isComponentMountedRef.current) {
                toast.error("❌ Lỗi kết nối", {
                    description: "Không thể kết nối đến hub video call",
                    duration: 5000,
                })
            }
        }
    }, [accessToken, isAuthenticated, handleIncomingCall, handleCallAccepted, handleCallRejected, handleCallEnded])

    useEffect(() => {
        isComponentMountedRef.current = true

        if (isAuthenticated && accessToken) {
            connectToHub()
        }

        return () => {
            isComponentMountedRef.current = false
            if (connectionRef.current) {
                console.log("[VideoCallHub] Cleaning up connection")
                connectionRef.current.stop()
            }
        }
    }, [isAuthenticated, accessToken, connectToHub])

    return <>{children}</>
}


