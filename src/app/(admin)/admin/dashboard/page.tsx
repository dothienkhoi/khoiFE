"use client";

import { getDashboardSummary } from "@/lib/api-client";
import { UserGrowthChart } from "@/components/features/dashboard/UserGrowthChart";
import { RecentActivityLists } from "@/components/features/dashboard/RecentActivityLists";
import { StatsCard } from "@/components/features/dashboard/StatsCard";
import { DashboardLoadingSkeleton } from "@/components/features/dashboard/DashboardSkeletons";
import { ErrorDisplay } from "@/components/shared/ErrorDisplay";
import {
  Users,
  UserPlus,
  MessageCircle,
  FileText,
  Bell,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  // Note: Authentication and admin role checks are handled by middleware.ts
  // No need for client-side redirects as middleware already protects this route

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const response = await getDashboardSummary();
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch dashboard data");
      }
      return response.data;
    },
    retry: 2,
    retryDelay: 1000,
    // Only run query if user is authenticated and has admin role
    enabled: isAuthenticated && user?.roles?.includes("Admin"),
  });

  // Middleware ensures only authenticated Admin users reach this page

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {isLoading && <DashboardLoadingSkeleton />}

      {error && (
        <ErrorDisplay
          error={error as Error}
          retry={() => refetch()}
          title="Không thể tải dữ liệu dashboard"
          subtitle="Vui lòng đảm bảo bạn đã đăng nhập với tài khoản admin"
        />
      )}

      {data && (
        <>
          {/* Key Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Tổng người dùng"
              value={data.keyStats.totalUsers}
              icon={Users}
            />
            <StatsCard
              title="Người dùng mới (7 ngày)"
              value={data.keyStats.newUsersLast7Days}
              description="So với tuần trước"
              icon={UserPlus}
            />
            <StatsCard
              title="Tổng nhóm"
              value={data.keyStats.totalGroups}
              icon={MessageCircle}
            />
            <StatsCard
              title="Tổng bài viết"
              value={data.keyStats.totalPosts}
              icon={FileText}
            />
          </div>

          {/* User Growth Chart */}
          <UserGrowthChart data={data.userGrowthChartData} />

          {/* Recent Activity Lists */}
          <RecentActivityLists
            recentUsers={data.recentUsers}
            recentGroups={data.recentGroups}
          />

          {/* Technical Debug Information */}
          <Collapsible open={isDebugOpen} onOpenChange={setIsDebugOpen}>
            <Card>
              <CardHeader>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <CardTitle className="text-sm font-medium">Thông tin Gỡ lỗi Kỹ thuật</CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {isDebugOpen ? "Ẩn" : "Hiện"}
                    </span>
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  {/* SignalRDebugInfo component was removed */}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </>
      )}
    </div>
  );
}
