// Web Push Notifications Service
// Handles registration, subscription, and push notification management

export interface PushNotificationPayload {
  title: string;
  message: string;
  linkTo?: string;
  isCritical?: boolean;
  data?: Record<string, any>;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  // VAPID public key - should be set via NEXT_PUBLIC_VAPID_KEY environment variable
  private readonly VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || 
    'BKxnTW8ej5q7kXf-mj3UoE8aQjYmH3Y5RgT6cG0Z9A4nIJWxNqvF7rU2nH5B8J6LkMpVdHGt1WcK9qE3TyA8jQ';

  private constructor() {}

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Check if push notifications are supported by the browser
   */
  public isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Check if VAPID configuration is valid
   */
  public isVAPIDConfigured(): boolean {
    try {
      const key = this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY);
      return key.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get current notification permission status
   */
  public getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Request notification permission from user
   */
  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Register service worker and get push subscription
   */
  public async initialize(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered:', this.registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Get or create push subscription
      await this.createPushSubscription();

      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  /**
   * Create or get existing push subscription
   */
  private async createPushSubscription(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      // Check for existing subscription
      this.subscription = await this.registration.pushManager.getSubscription();

      if (!this.subscription) {
        // Convert VAPID key
        const applicationServerKey = this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY);
        
        // Check if VAPID key conversion was successful
        if (applicationServerKey.length === 0) {
          console.warn('Invalid VAPID key provided. Push notifications will not work properly.');
          console.warn('Please provide a valid VAPID public key in NEXT_PUBLIC_VAPID_KEY environment variable.');
          return; // Skip subscription creation if VAPID key is invalid
        }

        // Create new subscription
        this.subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey,
        });

        console.log('New push subscription created:', this.subscription);
      } else {
        console.log('Existing push subscription found:', this.subscription);
      }

      // Send subscription to server (implement this based on your API)
      if (this.subscription) {
        await this.sendSubscriptionToServer(this.subscription);
      }

    } catch (error) {
      console.error('Error creating push subscription:', error);
      
      // Don't throw error for VAPID key issues, just log and continue
      if (error instanceof Error && error.message.includes('VAPID')) {
        console.warn('Push notifications disabled due to VAPID key issues');
        return;
      }
      
      throw error;
    }
  }

  /**
   * Send subscription to server for storage
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      // TODO: Implement API call to save subscription to server
      // This would typically be a POST request to your backend
      console.log('Subscription to send to server:', JSON.stringify(subscription));
      
      // Example API call structure:
      // await apiClient.post('/admin/push-subscriptions', {
      //   subscription: subscription.toJSON(),
      //   userId: getCurrentUserId(),
      //   deviceInfo: navigator.userAgent
      // });
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  /**
   * Show a local notification (for testing or fallback)
   */
  public async showLocalNotification(payload: PushNotificationPayload): Promise<void> {
    if (this.getPermissionStatus() !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      if (this.registration) {
        await this.registration.showNotification(payload.title, {
          body: payload.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: payload.isCritical ? 'critical-alert' : 'admin-notification',
          requireInteraction: payload.isCritical || false,
          data: {
            url: payload.linkTo || '/admin/notifications',
            ...payload.data,
          },
        } as NotificationOptions & { actions?: { action: string; title: string }[] });
      } else {
        // Fallback to basic notification
        new Notification(payload.title, {
          body: payload.message,
          icon: '/favicon.ico',
        });
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  public async unsubscribe(): Promise<boolean> {
    try {
      if (this.subscription) {
        const result = await this.subscription.unsubscribe();
        this.subscription = null;
        console.log('Push subscription cancelled:', result);
        return result;
      }
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  /**
   * Get current subscription info
   */
  public getSubscription(): PushSubscription | null {
    return this.subscription;
  }

  /**
   * Check if user is currently subscribed
   */
  public isSubscribed(): boolean {
    return this.subscription !== null;
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    try {
      // Validate input
      if (!base64String || typeof base64String !== 'string') {
        throw new Error('Invalid VAPID key: must be a non-empty string');
      }

      // Add padding if needed
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      
      // Convert URL-safe base64 to regular base64
      const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      // Validate base64 format
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(base64)) {
        throw new Error('Invalid VAPID key format: not a valid base64 string');
      }

      // Decode base64
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }

      return outputArray;
    } catch (error) {
      console.error('Error converting VAPID key:', error);
      console.error('VAPID key provided:', base64String);
      
      // Return a fallback empty Uint8Array to prevent crashes
      // In production, you should provide a valid VAPID key
      return new Uint8Array(0);
    }
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();
