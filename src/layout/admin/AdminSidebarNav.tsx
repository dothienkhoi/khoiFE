// components/layout/admin/AdminSidebarNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Home, Users, Package } from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Home },
  { href: "/admin/users", label: "Quản lý Người dùng", icon: Users },
  { href: "/admin/groups", label: "Quản lý Nhóm", icon: Package },
];

// Component giờ chỉ cần prop isCollapsed
interface AdminSidebarNavProps {
  isCollapsed: boolean;
}

export function AdminSidebarNav({ isCollapsed }: AdminSidebarNavProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start gap-1 px-2 text-sm font-medium lg:px-4">
          {navItems.map((item) =>
            isCollapsed ? (
              <Tooltip key={item.label} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary md:h-8 md:w-8",
                      pathname === item.href &&
                        "bg-accent text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  pathname === item.href && "bg-muted text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          )}
        </nav>
      </div>
    </TooltipProvider>
  );
}
