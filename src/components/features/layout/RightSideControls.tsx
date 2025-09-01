// components/layout/RightSideControls.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";
import { UserNav } from "@/components/shared/UserNav";

interface RightSideControlsProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

export function RightSideControls({ isSidebarOpen, toggleSidebar }: RightSideControlsProps) {
    return (
        <div className="flex items-center justify-between w-full gap-8">
            {/* --- Left Side Controls --- */}
            <div className="flex items-center gap-3">
                {/* 6 Con gà quay sang phải */}
                <div className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform duration-300">
                    {/* 5 con gà con */}
                    <div className="flex items-center gap-1">
                        <span className="text-sm bg-gradient-to-r from-[#ad46ff] to-[#1447e6] bg-clip-text text-transparent transform rotate-12">🐤</span>
                        <span className="text-sm bg-gradient-to-r from-[#ad46ff] to-[#1447e6] bg-clip-text text-transparent transform rotate-12">🐤</span>
                        <span className="text-sm bg-gradient-to-r from-[#ad46ff] to-[#1447e6] bg-clip-text text-transparent transform rotate-12">🐤</span>
                        <span className="text-sm bg-gradient-to-r from-[#ad46ff] to-[#1447e6] bg-clip-text text-transparent transform rotate-12">🐤</span>
                        <span className="text-sm bg-gradient-to-r from-[#ad46ff] to-[#1447e6] bg-clip-text text-transparent transform rotate-12">🐤</span>
                    </div>

                    {/* Con gà to ở bên phải */}
                    <div className="w-8 h-8 flex items-center justify-center animate-bounce">
                        <span className="text-lg bg-gradient-to-r from-[#ad46ff] to-[#1447e6] bg-clip-text text-transparent transform rotate-12">🐓</span>
                    </div>
                </div>
            </div>

            {/* --- Right Side Controls --- */}
            <div className="flex items-center gap-3">
                {/* User Navigation */}
                <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-[#ad46ff]/10 to-[#1447e6]/10 hover:from-[#ad46ff]/20 hover:to-[#1447e6]/20 transition-all duration-300 hover:scale-105 shadow-sm">
                    <UserNav />
                </div>
            </div>
        </div>
    );
}
