"use client";

import { useState, useEffect } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserGrowthDataPoint } from "@/types/api.types";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { TrendingUp, Users } from "lucide-react";

interface UserGrowthChartProps {
  data: UserGrowthDataPoint[];
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark mode is enabled
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    };

    checkDarkMode();

    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Dynamic colors based on theme
  const colors = {
    stroke: isDark ? "#22d3ee" : "#8b5cf6", // cyan-400 : purple-600
    fill: isDark ? "url(#colorGradientDark)" : "url(#colorGradient)",
    dot: isDark ? "#22d3ee" : "#8b5cf6",
  };

  // Transform data to include formatted dates for display
  const chartData = data.map((item) => ({
    ...item,
    formattedDate: format(parseISO(item.date), "dd/MM", { locale: vi }),
    fullDate: format(parseISO(item.date), "dd MMMM yyyy", { locale: vi }),
  }));

  // Calculate total new users and trend
  const totalNewUsers = chartData.reduce(
    (sum, item) => sum + item.newUserCount,
    0
  );
  const averageDaily = Math.round(totalNewUsers / chartData.length);

  // Custom tooltip component
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: any[];
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card/95 backdrop-blur border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-card-foreground mb-1">
            {data.fullDate}
          </p>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors.dot }}
            ></div>
            <span className="text-sm text-muted-foreground">
              Người dùng mới:
            </span>
            <span
              className="text-sm font-semibold"
              style={{ color: colors.stroke }}
            >
              {payload[0].value} người
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="h-5 w-5" style={{ color: colors.stroke }} />
            Tăng trưởng người dùng (30 ngày qua)
          </CardTitle>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Tổng: {totalNewUsers.toLocaleString()} người dùng mới</span>
            </div>
            <div>
              <span>Trung bình: {averageDaily} người/ngày</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#8b5cf6"
                    stopOpacity={0.3}
                    className="dark:[stop-color:#06b6d4]"
                  />
                  <stop
                    offset="95%"
                    stopColor="#8b5cf6"
                    stopOpacity={0.05}
                    className="dark:[stop-color:#06b6d4]"
                  />
                </linearGradient>
                <linearGradient
                  id="colorGradientDark"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="formattedDate"
                tick={{
                  fontSize: 12,
                  fill: isDark ? "#ffffff" : "hsl(var(--muted-foreground))",
                }}
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{
                  fontSize: 12,
                  fill: isDark ? "#ffffff" : "hsl(var(--muted-foreground))",
                }}
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                domain={["dataMin - 1", "dataMax + 2"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="newUserCount"
                stroke={colors.stroke}
                strokeWidth={3}
                fill={colors.fill}
                dot={{
                  fill: colors.dot,
                  strokeWidth: 2,
                  r: 4,
                  stroke: "hsl(var(--background))",
                }}
                activeDot={{
                  r: 6,
                  fill: colors.dot,
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2,
                  filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Legend */}
        <div className="flex items-center justify-center mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors.dot }}
              ></div>
              <span className="text-muted-foreground">
                Số người dùng đăng ký mới mỗi ngày
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
