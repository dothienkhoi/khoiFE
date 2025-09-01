"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRecentNotifications } from "@/lib/api-client";
import { NotificationItem } from "@/components/shared/NotificationItem";
import { DashboardLoadingSkeleton } from "@/components/features/dashboard/DashboardSkeletons";
import { ErrorDisplay } from "@/components/shared/ErrorDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Bell, RefreshCw } from "lucide-react";
import { AdminNotificationType } from "@/types/api.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/api-client";
import { toast } from "sonner";

// Notification type filter options
const notificationTypeOptions: { value: AdminNotificationType | "all"; label: string }[] = [
  { value: "all", label: "Tất cả loại" },
  { value: "NewUserRegistered", label: "Người dùng mới" },
  { value: "ContentReported", label: "Nội dung báo cáo" },
  { value: "NewGroupCreated", label: "Nhóm mới" },
  { value: "BackgroundJobFailed", label: "Lỗi hệ thống" },
  { value: "GeneralAnnouncement", label: "Thông báo chung" },
];

export default function AdminNotificationsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterType, setFilterType] = useState<AdminNotificationType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unread">("all");
  
  const queryClient = useQueryClient();

  // Fetch notifications with pagination and filters
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin-notifications", { page: currentPage, pageSize, statusFilter, typeFilter: filterType }],
    queryFn: async () => {
      const response = await getRecentNotifications(currentPage, pageSize, filterType, statusFilter);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch notifications");
      }
      return response.data;
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-dropdown"] });
    },
    onError: (error: any) => {
      toast.error("Không thể đánh dấu thông báo đã đọc", {
        description: error?.response?.data?.message || "Đã xảy ra lỗi không xác định",
      });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-dropdown"] });
      toast.success("Đã đánh dấu tất cả thông báo là đã đọc");
    },
    onError: (error: any) => {
      toast.error("Không thể đánh dấu tất cả thông báo", {
        description: error?.response?.data?.message || "Đã xảy ra lỗi không xác định",
      });
    },
  });

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Calculate unread count from the current data
  const unreadCount = data?.items?.filter(n => !n.isRead).length || 0;
  const hasUnreadNotifications = unreadCount > 0;

  // Generate pagination items
  const generatePaginationItems = () => {
    if (!data || data.totalPages <= 1) return [];

    const items = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(data.totalPages, startPage + maxVisiblePages - 1);

    // Add first page if not visible
    if (startPage > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(1); }}>
            1
          </PaginationLink>
        </PaginationItem>
      );
      
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            href="#" 
            onClick={(e) => { e.preventDefault(); setCurrentPage(i); }}
            isActive={i === currentPage}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Add last page if not visible
    if (endPage < data.totalPages) {
      if (endPage < data.totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      items.push(
        <PaginationItem key={data.totalPages}>
          <PaginationLink 
            href="#" 
            onClick={(e) => { e.preventDefault(); setCurrentPage(data.totalPages); }}
          >
            {data.totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="flex-1 space-y-6">
      {/* 5. Statistics Cards (Now below the main list) */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng thông báo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalRecords || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chưa đọc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trang hiện tại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.pageNumber || currentPage}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng trang</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalPages || 0}</div>
          </CardContent>
        </Card>
      </div>
      {/* 1. Main Page Header (Title + Refresh Button) */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Thông báo quản trị</h1>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* 2. Filter Bar (Tabs + Select Dropdown) */}
      <div className="flex items-center gap-4">
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "unread")}>
          <TabsList>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              Chưa đọc
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Select value={filterType} onValueChange={(value) => setFilterType(value as AdminNotificationType | "all")}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {notificationTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* 3. Notifications List Card */}
      <Card>
        <CardContent className="pt-6">
          {isLoading && <DashboardLoadingSkeleton />}

          {error && (
            <ErrorDisplay 
              error={error as Error} 
              retry={() => refetch()}
              title="Không thể tải danh sách thông báo"
            />
          )}

          {data && data.items.length === 0 && (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Không có thông báo nào
              </h3>
              <p className="text-sm text-muted-foreground">
                {filterType !== "all" || statusFilter === "unread" 
                  ? "Không có thông báo nào phù hợp với bộ lọc hiện tại"
                  : "Bạn chưa có thông báo nào"
                }
              </p>
            </div>
          )}

          {data && data.items.length > 0 && (
            <div className="space-y-2">
              {data.items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Pagination for the list */}
      {data && data.totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Trang {data.pageNumber} của {data.totalPages} • 
                Hiển thị {((data.pageNumber - 1) * data.pageSize) + 1} đến {Math.min(data.pageNumber * data.pageSize, data.totalRecords)} 
                trong tổng số {data.totalRecords} thông báo
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        setCurrentPage(Math.max(1, data.pageNumber - 1)); 
                      }}
                      className={data.pageNumber === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {generatePaginationItems()}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        setCurrentPage(Math.min(data.totalPages, data.pageNumber + 1)); 
                      }}
                      className={data.pageNumber >= data.totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      )}

      

      {/* 6. Other Controls and Settings */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Số lượng/trang:</label>
            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button
          onClick={handleMarkAllAsRead}
          disabled={!hasUnreadNotifications || markAllAsReadMutation.isPending}
        >
          Đánh dấu tất cả đã đọc
        </Button>
      </div>
    </div>
  );
}
