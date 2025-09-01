// components/features/dashboard/DashboardSkeletons.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Loading skeleton for the stats cards
export function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[80px] mb-2" />
        <Skeleton className="h-3 w-[140px]" />
      </CardContent>
    </Card>
  );
}

// Loading skeleton for the chart
export function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-[200px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}

// Loading skeleton for recent activity lists
export function RecentActivitySkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-[120px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center space-x-4">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-3 w-[80px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Combined loading state for the entire dashboard
export function DashboardLoadingSkeleton() {
  return (
    <>
      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      {/* Chart Skeleton */}
      <ChartSkeleton />

      {/* Recent Activity Skeleton */}
      <RecentActivitySkeleton />
    </>
  );
}
