"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Video,
    Search,
    Info,
    Users,
    Phone,
    PhoneOff
} from "lucide-react";
import { ChatGroup } from "@/types/customer.types";
import { cn } from "@/lib/utils";

interface GroupChatHeaderProps {
    group: ChatGroup;
    onVideoCall?: () => void;
    onSearchMessages?: () => void;
    onShowGroupInfo?: () => void;
    isVideoCallActive?: boolean;
}

export function GroupChatHeader({
    group,
    onVideoCall,
    onSearchMessages,
    onShowGroupInfo,
    isVideoCallActive = false
}: GroupChatHeaderProps) {
    const [isHovered, setIsHovered] = useState(false);

    // Lấy tên nhóm từ các field có thể có
    const groupName = group.name || group.groupName || "Nhóm không tên";

    // Lấy avatar nhóm
    const groupAvatar = group.avatarUrl || group.groupAvatarUrl;

    // Tạo initials từ tên nhóm
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div
            className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-center justify-between">
                {/* Thông tin nhóm bên trái */}
                <div className="flex items-center gap-4">
                    {/* Avatar nhóm */}
                    <Avatar className="h-12 w-12 ring-2 ring-gray-200 dark:ring-gray-700">
                        <AvatarImage src={groupAvatar} />
                        <AvatarFallback className="bg-gradient-to-r from-[#1447e6] to-[#ad46ff] text-white font-bold text-lg">
                            {getInitials(groupName)}
                        </AvatarFallback>
                    </Avatar>

                    {/* Tên và mô tả nhóm */}
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                            {groupName}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                            <span>Trò chuyện nhóm</span>
                            {group.memberCount > 0 && (
                                <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>{group.memberCount} thành viên</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Các icon chức năng bên phải */}
                <div className="flex items-center gap-2">
                    {/* Video call button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onVideoCall}
                        disabled={!onVideoCall}
                        className={cn(
                            "h-10 w-10 p-0 rounded-full transition-all duration-200",
                            isVideoCallActive
                                ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800",
                            !onVideoCall && "opacity-50 cursor-not-allowed"
                        )}
                        title={isVideoCallActive ? "Kết thúc cuộc gọi" : "Bắt đầu cuộc gọi video"}
                    >
                        {isVideoCallActive ? (
                            <PhoneOff className="h-5 w-5" />
                        ) : (
                            <Video className="h-5 w-5" />
                        )}
                    </Button>

                    {/* Tìm kiếm tin nhắn button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onSearchMessages}
                        disabled={!onSearchMessages}
                        className={cn(
                            "h-10 w-10 p-0 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800",
                            !onSearchMessages && "opacity-50 cursor-not-allowed"
                        )}
                        title="Tìm kiếm tin nhắn"
                    >
                        <Search className="h-5 w-5" />
                    </Button>

                    {/* Thông tin chi tiết nhóm button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onShowGroupInfo}
                        disabled={!onShowGroupInfo}
                        className={cn(
                            "h-10 w-10 p-0 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800",
                            !onShowGroupInfo && "opacity-50 cursor-not-allowed"
                        )}
                        title="Thông tin chi tiết nhóm"
                    >
                        <Info className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
