"use client";

import { useEffect, useRef, useCallback } from "react";
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { useAuthStore } from "@/store/authStore";
import { useCustomerStore } from "@/store/customerStore";
import { toast } from "sonner";
import { throttle } from "lodash-es";
import { Message } from "@/types/customer.types";
import React from "react";

// Global connection manager to prevent multiple connections
let globalConnection: HubConnection | null = null;
let globalConnectionPromise: Promise<void> | null = null;
let isConnecting = false;
let connectionId = 0;
let activeProviderCount = 0;

/**
 * ChatHubProvider manages the real-time connection for chat functionality.
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_API_URL: Base URL for the API (defaults to https://localhost:7007)
 * 
 * Hub Configuration:
 * - Hub URL: ${API_URL}/hubs/chatHub
 * - Authentication: JWT Bearer token from auth store
 * - Events: "ReceiveMessage", "UserIsTyping", "UserStoppedTyping", "MessageReactionsUpdated"
 */

export function ChatHubProvider({ children }: { children: React.ReactNode }) {
    const { accessToken, isAuthenticated } = useAuthStore();
    const { addMessage } = useCustomerStore();
    const isComponentMountedRef = useRef(true);

    // Filter out common WebSocket errors that are expected
    const shouldLogError = (error: any): boolean => {
        if (!error || !error.message) return false;

        const expectedErrors = [
            'Connection closed with an error',
            'Connection closed during setup',
            'Page unload',
            'Navigation cancelled',
            'onerror is not a function',
            'Server returned an error on close',
            'Connection disconnected with error',
            'Server returned an error on close: Connection closed with an error'
        ];

        return !expectedErrors.some(expected => error.message.includes(expected));
    };

    // Create throttled toast functions to prevent notification spam
    const showThrottledNotification = useCallback(
        throttle((title: string, message: string, duration?: number) => {
            toast.info(title, {
                description: message,
                duration: duration || 3000,
            });
        }, 1000, { leading: true, trailing: false }),
        []
    );

    // Handle incoming messages
    const handleReceiveMessage = useCallback((message: Message) => {
        console.log("[ChatHub] Received message:", message);
        console.log("[ChatHub] Connection ID:", globalConnection?.connectionId);
        console.log("[ChatHub] Message ID:", message.id);

        if (isComponentMountedRef.current) {
            // Check if message already exists
            const existingMessages = useCustomerStore.getState().messages[message.conversationId] || [];
            const messageExists = existingMessages.some(existing => existing.id === message.id);

            if (messageExists) {
                console.log(`[ChatHub] Message ${message.id} already exists, skipping...`);
                return;
            }

            // Add new message
            addMessage(message.conversationId, message);
            console.log(`[ChatHub] Added new message: ${message.id}`);
        }
    }, [addMessage]);

    // Handle typing indicators
    const handleUserTyping = useCallback((conversationId: number, userInfo: { userId: string; fullName: string }) => {
        if (isComponentMountedRef.current) {
            showThrottledNotification(
                `${userInfo.fullName} đang nhập tin nhắn...`,
                "",
                2000
            );
        }
    }, [showThrottledNotification]);

    const handleUserStoppedTyping = useCallback((conversationId: number, userId: string) => {
        if (isComponentMountedRef.current) {
            // TODO: Hide typing indicator in UI
            console.log(`[ChatHub] User ${userId} stopped typing in conversation ${conversationId}`);
        }
    }, []);

    // Handle message reactions
    const handleMessageReactionsUpdated = useCallback((messageId: string, reactions: any[], conversationId?: number) => {
        if (isComponentMountedRef.current) {
            const state = useCustomerStore.getState();
            if (conversationId && state.messages[conversationId]) {
                const updatedMessages = state.messages[conversationId].map(msg =>
                    msg.id === messageId ? { ...msg, reactions } : msg
                );
                state.setMessages(conversationId, updatedMessages);
            }
        }
    }, []);

    // Connect to chat hub
    const connectToHub = useCallback(async () => {
        if (isConnecting) {
            console.log("[ChatHub] Already connecting, skipping...");
            return;
        }

        // Check if there's already a global connection
        if (globalConnection && globalConnection.state === HubConnectionState.Connected) {
            console.log("[ChatHub] Global connection already exists and connected");
            console.log("[ChatHub] Connection ID:", globalConnection.connectionId);
            (window as any).chatHubConnection = globalConnection;
            return;
        }

        // Wait for existing connection promise
        if (globalConnectionPromise) {
            console.log("[ChatHub] Waiting for existing connection promise...");
            await globalConnectionPromise;
            if (globalConnection && globalConnection.state === HubConnectionState.Connected) {
                console.log("[ChatHub] Connection established from promise");
                (window as any).chatHubConnection = globalConnection;
                return;
            }
        }

        // Clear any existing connection
        if (globalConnection) {
            console.log("[ChatHub] Cleaning up existing global connection");
            try {
                await globalConnection.stop();
            } catch (e) {
                console.log("[ChatHub] Error stopping existing connection:", e);
            }
            globalConnection = null;
        }

        isConnecting = true;
        console.log("[ChatHub] Starting new connection...");
        const currentConnectionId = ++connectionId;
        console.log("[ChatHub] Connection attempt #", currentConnectionId);

        globalConnectionPromise = (async () => {
            try {
                // Connect to chat hub
                const hubUrl = `${process.env.NEXT_PUBLIC_API_URL || "https://localhost:7007"}/hubs/chatHub`;
                console.log("[ChatHub] Attempting to connect to:", hubUrl);

                // Build the connection with enhanced configuration
                const connection = new HubConnectionBuilder()
                    .withUrl(hubUrl, {
                        accessTokenFactory: () => {
                            console.log("[ChatHub] Providing access token for authentication");
                            return accessToken || "";
                        },
                        skipNegotiation: false,
                        transport: 1, // WebSocket transport
                        timeout: 30000, // 30s timeout
                        keepAliveIntervalInMilliseconds: 15000, // 15s keep-alive
                        serverTimeoutInMilliseconds: 60000, // 60s server timeout
                    })
                    .withAutomaticReconnect({
                        nextRetryDelayInMilliseconds: (retryContext) => {
                            // More aggressive retry logic with exponential backoff
                            if (retryContext.previousRetryCount === 0) return 0;
                            if (retryContext.previousRetryCount === 1) return 1000;  // 1s
                            if (retryContext.previousRetryCount === 2) return 3000;  // 3s
                            if (retryContext.previousRetryCount === 3) return 8000;  // 8s
                            if (retryContext.previousRetryCount === 4) return 15000; // 15s
                            if (retryContext.previousRetryCount === 5) return 30000; // 30s
                            return null; // Stop retrying after 6 attempts
                        }
                    })
                    // Reduce SignalR internal logs to only errors to avoid noisy console in dev
                    .configureLogging(LogLevel.Error)
                    .build();

                // Set up event handlers
                connection.on("ReceiveMessage", handleReceiveMessage);
                connection.on("UserIsTyping", handleUserTyping);
                connection.on("UserStoppedTyping", handleUserStoppedTyping);
                connection.on("MessageReactionsUpdated", handleMessageReactionsUpdated);

                // Start connection
                await connection.start();
                console.log("[ChatHub] Successfully connected to hub");
                console.log("[ChatHub] Connection ID:", connection.connectionId);
                console.log("[ChatHub] Transport: WebSocket");



                globalConnection = connection;
                (window as any).chatHubConnection = connection;

                // Set up connection event handlers
                connection.onclose((error) => {
                    if (error && shouldLogError(error)) {
                        console.warn("[ChatHub] Connection closed with error:", error);
                    } else if (!error) {
                        console.log("[ChatHub] Connection closed normally");
                    } else {
                        console.log("[ChatHub] Connection closed with expected error (filtered out)");
                    }

                    // Clean up global references
                    globalConnection = null;
                    (window as any).chatHubConnection = null;

                    // Reset connection state
                    setIsConnected(false);
                    setConnection(null);
                });

                connection.onreconnecting((error) => {
                    if (error) {
                        console.warn("[ChatHub] Reconnecting due to error:", error);
                    } else {
                        console.log("[ChatHub] Reconnecting...");
                    }
                });

                connection.onreconnected((connectionId) => {
                    console.log("[ChatHub] Reconnected. New connection ID:", connectionId);
                    setIsConnected(true);
                    setConnection(connection);
                });

                // Set up error handling using the correct method
                try {
                    // Use event-based error handling for SignalR
                    connection.on("Error", (error: any) => {
                        if (shouldLogError(error)) {
                            console.warn("[ChatHub] Connection error occurred:", error);
                        }
                    });
                } catch (error) {
                    console.warn("[ChatHub] Error setting up error handler:", error);
                }

            } catch (error) {
                // Only log errors that are not expected
                if (shouldLogError(error)) {
                    console.error("[ChatHub] Failed to connect:", error);
                } else {
                    console.warn("[ChatHub] Connection failed (expected):", error instanceof Error ? error.message : 'Unknown error');
                }

                // Handle specific connection errors
                if (error instanceof Error) {
                    if (error.message.includes('Connection closed with an error')) {
                        console.warn("[ChatHub] Connection closed during setup, this is normal");
                    } else if (error.message.includes('Unauthorized')) {
                        console.warn("[ChatHub] Authentication failed, token may be expired");
                    } else if (error.message.includes('onerror is not a function')) {
                        console.warn("[ChatHub] SignalR version compatibility issue, using alternative error handling");
                    }
                }

                globalConnection = null;
                (window as any).chatHubConnection = null;
            } finally {
                isConnecting = false;
                globalConnectionPromise = null;
            }
        })();

        await globalConnectionPromise;
    }, [accessToken, handleReceiveMessage, handleUserTyping, handleUserStoppedTyping, handleMessageReactionsUpdated]);

    useEffect(() => {
        isComponentMountedRef.current = true;
        activeProviderCount++;
        console.log("[ChatHub] Provider instance created. Total instances:", activeProviderCount);

        // Global error handler for WebSocket errors
        const handleGlobalError = (event: ErrorEvent) => {
            if (event.error && shouldLogError(event.error)) {
                console.warn("[ChatHub] Global WebSocket error:", event.error);
            }
        };

        // Global error handler for unhandled promise rejections
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            if (event.reason && shouldLogError(event.reason)) {
                console.warn("[ChatHub] Unhandled promise rejection:", event.reason);
            }
        };

        window.addEventListener('error', handleGlobalError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        // Cleanup function
        return () => {
            window.removeEventListener('error', handleGlobalError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };

        let connectionTimeout: NodeJS.Timeout | null = null;
        let reconnectTimeout: NodeJS.Timeout | null = null;

        // Only attempt connection for authenticated users
        if (!isAuthenticated || !accessToken) {
            return;
        }

        // Only allow connection if there's only one provider instance
        if (activeProviderCount > 1) {
            console.log("[ChatHub] Multiple provider instances detected, skipping connection");
            return;
        }

        // Attempt initial connection
        connectionTimeout = setTimeout(() => {
            connectToHub();
        }, 1000);

        // Set up reconnection logic
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                if (globalConnection?.state !== HubConnectionState.Connected) {
                    console.log("[ChatHub] Page became visible, attempting reconnection...");
                    reconnectTimeout = setTimeout(() => {
                        connectToHub();
                    }, 2000);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            isComponentMountedRef.current = false;
            activeProviderCount--;
            console.log("[ChatHub] Provider instance destroyed. Remaining instances:", activeProviderCount);

            // Remove global error handler
            window.removeEventListener('error', handleGlobalError);

            if (connectionTimeout) {
                clearTimeout(connectionTimeout);
            }
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }

            document.removeEventListener('visibilitychange', handleVisibilityChange);

            // Clean up connection if this is the last provider
            if (activeProviderCount === 0 && globalConnection) {
                console.log("[ChatHub] Last provider destroyed, cleaning up connection");
                globalConnection.stop().catch(console.error);
                globalConnection = null;
                (window as any).chatHubConnection = null;
            }
        };
    }, [isAuthenticated, accessToken, connectToHub]);

    return <>{children}</>;
}

