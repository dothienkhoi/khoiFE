// layout/customer/CustomerSidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Search,
    Plus,
    Users,
    MessageCircle,
    Compass,
    FileText,
    User,
    Settings,
    Bell,
    MoreHorizontal,
    RotateCcw,
    X
} from "lucide-react";
import { useCustomerStore } from "@/store/customerStore";
import { Contact, CustomerNavItem, Conversation } from "@/types/customer.types";
import { cn } from "@/lib/utils";
import { UserSearchPopup } from "@/components/providers/UserSearchPopup";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { UserNav } from "@/components/shared/UserNav";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";

interface CustomerSidebarProps {
    isCollapsed?: boolean;
}

export function CustomerSidebar({ isCollapsed = false }: CustomerSidebarProps) {
    const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    // Get current active nav item based on pathname
    const getCurrentNavItem = (path: string) => {
        if (path.includes('/chat')) return 'chats';
        if (path.includes('/groups')) return 'groups';
        if (path.includes('/communities')) return 'communities';
        if (path.includes('/notifications')) return 'notifications';
        if (path.includes('/profile')) return 'profile';
        return 'chats'; // default
    };

    const currentNavItem = getCurrentNavItem(pathname);

    // Listen for openUserSearch event
    useEffect(() => {
        const handleOpenUserSearch = () => {
            setIsUserSearchOpen(true);
        };

        window.addEventListener('openUserSearch', handleOpenUserSearch);
        return () => {
            window.removeEventListener('openUserSearch', handleOpenUserSearch);
        };
    }, []);

    const {
        activeChatId,
        activeChatType,
        activeNavItem,
        setActiveChat,
        clearActiveChat,
        setActiveNavItem
    } = useCustomerStore();

    // Chỉ hiển thị sidebar thu gọn
    return (
        <TooltipProvider>
            <div className="fixed left-0 top-0 flex flex-col h-screen bg-white dark:bg-gray-800 w-24 overflow-hidden z-50" data-sidebar>
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-[#ad46ff]/10 to-[#1447e6]/10">
                    <div className="flex flex-col items-center">
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div className="w-12 h-12 bg-gradient-to-r from-[#ad46ff] to-[#1447e6] rounded-2xl flex items-center justify-center shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300">
                                    <span className="text-white font-bold text-lg">FB</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">FastBite Group</TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                <ScrollArea className="flex-1 scrollbar-hide">
                    <div className="p-2 space-y-3">
                        {/* Navigation Items */}
                        {[
                            { id: 'chats', icon: MessageCircle, label: 'Cá nhân', path: '/chat' },
                            { id: 'groups', icon: Users, label: 'Nhóm', path: '/groups' },
                            { id: 'communities', icon: Compass, label: 'Cộng đồng', path: '/communities' },
                            { id: 'profile', icon: User, label: 'Hồ sơ', path: '/profile' }
                        ].map((item) => (
                            <Tooltip key={item.id} delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "relative w-full h-14 rounded-xl transition-all duration-300",
                                            currentNavItem === item.id
                                                ? "bg-[#ad46ff] text-white shadow-lg"
                                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                        )}
                                        onClick={() => router.push(item.path)}
                                    >
                                        <item.icon className="h-6 w-6" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">{item.label}</TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </ScrollArea>

                {/* Bottom Controls */}
                <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
                    <div className="flex flex-col items-center gap-2">
                        {/* Theme Toggle */}
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#ad46ff]/10 to-[#1447e6]/10 hover:from-[#ad46ff]/20 hover:to-[#1447e6]/20 transition-all duration-300 hover:scale-105 shadow-sm flex items-center justify-center">
                                    <ThemeToggle />
                                </div>
                            </TooltipTrigger>
                        </Tooltip>

                        {/* Notification Bell (dropdown) */}
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div className="h-8 w-8 flex items-center justify-center">
                                    <NotificationDropdown size="sm" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">Thông báo</TooltipContent>
                        </Tooltip>

                        {/* User Navigation */}
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#ad46ff]/10 to-[#1447e6]/10 hover:from-[#ad46ff]/20 hover:to-[#1447e6]/20 transition-all duration-300 hover:scale-105 shadow-sm flex items-center justify-center">
                                    <UserNav />
                                </div>
                            </TooltipTrigger>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
