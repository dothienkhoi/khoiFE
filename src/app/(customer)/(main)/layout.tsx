"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Menu,
  Search,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import { CustomerSignalRProvider } from "@/components/providers/CustomerSignalRProvider";
import { VideoCallHubProvider } from "@/components/providers/VideoCallHubProvider";
import { CustomerSidebar } from "@/layout/customer/CustomerSidebar";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { UserNav } from "@/components/shared/UserNav";
import { useCustomerStore } from "@/store/customerStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { cleanupUnnecessaryStorage } from "@/lib/utils/cleanupStorage";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSidebarOpen, toggleSidebar, activeChatId, activeChatType } = useCustomerStore();

  // Clean up unnecessary storage on component mount
  React.useEffect(() => {
    cleanupUnnecessaryStorage();
  }, []);
  const { user, isAuthenticated } = useAuthStore();
  const pathname = usePathname();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <div>Please log in to access the chat</div>;
  }

  return (
    <CustomerSignalRProvider>
      <VideoCallHubProvider>
        <div className="flex w-full bg-white dark:bg-gray-900">
          {/* --- Sidebar cho Desktop --- */}
          <aside className="hidden md:block">
            <CustomerSidebar isCollapsed={!isSidebarOpen} />
          </aside>

          {/* --- Main Content Area --- */}
          <div className="flex flex-col flex-1 min-h-screen">
            {/* --- Main Content --- */}
            <main className="flex flex-1 flex-col bg-gray-50 dark:bg-gray-800">
              {children}
            </main>
          </div>
        </div>
      </VideoCallHubProvider>
    </CustomerSignalRProvider>
  );
}
