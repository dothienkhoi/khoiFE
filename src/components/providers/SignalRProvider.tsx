"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { toast } from "sonner";
import { notificationPolling } from "@/lib/notification-polling";
import { useQueryClient } from "@tanstack/react-query";

interface SignalRContextType {
  connection: HubConnection | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

export function SignalRProvider({ children }: { children: ReactNode }) {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isComponentMounted = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;
  const reconnectAttempts = useRef(0);
  const queryClient = useQueryClient();

  const createConnection = () => {
    const hubConnection = new HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_API_BASE_URL}/adminNotificationHub`, {
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
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
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
      console.log("[SignalR] Attempting to connect...");

      const hubConnection = createConnection();

      // Set up event handlers
      hubConnection.onclose((error) => {
        if (isComponentMounted.current) {
          console.log("[SignalR] Connection closed:", error);
          setIsConnected(false);

          if (error) {
            console.error("[SignalR] Connection error:", error);
            setError(`Connection error: ${error.message}`);

            // Only show toast for unexpected errors, not for intentional disconnects or server errors
            const isServerError = error.message.includes("Server returned an error on close") ||
              error.message.includes("Connection closed with an error") ||
              error.message.includes("Internal server error");

            if (!isServerError) {
              toast.error("Kết nối thông báo bị gián đoạn");
            }
          }
        }
      });

      hubConnection.onreconnecting((error) => {
        if (isComponentMounted.current) {
          console.log("[SignalR] Reconnecting...", error);
          setIsConnected(false);
          setError("Đang kết nối lại...");
        }
      });

      hubConnection.onreconnected((connectionId) => {
        if (isComponentMounted.current) {
          console.log("[SignalR] Reconnected with connection ID:", connectionId);
          setIsConnected(true);
          setError(null);
          reconnectAttempts.current = 0;
          toast.success("Đã kết nối lại thông báo");
        }
      });

      // Start the connection with timeout
      const connectionPromise = hubConnection.start();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      );

      try {
        await Promise.race([connectionPromise, timeoutPromise]);
      } catch (timeoutError) {
        if (timeoutError instanceof Error && timeoutError.message.includes('timeout')) {
          console.log("[SignalR] Connection timeout, this is normal in development");
          // Don't treat timeout as a critical error in development
          if (process.env.NODE_ENV === 'production') {
            throw timeoutError;
          }
        } else {
          throw timeoutError;
        }
      }

      if (isComponentMounted.current) {
        console.log("[SignalR] Connected successfully");
        setConnection(hubConnection);
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttempts.current = 0;

        // Start notification polling
        notificationPolling.startPolling(queryClient, 30000);
      }
    } catch (error: any) {
      if (isComponentMounted.current) {
        console.error("[SignalR] Connection failed:", error);
        setIsConnecting(false);
        setError(`Connection failed: ${error.message}`);

        // Increment reconnect attempts
        reconnectAttempts.current++;

        if (reconnectAttempts.current < maxReconnectAttempts) {
          // Schedule reconnection attempt
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`[SignalR] Scheduling reconnection attempt ${reconnectAttempts.current} in ${delay}ms`);

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isComponentMounted.current) {
              connect();
            }
          }, delay);
        } else {
          console.log("[SignalR] Max reconnection attempts reached, disabling SignalR");
          setError("SignalR disabled due to repeated connection failures");

          // In development, don't show error toast for SignalR issues
          if (process.env.NODE_ENV === 'production') {
            toast.error("Không thể kết nối thông báo sau nhiều lần thử");
          }

          // Stop trying to reconnect
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        }
      }
    }
  };

  const disconnect = async () => {
    try {
      if (connection) {
        console.log("[SignalR] Disconnecting...");
        await connection.stop();
        setConnection(null);
        setIsConnected(false);
        setError(null);
      }

      // Stop notification polling
      notificationPolling.stopPolling();

      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      reconnectAttempts.current = 0;
    } catch (error) {
      console.error("[SignalR] Error during disconnect:", error);
    }
  };

  useEffect(() => {
    isComponentMounted.current = true;

    // Kiểm tra xem có cần kết nối SignalR không
    const shouldConnect = process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_ENABLE_SIGNALR === 'true';

    if (shouldConnect) {
      console.log("[SignalR] Attempting to connect...");
      connect();
    } else {
      console.log("[SignalR] SignalR connection disabled in development mode");
    }

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

  const value: SignalRContextType = {
    connection,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
  };

  return (
    <SignalRContext.Provider value={value}>
      {children}
    </SignalRContext.Provider>
  );
}

export function useSignalR() {
  const context = useContext(SignalRContext);
  if (context === undefined) {
    throw new Error("useSignalR must be used within a SignalRProvider");
  }
  return context;
}
