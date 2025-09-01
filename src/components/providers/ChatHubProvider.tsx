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
 * - Group Support: JoinConversation, LeaveConversation for both 1-1 and group chats
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

    // Handle message reactions updates
    const handleMessageReactionsUpdated = useCallback((conversationId: number, messageId: string, reactions: any[]) => {
        if (isComponentMountedRef.current) {
            console.log(`[ChatHub] Message reactions updated: ${messageId} in conversation ${conversationId}`);
            // TODO: Update message reactions in store
        }
    }, []);

    // Create and configure SignalR connection
    const createConnection = useCallback(async (): Promise<HubConnection> => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7007";
        const hubUrl = `${apiUrl}/hubs/chatHub`;

        console.log("[ChatHub] Creating connection to:", hubUrl);

        const connection = new HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => accessToken || "",
                skipNegotiation: true,
                transport: 1, // WebSockets only
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (retryContext) => {
                    if (retryContext.previousRetryCount === 0) {
                        return 0;
                    }
                    if (retryContext.previousRetryCount < 5) {
                        return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
                    }
                    return null;
                }
            })
            .configureLogging(LogLevel.Information)
            .build();

        // Set up event handlers
        connection.on("ReceiveMessage", handleReceiveMessage);
        connection.on("UserIsTyping", handleUserTyping);
        connection.on("UserStoppedTyping", handleUserStoppedTyping);
        connection.on("MessageReactionsUpdated", handleMessageReactionsUpdated);

        // Connection lifecycle events
        connection.onclose((error) => {
            if (shouldLogError(error)) {
                console.error("[ChatHub] Connection closed with error:", error);
            }
        });

        connection.onreconnecting((error) => {
            console.log("[ChatHub] Reconnecting...", error);
        });

        connection.onreconnected((connectionId) => {
            console.log("[ChatHub] Reconnected with ID:", connectionId);
        });

        return connection;
    }, [accessToken, handleReceiveMessage, handleUserTyping, handleUserStoppedTyping, handleMessageReactionsUpdated]);

    // Connect to SignalR hub
    const connect = useCallback(async (): Promise<void> => {
        if (globalConnection && globalConnection.state === HubConnectionState.Connected) {
            console.log("[ChatHub] Already connected");
            return;
        }

        if (globalConnectionPromise) {
            console.log("[ChatHub] Connection in progress, waiting...");
            return globalConnectionPromise;
        }

        if (isConnecting) {
            console.log("[ChatHub] Already connecting");
            return;
        }

        try {
            isConnecting = true;
            globalConnectionPromise = (async () => {
                try {
                    if (!globalConnection) {
                        globalConnection = await createConnection();
                    }

                    if (globalConnection.state === HubConnectionState.Disconnected) {
                        console.log("[ChatHub] Starting connection...");
                        await globalConnection.start();
                        console.log("[ChatHub] Connected successfully");
                    }
                } finally {
                    isConnecting = false;
                    globalConnectionPromise = null;
                }
            })();

            await globalConnectionPromise;
        } catch (error) {
            console.error("[ChatHub] Failed to connect:", error);
            isConnecting = false;
            globalConnectionPromise = null;
            throw error;
        }
    }, [createConnection]);

    // Disconnect from SignalR hub
    const disconnect = useCallback(async (): Promise<void> => {
        if (globalConnection) {
            try {
                await globalConnection.stop();
                console.log("[ChatHub] Disconnected successfully");
            } catch (error) {
                console.error("[ChatHub] Error during disconnect:", error);
            } finally {
                globalConnection = null;
            }
        }
    }, []);

    // Join a conversation (1-1 or group)
    const joinConversation = useCallback(async (conversationId: number): Promise<void> => {
        if (!globalConnection || globalConnection.state !== HubConnectionState.Connected) {
            console.log("[ChatHub] Not connected, attempting to connect...");
            await connect();
        }

        if (globalConnection && globalConnection.state === HubConnectionState.Connected) {
            try {
                await globalConnection.invoke("JoinConversation", conversationId);
                console.log(`[ChatHub] Joined conversation: ${conversationId}`);
            } catch (error) {
                console.error(`[ChatHub] Failed to join conversation ${conversationId}:`, error);
            }
        }
    }, [connect]);

    // Leave a conversation
    const leaveConversation = useCallback(async (conversationId: number): Promise<void> => {
        if (globalConnection && globalConnection.state === HubConnectionState.Connected) {
            try {
                await globalConnection.invoke("LeaveConversation", conversationId);
                console.log(`[ChatHub] Left conversation: ${conversationId}`);
            } catch (error) {
                console.error(`[ChatHub] Failed to leave conversation ${conversationId}:`, error);
            }
        }
    }, []);

    // Send a message via SignalR
    const sendMessage = useCallback(async (conversationId: number, content: string, parentMessageId?: string): Promise<void> => {
        if (!globalConnection || globalConnection.state !== HubConnectionState.Connected) {
            console.log("[ChatHub] Not connected, attempting to connect...");
            await connect();
        }

        if (globalConnection && globalConnection.state === HubConnectionState.Connected) {
            try {
                const messageData = {
                    conversationId,
                    content,
                    parentMessageId: parentMessageId || null
                };

                await globalConnection.invoke("SendMessage", messageData);
                console.log(`[ChatHub] Message sent via SignalR: ${conversationId}`);
            } catch (error) {
                console.error(`[ChatHub] Failed to send message via SignalR:`, error);
                throw error;
            }
        } else {
            throw new Error("SignalR connection not available");
        }
    }, [connect]);

    // Send typing indicator
    const sendTypingIndicator = useCallback(async (conversationId: number, isTyping: boolean): Promise<void> => {
        if (globalConnection && globalConnection.state === HubConnectionState.Connected) {
            try {
                if (isTyping) {
                    await globalConnection.invoke("UserIsTyping", conversationId);
                } else {
                    await globalConnection.invoke("UserStoppedTyping", conversationId);
                }
            } catch (error) {
                console.error(`[ChatHub] Failed to send typing indicator:`, error);
            }
        }
    }, []);

    // Effect to connect when component mounts and user is authenticated
    useEffect(() => {
        if (isAuthenticated && accessToken) {
            connect().catch(console.error);
        }

        return () => {
            isComponentMountedRef.current = false;
        };
    }, [isAuthenticated, accessToken, connect]);

    // Effect to disconnect when component unmounts
    useEffect(() => {
        return () => {
            if (activeProviderCount === 0) {
                disconnect().catch(console.error);
            }
        };
    }, [disconnect]);

    // Increment provider count on mount
    useEffect(() => {
        activeProviderCount++;
        return () => {
            activeProviderCount--;
        };
    }, []);

    // Expose connection utilities globally
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).chatHubUtils = {
                connection: globalConnection,
                connect,
                disconnect,
                joinConversation,
                leaveConversation,
                sendMessage,
                sendTypingIndicator,
                isConnected: () => globalConnection?.state === HubConnectionState.Connected
            };
        }
    }, [connect, disconnect, joinConversation, leaveConversation, sendMessage, sendTypingIndicator]);

    return <>{children}</>;
}
