"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useAuthStore } from "@/store/authStore";
import { useCustomerStore } from "@/store/customerStore";
import { toast } from "sonner";
import { Message } from "@/types/customer.types";
import { getMessagePreview } from "@/lib/utils/messageUtils";
import {
    convertMessageType,
    createMessageFromDto,
    getMessagePreviewForConversation,
    isDirectConversation,
    isCurrentlyViewing
} from "@/lib/utils/realTimeUtils";

interface ChatHubContextType {
    connection: HubConnection | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    joinConversation: (conversationId: number) => Promise<void>;
    leaveConversation: (conversationId: number) => Promise<void>;
    startTyping: (conversationId: number) => Promise<void>;
    stopTyping: (conversationId: number) => Promise<void>;
    toggleReaction: (messageId: string, reactionCode: string) => Promise<void>;
    markMessagesAsRead: (conversationId: number, messageIds: string[]) => Promise<void>;
    startVideoCall: (conversationId: number) => Promise<void>;
    acceptVideoCall: (sessionId: string) => Promise<void>;
    rejectVideoCall: (sessionId: string) => Promise<void>;
    endVideoCall: (sessionId: string) => Promise<void>;
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

const ChatHubContext = createContext<ChatHubContextType | undefined>(undefined);

export function ChatHubProvider({ children }: { children: ReactNode }) {
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user, accessToken, isAuthenticated } = useAuthStore();
    const { addMessage, updateMessage, updateConversation } = useCustomerStore();
    const isComponentMounted = useRef(true);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const maxReconnectAttempts = 3;
    const reconnectAttempts = useRef(0);

    const createConnection = () => {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7007";
        const hubUrl = `${baseUrl}/hubs/chatHub`;

        const urlWithToken = accessToken ? `${hubUrl}?access_token=${accessToken}` : hubUrl;

        const hubConnection = new HubConnectionBuilder()
            .withUrl(urlWithToken, {
                withCredentials: true,
                skipNegotiation: false,
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (retryContext) => {
                    if (retryContext.previousRetryCount === 0) return 0;
                    if (retryContext.previousRetryCount < maxReconnectAttempts) {
                        return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 15000);
                    }
                    return null;
                }
            })
            .configureLogging(LogLevel.Warning)
            .build();

