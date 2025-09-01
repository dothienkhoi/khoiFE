"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface CustomerSignalRContextType {
    connection: HubConnection | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
}

const CustomerSignalRContext = createContext<CustomerSignalRContextType | undefined>(undefined);

export function CustomerSignalRProvider({ children }: { children: ReactNode }) {
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isComponentMounted = useRef(true);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const maxReconnectAttempts = 3;
    const reconnectAttempts = useRef(0);
    const queryClient = useQueryClient();

    const createConnection = () => {
        const hubConnection = new HubConnectionBuilder()
            .withUrl(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customerNotificationHub`, {
                withCredentials: true,
                skipNegotiation: true,
                transport: 1, // WebSockets only
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (retryContext) => {
                    if (retryContext.previousRetryCount === 0) {
                        return 0;
                    }
                    if (retryContext.previousRetryCount < maxReconnectAttempts) {
                        return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 15000);
                    }
                    return null; // Stop trying to reconnect
                }
            })
            .configureLogging(LogLevel.Information)
            .build();

        return hubConnection;
    };

    const connect = async () => {
        if (isConnecting || isConnected) return;

        try {
            setIsConnecting(true);
            setError(null);
            console.log("[CustomerSignalR] Attempting to connect...");

            const hubConnection = createConnection();

            // Set up event handlers
            hubConnection.onclose((error) => {
                if (isComponentMounted.current) {
                    console.log("[CustomerSignalR] Connection closed:", error);
                    setIsConnected(false);

                    if (error) {
                        console.error("[CustomerSignalR] Connection error:", error);
                        setError(`Connection error: ${error.message}`);

                        // Only show toast for unexpected errors, not for intentional disconnects
                        if (error.message !== "Connection closed with an error.") {
                            toast.error("Kết nối thông báo bị gián đoạn");
                        }
                    }
                }
            });

            hubConnection.onreconnecting((error) => {
                if (isComponentMounted.current) {
                    console.log("[CustomerSignalR] Reconnecting...", error);
                    setIsConnected(false);
                    setError("Đang kết nối lại...");
                }
            });

            hubConnection.onreconnected((connectionId) => {
                if (isComponentMounted.current) {
                    console.log("[CustomerSignalR] Reconnected with connection ID:", connectionId);
                    setIsConnected(true);
                    setError(null);
                    reconnectAttempts.current = 0;
                    toast.success("Đã kết nối lại thông báo");
                }
            });

            // Start the connection
            await hubConnection.start();

            if (isComponentMounted.current) {
                console.log("[CustomerSignalR] Connected successfully");
                setConnection(hubConnection);
                setIsConnected(true);
                setIsConnecting(false);
                setError(null);
                reconnectAttempts.current = 0;
            }
        } catch (error: any) {
            if (isComponentMounted.current) {
                console.error("[CustomerSignalR] Connection failed:", error);
                setIsConnecting(false);
                setError(`Connection failed: ${error.message}`);

                // Increment reconnect attempts
                reconnectAttempts.current++;

                if (reconnectAttempts.current < maxReconnectAttempts) {
                    // Schedule reconnection attempt
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 15000);
                    console.log(`[CustomerSignalR] Scheduling reconnection attempt ${reconnectAttempts.current} in ${delay}ms`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        if (isComponentMounted.current) {
                            connect();
                        }
                    }, delay);
                } else {
                    console.log("[CustomerSignalR] Max reconnection attempts reached, stopping");
                    toast.error("Không thể kết nối thông báo sau nhiều lần thử");
                }
            }
        }
    };

    const disconnect = async () => {
        try {
            if (connection) {
                console.log("[CustomerSignalR] Disconnecting...");
                await connection.stop();
                setConnection(null);
                setIsConnected(false);
                setError(null);
            }

            // Clear any pending reconnection attempts
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }

            reconnectAttempts.current = 0;
        } catch (error) {
            console.error("[CustomerSignalR] Error during disconnect:", error);
        }
    };

    useEffect(() => {
        isComponentMounted.current = true;

        // Tạm thời tắt SignalR để tránh lỗi
        console.log("[CustomerSignalR] Temporarily disabled to avoid connection errors");

        // Connect on mount - TẮT TẠM THỜI
        // connect();

        // Cleanup on unmount
        return () => {
            isComponentMounted.current = false;

            // Clear any pending timeouts
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }

            // Disconnect and cleanup
            disconnect();
        };
    }, []);

    const value: CustomerSignalRContextType = {
        connection,
        isConnected,
        isConnecting,
        error,
        connect,
        disconnect,
    };

    return (
        <CustomerSignalRContext.Provider value={value}>
            {children}
        </CustomerSignalRContext.Provider>
    );
}

export function useCustomerSignalR() {
    const context = useContext(CustomerSignalRContext);
    if (context === undefined) {
        throw new Error("useCustomerSignalR must be used within a CustomerSignalRProvider");
    }
    return context;
}
