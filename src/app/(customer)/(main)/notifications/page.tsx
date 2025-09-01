"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Bell,
    Check,
    X,
    MessageCircle,
    Users,
    UserPlus,
    AtSign,
    Settings,
    Heart,
    MessageSquare,
    RefreshCw
} from "lucide-react";
import { useCustomerStore } from "@/store/customerStore";
import { CustomerNotification } from "@/types/customer.types";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, respondToInvitation, getPendingInvitations } from "@/lib/customer-api-client";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Extend Window interface for error logging flags
declare global {
    interface Window {
        __notificationToastShown?: boolean;
    }
}

export default function NotificationsPage() {
    const { notifications, setNotifications, unreadCount, setActiveChat } = useCustomerStore();
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState("all");
    const [respondedInvitations, setRespondedInvitations] = useState<Set<string>>(new Set()); // Track responded invitations
    const router = useRouter();

    // Load notifications when component mounts
    useEffect(() => {
        loadNotifications();

        // Load responded invitations from localStorage
        const savedResponded = localStorage.getItem('respondedInvitations');
        if (savedResponded) {
            try {
                const parsed = JSON.parse(savedResponded);
                setRespondedInvitations(new Set(parsed));
            } catch (error) {
                console.error('Error loading responded invitations:', error);
            }
        }
    }, []);

    const loadNotifications = async (pageNumber: number = 1) => {
        // Limit to maximum 3 pages
        if (pageNumber > 3) {
            toast.info("Chỉ hiển thị tối đa 3 trang thông báo");
            return;
        }
        try {
            const response = await getNotifications(pageNumber, 10); // 10 notifications per page

            if (response.success) {
                if (pageNumber === 1) {
                    setNotifications(response.data.items);
                } else {
                    const currentNotifications = useCustomerStore.getState().notifications;
                    setNotifications([...currentNotifications, ...response.data.items]);
                }

                // Only show "load more" if we haven't reached 3 pages yet
                const hasMorePages = response.data.pageNumber < response.data.totalPages;
                const underMaxPages = response.data.pageNumber < 3;
                setHasMore(hasMorePages && underMaxPages);
                setPage(response.data.pageNumber);
            } else {
                // Handle API error response - only show toast once per session
                if (!window.__notificationToastShown) {
                    toast.error(response.message || "Không thể tải thông báo");
                    window.__notificationToastShown = true;
                }
                if (pageNumber === 1) {
                    setNotifications([]);
                }
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            // Only show toast once per session
            if (!window.__notificationToastShown) {
                toast.error("Không thể tải thông báo");
                window.__notificationToastShown = true;
            }
            // Set empty notifications on error
            if (pageNumber === 1) {
                setNotifications([]);
            }
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await markNotificationAsRead(notificationId);
            // Update local state
            setNotifications(notifications.map(notif =>
                notif.id === notificationId ? { ...notif, isRead: true } : notif
            ));
        } catch (error) {
            console.error('Error marking notification as read:', error);
            toast.error("Không thể đánh dấu đã đọc");
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead();
            // Update local state
            setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
            toast.success("Đã đánh dấu tất cả là đã đọc");
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            toast.error("Không thể đánh dấu tất cả là đã đọc");
        }
    };

    const handleAcceptInvitation = async (notification: CustomerNotification) => {
        try {
            // Extract group name from notification content
            const content = notification.contentPreview || '';
            const groupNameMatch = content.match(/nhóm\s+([^.]+)/);
            const groupName = groupNameMatch ? groupNameMatch[1].trim() : 'chat';

            // Get pending invitations to find the correct invitationId
            const pendingInvitationsResponse = await getPendingInvitations();

            if (!pendingInvitationsResponse.success) {
                toast.error("Không thể tải danh sách lời mời");
                return;
            }

            // Find invitation by group name
            const pendingInvitation = pendingInvitationsResponse.data?.find(
                inv => inv.groupName.toLowerCase() === groupName.toLowerCase()
            );

            if (!pendingInvitation) {
                toast.error("Không tìm thấy lời mời cho nhóm này");
                return;
            }

            const invitationId = pendingInvitation.invitationId;

            // Call API to accept group invitation
            const response = await respondToInvitation(invitationId, true);

            if (response.success) {
                toast.success("Đã chấp nhận lời mời nhóm");

                // Mark notification as read
                await handleMarkAsRead(notification.id);

                // Mark this invitation as responded
                const notificationKey = `${notification.type}_${notification.contentPreview}_${notification.createdAt}`;
                setRespondedInvitations(prev => {
                    const newSet = new Set([...prev, notificationKey]);
                    // Save to localStorage
                    localStorage.setItem('respondedInvitations', JSON.stringify([...newSet]));
                    return newSet;
                });

                // Trigger refresh groups event
                window.dispatchEvent(new CustomEvent('refreshGroups'));

                // Wait a bit for groups to refresh, then navigate
                setTimeout(() => {
                    router.push('/groups');
                }, 500);

                toast.success(`Đã chấp nhận lời mời vào nhóm "${groupName}"`);
            } else {
                toast.error(response.message || "Không thể chấp nhận lời mời");
            }
        } catch (error) {
            console.error('Error accepting invitation:', error);
            toast.error("Không thể chấp nhận lời mời");
        }
    };

    const handleRejectInvitation = async (notification: CustomerNotification) => {
        try {
            // Extract group name from notification content
            const content = notification.contentPreview || '';
            const groupNameMatch = content.match(/nhóm\s+([^.]+)/);
            const groupName = groupNameMatch ? groupNameMatch[1].trim() : 'chat';

            // Get pending invitations to find the correct invitationId
            const pendingInvitationsResponse = await getPendingInvitations();

            if (!pendingInvitationsResponse.success) {
                toast.error("Không thể tải danh sách lời mời");
                return;
            }

            // Find invitation by group name
            const pendingInvitation = pendingInvitationsResponse.data?.find(
                inv => inv.groupName.toLowerCase() === groupName.toLowerCase()
            );

            if (!pendingInvitation) {
                toast.error("Không tìm thấy lời mời cho nhóm này");
                return;
            }

            const invitationId = pendingInvitation.invitationId;

            // Call API to reject group invitation
            await respondToInvitation(invitationId, false);
            toast.success("Đã từ chối lời mời nhóm");

            // Mark notification as read
            await handleMarkAsRead(notification.id);

            // Mark this invitation as responded
            const notificationKey = `${notification.type}_${notification.contentPreview}_${notification.createdAt}`;
            setRespondedInvitations(prev => {
                const newSet = new Set([...prev, notificationKey]);
                // Save to localStorage
                localStorage.setItem('respondedInvitations', JSON.stringify([...newSet]));
                return newSet;
            });
        } catch (error) {
            console.error('Error rejecting invitation:', error);
            toast.error("Không thể từ chối lời mời");
        }
    };

    // Filter notifications based on active tab
    const filteredNotifications = notifications.filter(notification => {
        switch (activeTab) {
            case "unread":
                return !notification.isRead;
            case "read":
                return notification.isRead;
            default:
                return true;
        }
    });

    const getNotificationIcon = (type: CustomerNotification['type']) => {
        switch (type) {
            case 'NewMessage':
                return <MessageCircle className="h-4 w-4" />;
            case 'GroupInvitation':
                return <Users className="h-4 w-4" />;
            case 'FriendRequest':
                return <UserPlus className="h-4 w-4" />;
            case 'Mention':
                return <AtSign className="h-4 w-4" />;
            case 'System':
                return <Settings className="h-4 w-4" />;
            case 'PostLike':
                return <Heart className="h-4 w-4" />;
            case 'PostComment':
                return <MessageSquare className="h-4 w-4" />;
            default:
                return <Bell className="h-4 w-4" />;
        }
    };

    const getNotificationTitle = (type: CustomerNotification['type']): string => {
        switch (type) {
            case 'NewMessage':
                return 'Tin nhắn mới';
            case 'GroupInvitation':
                return 'Lời mời nhóm';
            case 'FriendRequest':
                return 'Lời mời kết bạn';
            case 'Mention':
                return 'Được nhắc đến';
            case 'System':
                return 'Thông báo hệ thống';
            case 'PostLike':
                return 'Thích bài đăng';
            case 'PostComment':
                return 'Bình luận bài đăng';
            default:
                return 'Thông báo';
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1447e6] to-[#ad46ff] bg-clip-text text-transparent">Thông báo</h1>
                    <p className="text-muted-foreground">
                        Quản lý tất cả thông báo của bạn
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadNotifications()}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Làm mới
                    </Button>
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                        >
                            <Check className="h-4 w-4 mr-2" />
                            Đánh dấu tất cả
                        </Button>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-[#1447e6]/10 to-[#ad46ff]/10 p-1 rounded-xl">
                    <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-[#1447e6] dark:data-[state=active]:text-white rounded-lg">
                        Tất cả ({notifications.length})
                    </TabsTrigger>
                    <TabsTrigger value="unread" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-[#1447e6] dark:data-[state=active]:text-white rounded-lg">
                        Chưa đọc ({notifications.filter(n => !n.isRead).length})
                    </TabsTrigger>
                    <TabsTrigger value="read" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-[#1447e6] dark:data-[state=active]:text-white rounded-lg">
                        Đã đọc ({notifications.filter(n => n.isRead).length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    <ScrollArea className="h-[600px]">
                        <div className="space-y-4 pr-4">
                            {filteredNotifications.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bell className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium mb-2">
                                        {activeTab === "unread" ? "Không có thông báo chưa đọc" :
                                            activeTab === "read" ? "Không có thông báo đã đọc" :
                                                "Không có thông báo nào"}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {activeTab === "unread" ? "Tất cả thông báo đã được đọc" :
                                            activeTab === "read" ? "Chưa có thông báo nào được đọc" :
                                                "Bạn sẽ thấy thông báo mới ở đây"}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {filteredNotifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-6 rounded-xl border shadow-sm transition-all duration-200 ${!notification.isRead
                                                ? 'bg-gradient-to-r from-[#1447e6]/10 to-[#ad46ff]/10 dark:from-blue-950/30 dark:to-indigo-950/30 border-[#1447e6]/30 dark:border-indigo-900'
                                                : 'bg-card border-border hover:border-border/50'
                                                }`}
                                            onClick={async () => {
                                                if (!notification.isRead) await handleMarkAsRead(notification.id);
                                                const navUrl = (notification as any).relatedObject?.navigateUrl;
                                                if (navUrl) router.push(navUrl);
                                            }}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1">
                                                    <div className={`p-2 rounded-full ${!notification.isRead
                                                        ? 'bg-[#1447e6]/15 text-[#1447e6] dark:bg-indigo-900/40'
                                                        : 'bg-muted/50'
                                                        }`}>
                                                        {getNotificationIcon(notification.type)}
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="font-semibold">
                                                                {getNotificationTitle(notification.type)}
                                                            </h3>
                                                            {!notification.isRead && (
                                                                <Badge variant="secondary" className="text-xs bg-[#1447e6]/15 text-[#1447e6] border-[#1447e6]/20">
                                                                    Chưa đọc
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatDistanceToNow(new Date(notification.createdAt), {
                                                                addSuffix: true,
                                                                locale: vi
                                                            })}
                                                        </span>
                                                    </div>

                                                    <p className="text-muted-foreground mb-4 leading-relaxed">
                                                        {notification.contentPreview}
                                                    </p>

                                                    <div className="flex items-center gap-3">
                                                        {!notification.isRead && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleMarkAsRead(notification.id)}
                                                            >
                                                                <Check className="h-4 w-4 mr-2" />
                                                                Đánh dấu đã đọc
                                                            </Button>
                                                        )}



                                                        {/* Action buttons for group invitations */}
                                                        {(() => {
                                                            // Create a unique key for this notification based on content and timestamp
                                                            const notificationKey = `${notification.type}_${notification.contentPreview}_${notification.createdAt}`;
                                                            const shouldShowButtons = notification.type === 'GroupInvitation' && !respondedInvitations.has(notificationKey);

                                                            if (shouldShowButtons) {
                                                                return (
                                                                    <>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleAcceptInvitation(notification)}
                                                                            className="bg-green-600 hover:bg-green-700"
                                                                        >
                                                                            <Check className="h-4 w-4 mr-2" />
                                                                            Chấp nhận
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => handleRejectInvitation(notification)}
                                                                            className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/20"
                                                                        >
                                                                            <X className="h-4 w-4 mr-2" />
                                                                            Từ chối
                                                                        </Button>
                                                                    </>
                                                                );
                                                            }

                                                            const shouldShowBadge = notification.type === 'GroupInvitation' && respondedInvitations.has(notificationKey);
                                                            if (shouldShowBadge) {
                                                                return (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        <Check className="h-3 w-3 mr-1" />
                                                                        Đã phản hồi
                                                                    </Badge>
                                                                );
                                                            }

                                                            return null;
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {hasMore && (
                                        <div className="text-center pt-6">
                                            <Button
                                                variant="outline"
                                                onClick={() => loadNotifications(page + 1)}
                                            >
                                                Tải thêm thông báo
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
}
