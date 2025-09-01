"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { pushNotificationService, PushNotificationPayload } from "@/lib/push-notifications";
import { toast } from "sonner";

interface PushNotificationContextType {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  requestPermission: () => Promise<boolean>;
  showNotification: (payload: PushNotificationPayload) => Promise<void>;
  unsubscribe: () => Promise<boolean>;
}

const PushNotificationContext = createContext<PushNotificationContextType | undefined>(undefined);

export function usePushNotification() {
  const context = useContext(PushNotificationContext);
  if (context === undefined) {
    throw new Error('usePushNotification must be used within a PushNotificationProvider');
  }
  return context;
}

interface PushNotificationProviderProps {
  children: ReactNode;
}

export function PushNotificationProvider({ children }: PushNotificationProviderProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check support and initialize
    const initializePushNotifications = async () => {
      const supported = pushNotificationService.isSupported();
      setIsSupported(supported);
      
      if (supported) {
        const currentPermission = pushNotificationService.getPermissionStatus();
        setPermission(currentPermission);

        // Auto-initialize if permission is already granted
        if (currentPermission === 'granted') {
          try {
            const initialized = await pushNotificationService.initialize();
            if (initialized) {
              setIsSubscribed(pushNotificationService.isSubscribed());
            }
          } catch (error) {
            console.error('Error auto-initializing push notifications:', error);
          }
        }
      }
    };

    initializePushNotifications();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    try {
      const granted = await pushNotificationService.requestPermission();
      setPermission(pushNotificationService.getPermissionStatus());

      if (granted) {
        const initialized = await pushNotificationService.initialize();
        if (initialized) {
          setIsSubscribed(pushNotificationService.isSubscribed());
          toast.success("Đã bật thông báo đẩy thành công");
          return true;
        }
      } else {
        toast.error("Cần cấp quyền thông báo để nhận cảnh báo quan trọng");
      }
      return false;
    } catch (error) {
      console.error('Error requesting push notification permission:', error);
      toast.error("Không thể thiết lập thông báo đẩy");
      return false;
    }
  };

  const showNotification = async (payload: PushNotificationPayload): Promise<void> => {
    try {
      await pushNotificationService.showLocalNotification(payload);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    try {
      const result = await pushNotificationService.unsubscribe();
      if (result) {
        setIsSubscribed(false);
        toast.success("Đã tắt thông báo đẩy");
      }
      return result;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast.error("Không thể tắt thông báo đẩy");
      return false;
    }
  };

  const contextValue: PushNotificationContextType = {
    isSupported,
    isSubscribed,
    permission,
    requestPermission,
    showNotification,
    unsubscribe,
  };

  return (
    <PushNotificationContext.Provider value={contextValue}>
      {children}
    </PushNotificationContext.Provider>
  );
}