        return hubConnection;
    };

    const setupEventHandlers = (hubConnection: HubConnection) => {
        hubConnection.on("ReceiveMessage", (messageDto: any) => {

            const message = createMessageFromDto(messageDto);
            const messagePreview = getMessagePreviewForConversation(messageDto);
            const conversations = useCustomerStore.getState().conversations;
            const isDirect = isDirectConversation(conversations, messageDto.conversationId);
            const { activeChatId, activeChatType } = useCustomerStore.getState();
            const isViewing = isCurrentlyViewing(activeChatId, activeChatType, messageDto.conversationId);

            if (messageDto.sender.userId === user?.id) {
                // Handle message from current user (optimistic update)
                const existingMessages = useCustomerStore.getState().messages[messageDto.conversationId] || [];
                const optimisticMessage = existingMessages.find(msg =>
                    msg.id.startsWith('temp-') &&
                    msg.content === messageDto.content &&
                    msg.sentAt === messageDto.sentAt
                );

                if (optimisticMessage) {
                    updateMessage(messageDto.conversationId, optimisticMessage.id, {
                        id: messageDto.id,
                        sentAt: messageDto.sentAt,
                        sender: messageDto.sender,
                        parentMessage: messageDto.parentMessage,
                        isRead: false // Always start as unread for new messages
                    });
                }

                // Update conversation preview for sender (real-time sync)
                if (isDirect) {
                    updateConversation(messageDto.conversationId, {
                        lastMessagePreview: messagePreview,
                        lastMessageTimestamp: messageDto.sentAt,
                        lastMessageType: convertMessageType(messageDto.messageType)
                    });
                }
            } else {
                // Handle message from other users
                addMessage(messageDto.conversationId, message);

                if (!isViewing && isDirect) {
                    const conversation = conversations.find(c => c.conversationId === messageDto.conversationId);
                    updateConversation(messageDto.conversationId, {
                        unreadCount: (conversation?.unreadCount || 0) + 1,
                        lastMessagePreview: messagePreview,
                        lastMessageTimestamp: messageDto.sentAt,
                        lastMessageType: convertMessageType(messageDto.messageType)
                    });
                } else if (isViewing && isDirect) {
                    updateConversation(messageDto.conversationId, {
                        lastMessagePreview: messagePreview,
                        lastMessageTimestamp: messageDto.sentAt,
                        lastMessageType: convertMessageType(messageDto.messageType)
                    });
                }
            }

            // Dispatch custom event for real-time updates (both direct and group)
            window.dispatchEvent(new CustomEvent('newMessageReceived', {
                detail: {
                    conversationId: messageDto.conversationId,
                    message: messageDto,
                    isFromCurrentUser: messageDto.sender.userId === user?.id
                }
            }));

            // Nếu người nhận đang xem cuộc trò chuyện, tự động đánh dấu tin nhắn là đã xem
            if (messageDto.sender.userId === user?.id && isViewing && isDirect) {
                setTimeout(() => {
                    const { markMessagesAsRead: updateStore } = useCustomerStore.getState();
                    updateStore(messageDto.conversationId, [messageDto.id]);

                    // Dispatch event để người gửi biết tin nhắn đã được đọc
                    window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', {
                        detail: {
                            conversationId: messageDto.conversationId,
                            messageIds: [messageDto.id],
                            readerUserId: user?.id
                        }
                    }));
                }, 200);
            }
        });

        hubConnection.on("UserIsTyping", (conversationId: number, user: any) => {
            window.dispatchEvent(new CustomEvent('userTyping', {
                detail: { conversationId, user }
            }));
        });

        hubConnection.on("UserStoppedTyping", (conversationId: number, userId: string) => {
            window.dispatchEvent(new CustomEvent('userStoppedTyping', {
                detail: { conversationId, userId }
            }));
        });

        hubConnection.on("MessageReactionsUpdated", (messageId: string, reactions: any[]) => {
            window.dispatchEvent(new CustomEvent('messageReactionsUpdated', {
                detail: { messageId, reactions }
            }));
        });

        hubConnection.on("ReactionError", (errors: any[]) => {
            toast.error("Không thể thêm reaction");
        });

        // Messages marked as read event
        hubConnection.on("MessagesMarkedAsRead", (conversationId: number, messageIds: string[], readerUserId: string) => {
            // Update message read status in store
            const { markMessagesAsRead: updateStore } = useCustomerStore.getState();
            updateStore(conversationId, messageIds);

            // Dispatch custom event for UI updates
            window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', {
                detail: { conversationId, messageIds, readerUserId }
            }));
        });

        // User joined conversation event
        hubConnection.on("UserJoinedConversation", (conversationId: number, userId: string) => {
            // Dispatch custom event for UI updates
            window.dispatchEvent(new CustomEvent('userJoinedConversation', {
                detail: { conversationId, userId }
            }));
        });

        // Video Call Events
        hubConnection.on("IncomingCall", (data: any) => {
            if (isComponentMounted.current) {
                // Dispatch custom event for VideoCallContext
                window.dispatchEvent(new CustomEvent('incomingCall', {
                    detail: {
                        sessionId: data.videoCallSessionId,
                        callerName: data.caller.displayName,
                        callerAvatar: data.caller.avatarUrl,
                        conversationId: data.conversationId
                    }
                }));

                // Show toast notification
                toast.info("📞 Cuộc gọi đến", {
                    description: `${data.caller.displayName} đang gọi cho bạn`,
                    duration: 5000,
                });
            }
        });

        hubConnection.on("CallAccepted", (data: any) => {

            if (isComponentMounted.current) {
                window.dispatchEvent(new CustomEvent('callAccepted', {
                    detail: {
                        sessionId: data.videoCallSessionId,
                        callerName: data.callerName
                    }
                }));

                toast.success("✅ Cuộc gọi được chấp nhận", {
                    description: "Bắt đầu phiên video call",
                    duration: 3000,
                });
            }
        });

        hubConnection.on("CallRejected", (data: any) => {

            if (isComponentMounted.current) {
                window.dispatchEvent(new CustomEvent('callRejected', {
                    detail: {
                        sessionId: data.videoCallSessionId,
                        callerName: data.callerName
                    }
                }));

                toast.info("❌ Cuộc gọi bị từ chối", {
                    description: "Cuộc gọi đã kết thúc",
                    duration: 3000,
                });
            }
        });

        hubConnection.on("CallEnded", (data: any) => {

            if (isComponentMounted.current) {
                window.dispatchEvent(new CustomEvent('callEnded', {
                    detail: {
                        sessionId: data.videoCallSessionId,
                        callerName: data.callerName
                    }
                }));

                toast.info("🔚 Cuộc gọi kết thúc", {
                    description: "Phiên video call đã kết thúc",
                    duration: 3000,
                });
            }
        });

        // Connection events
        hubConnection.onclose((error) => {
            if (isComponentMounted.current) {
                setIsConnected(false);

                if (error) {
                    setError(`Connection error: ${error.message}`);

                    if (error.message !== "Connection closed with an error.") {
                        toast.error("Kết nối chat bị gián đoạn");
                    }
                }
            }
        });

        hubConnection.onreconnecting((error) => {
            if (isComponentMounted.current) {
                setIsConnected(false);
                setError("Đang kết nối lại...");
            }
        });

        hubConnection.onreconnected((connectionId) => {
            if (isComponentMounted.current) {
                setIsConnected(true);
                setError(null);
                reconnectAttempts.current = 0;
                toast.success("Đã kết nối lại chat");
            }
        });
    };
    const connect = useCallback(async () => {
        if (isConnecting || isConnected || !user || !accessToken) {
            return;
        }

        try {
            setIsConnecting(true);
            setError(null);

            const hubConnection = createConnection();
            setupEventHandlers(hubConnection);

            await hubConnection.start();

            if (isComponentMounted.current) {
                setConnection(hubConnection);
                setIsConnected(true);
                setIsConnecting(false);
                setError(null);
                reconnectAttempts.current = 0;
            }
        } catch (error: any) {
            if (isComponentMounted.current) {
                setIsConnecting(false);
                setError(`Connection failed: ${error.message}`);

                if (error.message.includes("401") || error.message.includes("Unauthorized")) {
                    toast.error("Lỗi xác thực: Vui lòng đăng nhập lại");
                } else if (error.message.includes("WebSocket")) {
                    toast.error("Lỗi kết nối WebSocket: Kiểm tra kết nối mạng");
                } else {
                    toast.error(`Lỗi kết nối chat: ${error.message}`);
                }

                reconnectAttempts.current++;

                if (reconnectAttempts.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 15000);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        if (isComponentMounted.current) {
                            connect();
                        }
                    }, delay);
                } else {
                    reconnectAttempts.current = 0;
                }
            }
        }
    }, [isConnecting, isConnected, user, accessToken]);

    const disconnect = useCallback(async () => {
        if (connection) {
            try {
                await connection.stop();
            } catch (error) {
            }
            setConnection(null);
            setIsConnected(false);
        }
    }, [connection]);

    const joinConversation = async (conversationId: number) => {
        if (!connection || !isConnected) {
            return;
        }
        try {
            await connection.invoke("JoinConversation", conversationId);

            // Auto-mark all unread messages as read when joining conversation
            setTimeout(async () => {
                const { messages } = useCustomerStore.getState();
                const conversationMessages = messages[conversationId] || [];
                const unreadMessages = conversationMessages.filter(msg =>
                    msg.sender.userId !== user?.id && !msg.isRead
                );

                if (unreadMessages.length > 0) {
                    const messageIds = unreadMessages.map(msg => msg.id);
                    await markMessagesAsRead(conversationId, messageIds);
                }
            }, 100);
        } catch (error) {
        }
    };

    const leaveConversation = async (conversationId: number) => {
        if (!connection || !isConnected) return;
        try {
            await connection.invoke("LeaveConversation", conversationId);
        } catch (error) {
        }
    };

    const startTyping = async (conversationId: number) => {
        if (!connection || !isConnected || !user) return;
        try {
            const typingUser = {
                userId: user.id,
                displayName: user.fullName,
                avatarUrl: user.avatarUrl
            };
            await connection.invoke("StartTyping", conversationId, typingUser);
        } catch (error) {
        }
    };

    const stopTyping = async (conversationId: number) => {
        if (!connection || !isConnected) return;
        try {
            await connection.invoke("StopTyping", conversationId);
        } catch (error) {
        }
    };

    const toggleReaction = async (messageId: string, reactionCode: string) => {
        if (!connection || !isConnected) return;
        try {
            const dto = { messageId, reactionCode };
            await connection.invoke("ToggleReaction", dto);
        } catch (error) {
        }
    };

    const markMessagesAsRead = async (conversationId: number, messageIds: string[]) => {
        if (!connection || !isConnected) {
            return;
        }
        try {
            const dto = { conversationId, messageIds };
            await connection.invoke("MarkMessagesAsRead", dto);

            // Tạm thời tự động cập nhật trạng thái vì server không gửi event real-time
            setTimeout(() => {
                const { markMessagesAsRead: updateStore } = useCustomerStore.getState();
                updateStore(conversationId, messageIds);

                // Dispatch custom event để các component khác có thể lắng nghe
                window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', {
                    detail: { conversationId, messageIds, readerUserId: user?.id }
                }));
            }, 500);
        } catch (error) {
        }
    };

    const startVideoCall = async (conversationId: number) => {
        if (!connection || !isConnected) {
            return;
        }
        try {
            await connection.invoke("StartVideoCall", conversationId);
        } catch (error) {
        }
    };

    const acceptVideoCall = async (sessionId: string) => {
        if (!connection || !isConnected) {
            return;
        }
        try {
            await connection.invoke("AcceptVideoCall", sessionId);
        } catch (error) {
        }
    };

    const rejectVideoCall = async (sessionId: string) => {
        if (!connection || !isConnected) {
            return;
        }
        try {
            await connection.invoke("RejectVideoCall", sessionId);
        } catch (error) {
        }
    };

    const endVideoCall = async (sessionId: string) => {
        if (!connection || !isConnected) {
            return;
        }
        try {
            await connection.invoke("EndVideoCall", sessionId);
        } catch (error) {
        }
    };

    useEffect(() => {
        isComponentMounted.current = true;

        // Chỉ kết nối khi user đã đăng nhập hoàn toàn
        if (isAuthenticated && user && accessToken && user.id) {
            connect();
        } else {
            // Ngắt kết nối nếu user chưa đăng nhập
            disconnect();
        }

        return () => {
            isComponentMounted.current = false;

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }

            disconnect();
        };
    }, [user, accessToken, connect, disconnect]);

    const connectionStatus = isConnected ? 'connected' : isConnecting ? 'connecting' : error ? 'error' : 'disconnected';

    const value: ChatHubContextType = {
        connection,
        isConnected,
        isConnecting,
        error,
        connect,
        disconnect,
        joinConversation,
        leaveConversation,
        startTyping,
        stopTyping,
        toggleReaction,
        markMessagesAsRead,
        startVideoCall,
        acceptVideoCall,
        rejectVideoCall,
        endVideoCall,
        connectionStatus,
    };

    return (
        <ChatHubContext.Provider value={value}>
            {children}
        </ChatHubContext.Provider>
    );
}

export function useChatHub() {
    const context = useContext(ChatHubContext);
    if (context === undefined) {
        throw new Error('useChatHub must be used within a ChatHubProvider');
    }
    return context;
}
