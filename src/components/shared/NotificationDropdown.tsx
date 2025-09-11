// components/shared/NotificationDropdown.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Check,
  MessageCircle,
  Users,
  UserPlus,
  AtSign,
  Settings,
  Heart,
  MessageSquare,
  MoreHorizontal,
  RefreshCw
} from "lucide-react";
import { useCustomerStore } from "@/store/customerStore";
import { CustomerNotification, GroupInvitation } from "@/types/customer.types";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, getPendingInvitations, respondToInvitation } from "@/lib/customer-api-client";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function NotificationDropdown({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const router = useRouter();
  const { notifications, setNotifications, addNotification, unreadCount, setUnreadCount } = useCustomerStore();
  const store = useCustomerStore.getState();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);

  // SignalR handlers for notifications hub
  useEffect(() => {
    const handleUnreadUpdate = (count: number) => {
      setUnreadCount(count);
    };
    // Attach global handler if SignalR provider dispatches events
    const onSignal = (e: any) => handleUnreadUpdate(e.detail?.count ?? 0);
    window.addEventListener('notifications:unread', onSignal as EventListener);
    return () => window.removeEventListener('notifications:unread', onSignal as EventListener);
  }, [setUnreadCount]);

  // Load notifications and invitations when dropdown opens
  useEffect(() => {
    if (isOpen) {
      if (notifications.length === 0) {
        loadNotifications();
      }
      loadInvitations();
    } else {
      // đảm bảo tắt spinner khi đóng dropdown
      setIsLoading(false);
      setIsLoadingInvitations(false);
    }
  }, [isOpen]);

  // Listen for refresh notifications event (fallback when SignalR fails)
  useEffect(() => {
    const handleRefreshNotifications = () => {
      loadNotifications();
    };

    window.addEventListener('refreshNotifications', handleRefreshNotifications);
    return () => {
      window.removeEventListener('refreshNotifications', handleRefreshNotifications);
    };
  }, []);

  const loadNotifications = async (pageNumber: number = 1) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // safety timer: tránh spinner quay vô hạn nếu request kẹt
      const safety = setTimeout(() => setIsLoading(false), 12000);
      // Load only 5 notifications for dropdown
      const response = await getNotifications(pageNumber, 5);
      clearTimeout(safety);

      if (response.success) {
        if (pageNumber === 1) {
          setNotifications(response.data.items);
        } else {
          const currentNotifications = store.notifications;
          setNotifications([...currentNotifications, ...response.data.items]);
        }

        setHasMore(response.data.pageNumber < response.data.totalPages);
        setPage(response.data.pageNumber);
      } else {
        // Handle API error response - silent for dropdown
        if (pageNumber === 1) {
          setNotifications([]);
        }
      }
    } catch (error) {
      // Silent error handling for dropdown
      if (pageNumber === 1) {
        setNotifications([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadInvitations = async () => {
    if (isLoadingInvitations) return;

    setIsLoadingInvitations(true);
    try {
      const response = await getPendingInvitations();
      if (response.success) {
        setInvitations(response.data);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  const handleInvitationResponse = async (invitationId: number, accept: boolean) => {
    try {
      const response = await respondToInvitation(invitationId, accept);
      if (response.success) {
        // Remove invitation from list
        setInvitations(prev => prev.filter(inv => inv.invitationId !== invitationId));
        // Show success message
        // You can add toast notification here if needed
        if (accept) {
          // Điều hướng sang trang nhóm sau khi chấp nhận
          // Nếu API không trả conversationId, chuyển sang trang nhóm chung để sidebar tự refresh
          router.push('/groups');
        }
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
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
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      // Update local state
      setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: CustomerNotification['type']) => {
    switch (type) {
      case 'NewMessage':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'GroupInvitation':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'FriendRequest':
        return <UserPlus className="h-4 w-4 text-purple-500" />;
      case 'Mention':
        return <AtSign className="h-4 w-4 text-orange-500" />;
      case 'System':
        return <Settings className="h-4 w-4 text-gray-500" />;
      case 'PostLike':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'PostComment':
        return <MessageSquare className="h-4 w-4 text-indigo-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationTitle = (type: CustomerNotification['type']) => {
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

  // Use unreadCount from store (updated by SignalR) or calculate from notifications
  const displayUnreadCount = unreadCount > 0 ? unreadCount : notifications.filter(n => !n.isRead).length + invitations.length;

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) { setIsLoading(false); setIsLoadingInvitations(false); } }}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={`relative ${size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'} rounded-lg bg-transparent hover:bg-[#1447e6]/20`}>
            <Bell className="h-5 w-5 text-[#1447e6]" />
            {displayUnreadCount > 0 && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border border-white dark:border-gray-900" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between p-4 border-b">
            <span className="font-semibold">Thông báo</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadNotifications()}
                className="h-auto p-1 text-xs"
                disabled={isLoading}
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              {displayUnreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="h-auto p-1 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Đánh dấu tất cả
                </Button>
              )}
            </div>
          </div>
          <DropdownMenuSeparator />

          <div className="max-h-64 overflow-hidden">
            {notifications.length === 0 && !isLoading ? (
              <div className="p-6 text-center text-muted-foreground">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                  <Bell className="h-6 w-6 opacity-50" />
                </div>
                <p className="text-sm">Không có thông báo nào</p>
                <p className="text-xs text-muted-foreground mt-1">Hoặc không thể tải thông báo</p>
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-0">
                  {notifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/50 cursor-pointer transition-all duration-200 ${!notification.isRead ? 'bg-gradient-to-r from-blue-50/30 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/20' : ''
                        } ${index === 0 ? 'rounded-t-lg' : ''} ${index === notifications.length - 1 ? 'rounded-b-lg' : ''}`}
                      onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                      style={{
                        animationDelay: `${index * 30}ms`,
                        animation: 'fadeInUp 0.3s ease-out forwards'
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <div className={`p-1.5 rounded-full ${!notification.isRead ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-muted/50'
                            }`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold">
                                {getNotificationTitle(notification.type)}
                              </p>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: vi
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {notification.contentPreview}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="p-4 space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Invitations Section */}
          {invitations.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Lời mời tham gia nhóm</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadInvitations()}
                    className="h-auto p-1 text-xs"
                    disabled={isLoadingInvitations}
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoadingInvitations ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {invitations.map((invitation) => (
                    <div key={invitation.invitationId} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                          {invitation.groupName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{invitation.groupName}</p>
                          <p className="text-xs text-muted-foreground">Mời bởi {invitation.invitedByName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInvitationResponse(invitation.invitationId, true)}
                          className="h-7 px-2 text-xs"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Chấp nhận
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInvitationResponse(invitation.invitationId, false)}
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Xem tất cả button - luôn hiển thị */}
          <div className="p-3 border-t border-border/50 bg-muted/20">
            <Link href="/notifications" onClick={() => setIsOpen(false)}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full hover:bg-muted/50 transition-colors font-medium"
              >
                Xem tất cả thông báo
              </Button>
            </Link>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <style jsx>{`
         @keyframes fadeInUp {
           from {
             opacity: 0;
             transform: translateY(10px);
           }
           to {
             opacity: 1;
             transform: translateY(0);
           }
         }
       `}</style>
    </>
  );
}
