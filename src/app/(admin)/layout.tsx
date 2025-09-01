// app/(admin)/layout.tsx
"use client";
import Link from "next/link";
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

import { AdminSidebarNav } from "@/layout/admin/AdminSidebarNav";
import { UserNav } from "@/components/shared/UserNav";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";
import { SignalRProvider } from "@/components/providers/SignalRProvider";
import { PushNotificationProvider } from "@/components/providers/PushNotificationProvider";
import { useUiStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSidebarCollapsed, toggleSidebar } = useUiStore();
  return (
    <PushNotificationProvider>
      <SignalRProvider>
        <div
          className={cn(
            "grid min-h-screen w-full transition-[grid-template-columns] duration-300 ease-in-out",
            isSidebarCollapsed ? "md:grid-cols-[70px_1fr]" : "md:grid-cols-[280px_1fr]"
          )}
        >
          {/* --- Sidebar cho Desktop --- */}
          <aside className="hidden border-r bg-muted/40 md:block">
            <div className="flex h-full max-h-screen flex-col">
              <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link
                  href="/"
                  className={cn(
                    "flex items-center gap-2 font-semibold transition-all duration-300",
                    isSidebarCollapsed && "justify-center"
                  )}
                >
                  <MessageCircle className="h-6 w-6 text-purple-600 shrink-0" />
                  <span
                    className={cn(
                      "transition-opacity",
                      isSidebarCollapsed ? "opacity-0 w-0" : "opacity-100"
                    )}
                  >
                    FastBite Group
                  </span>
                </Link>
              </div>
              {/* Pass collapsed state to sidebar navigation */}
              <AdminSidebarNav isCollapsed={isSidebarCollapsed} />
            </div>
          </aside>

          {/* --- Header và Content --- */}
          <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
              {/* --- Sidebar cho Mobile (dùng Sheet) --- */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 md:hidden"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0">
                  <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link
                      href="/"
                      className="flex items-center gap-2 font-semibold"
                    >
                      <MessageCircle className="h-6 w-6 text-purple-600" />
                      <span>TeamChat Admin</span>
                    </Link>
                  </div>
                  <div className="overflow-auto py-2">
                    <AdminSidebarNav isCollapsed={isSidebarCollapsed} />
                  </div>
                </SheetContent>
              </Sheet>
              <Button
                onClick={toggleSidebar}
                size="icon"
                variant="outline"
                className="h-8 w-8 hidden md:flex" // Only show on desktop
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle Sidebar</span>
              </Button>

              {/* --- Nội dung Header --- */}
              <div className="w-full flex-1">
                <form>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search..."
                      className="w-full appearance-none bg-muted pl-8 shadow-none md:w-2/3 lg:w-1/3"
                    />
                  </div>
                </form>
              </div>
              <ThemeToggle />
              {/* Notification Dropdown */}
              <NotificationDropdown />
              <UserNav />
            </header>

            {/* --- Nội dung trang --- */}
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
              {children}
            </main>
          </div>
        </div>
      </SignalRProvider>
    </PushNotificationProvider>
  );
}
