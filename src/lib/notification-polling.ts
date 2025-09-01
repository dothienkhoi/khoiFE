// Notification Polling Fallback
// Used when SignalR connection fails to provide basic real-time functionality

import { QueryClient } from "@tanstack/react-query";
import { getRecentNotifications } from "./api-client";
import { toast } from "sonner";
import { throttle } from "lodash-es";

export class NotificationPollingService {
    private static instance: NotificationPollingService;
    private pollingInterval: NodeJS.Timeout | null = null;
    private lastNotificationCount: number = 0;
    private queryClient: QueryClient | null = null;
    private isPolling = false;

    // Throttled toast notification - only show once every 10 seconds
    private showThrottledPollingNotification = throttle((count: number) => {
        toast.info(`Có ${count} thông báo mới`, {
            description: "Dữ liệu đã được cập nhật tự động",
            duration: 3000,
        });
    }, 10000, { leading: true, trailing: false });

    private constructor() { }

    public static getInstance(): NotificationPollingService {
        if (!NotificationPollingService.instance) {
            NotificationPollingService.instance = new NotificationPollingService();
        }
        return NotificationPollingService.instance;
    }

    /**
     * Start polling for new notifications
     */
    public startPolling(queryClient: QueryClient, intervalMs: number = 30000): void {
        if (this.isPolling) {
            console.log("[Polling] Already polling, skipping start");
            return;
        }

        this.queryClient = queryClient;
        this.isPolling = true;

        console.log(`[Polling] Starting notification polling every ${intervalMs}ms`);

        // Initial check
        this.checkForNewNotifications();

        // Set up polling interval
        this.pollingInterval = setInterval(() => {
            this.checkForNewNotifications();
        }, intervalMs);
    }

    /**
     * Stop polling
     */
    public stopPolling(): void {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }

        this.isPolling = false;
        this.queryClient = null;
        console.log("[Polling] Stopped notification polling");
    }

    /**
     * Check for new notifications and update cache
     */
    private async checkForNewNotifications(): Promise<void> {
        if (!this.queryClient) return;

        try {
            // Fetch latest notifications
            const response = await getRecentNotifications(1, 10);

            if (response.success && response.data) {
                const currentCount = response.data.totalRecords;

                // Check if there are new notifications
                if (this.lastNotificationCount > 0 && currentCount > this.lastNotificationCount) {
                    const newNotificationCount = currentCount - this.lastNotificationCount;

                    console.log(`[Polling] Found ${newNotificationCount} new notifications`);

                    // Show throttled toast for new notifications
                    this.showThrottledPollingNotification(newNotificationCount);

                    // Invalidate queries to refresh UI
                    this.queryClient.invalidateQueries({ queryKey: ["notifications-dropdown"] });
                    this.queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
                }

                this.lastNotificationCount = currentCount;
            }
        } catch (error) {
            console.warn("[Polling] Failed to check for notifications:", error);
            // Don't show error toasts for polling failures as they're less critical
        }
    }

    /**
     * Force refresh notifications
     */
    public async forceRefresh(): Promise<void> {
        if (this.queryClient) {
            await this.checkForNewNotifications();
        }
    }

    /**
     * Check if currently polling
     */
    public isActive(): boolean {
        return this.isPolling;
    }
}

// Export singleton instance
export const notificationPolling = NotificationPollingService.getInstance();