// Export utility functions for external use
export const chatHubUtils = {
    async joinConversation(conversationId: number) {
        if (globalConnection?.state === HubConnectionState.Connected) {
            try {
                await globalConnection.invoke("JoinConversation", conversationId);
                console.log(`[ChatHub] Joined conversation ${conversationId}`);
            } catch (error) {
                console.error(`[ChatHub] Failed to join conversation ${conversationId}:`, error);
            }
        } else {
            console.warn("[ChatHub] Cannot join conversation: connection not ready");
        }
    },

    async leaveConversation(conversationId: number) {
        if (globalConnection?.state === HubConnectionState.Connected) {
            try {
                await globalConnection.invoke("LeaveConversation", conversationId);
                console.log(`[ChatHub] Left conversation ${conversationId}`);
            } catch (error) {
                console.error(`[ChatHub] Failed to leave conversation ${conversationId}:`, error);
            }
        }
    },

    async sendMessage(dto: any) {
        if (globalConnection?.state === HubConnectionState.Connected) {
            try {
                await globalConnection.invoke("SendMessage", dto);
                console.log("[ChatHub] Message sent successfully");
            } catch (error) {
                console.error("[ChatHub] Failed to send message:", error);
                throw error;
            }
        } else {
            throw new Error("ChatHub connection not ready");
        }
    },

    async startTyping(conversationId: number) {
        if (globalConnection?.state === HubConnectionState.Connected) {
            try {
                await globalConnection.invoke("StartTyping", conversationId);
            } catch (error) {
                console.error("[ChatHub] Failed to start typing:", error);
            }
        }
    },

    async stopTyping(conversationId: number) {
        if (globalConnection?.state === HubConnectionState.Connected) {
            try {
                await globalConnection.invoke("StopTyping", conversationId);
            } catch (error) {
                console.error("[ChatHub] Failed to stop typing:", error);
            }
        }
    },

    async toggleReaction(dto: any) {
        if (globalConnection?.state === HubConnectionState.Connected) {
            try {
                await globalConnection.invoke("ToggleReaction", dto);
            } catch (error) {
                console.error("[ChatHub] Failed to toggle reaction:", error);
                throw error;
            }
        } else {
            throw new Error("ChatHub connection not ready");
        }
    },

    async markMessagesAsRead(dto: any) {
        if (globalConnection?.state === HubConnectionState.Connected) {
            try {
                await globalConnection.invoke("MarkMessagesAsRead", dto);
            } catch (error) {
                console.error("[ChatHub] Failed to mark messages as read:", error);
                throw error;
            }
        } else {
            throw new Error("ChatHub connection not ready");
        }
    },

    getConnectionState() {
        return globalConnection?.state || HubConnectionState.Disconnected;
    },

    getConnectionId() {
        return globalConnection?.connectionId;
    }
};
