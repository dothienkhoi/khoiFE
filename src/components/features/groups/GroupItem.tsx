"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Globe, Lock, Users } from "lucide-react";
import { MessagePreview } from "../chat/MessagePreview";

interface Group {
    groupId: string;
    groupName: string;
    description: string;
    avatarUrl?: string | null;
    lastMessagePreview?: string;
    lastMessageTimestamp?: string;
    lastMessageType?: string;
    unreadCount?: number;
    groupType?: "Public" | "Private" | "Community";
    memberCount?: number;
}

interface GroupItemProps {
    group: Group;
    isSelected?: boolean;
    onClick?: () => void;
}

// Helper function to truncate text to 4 words
const truncateToWords = (text: string, maxWords: number = 4): string => {
    if (!text) return "";
    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(" ") + "...";
};

// Generate default description based on group type
const getDefaultDescription = (groupType?: string, groupName?: string): string => {
    const name = groupName || "Nhóm";

    switch (groupType) {
        case "Private":
            return `Chia sẻ thông tin nội bộ và trò chuyện an toàn`;
        case "Public":
            return `Kết nối và chia sẻ với cộng đồng rộng lớn`;
        case "Community":
            return `Nơi giao lưu và học hỏi từ nhiều thành viên`;
        default:
            return `Nơi chia sẻ ý tưởng và kết nối với bạn bè`;
    }
};

// Get group type display info
const getGroupTypeInfo = (groupType?: string) => {
    switch (groupType) {
        case "Private":
            return {
                label: "Riêng tư",
                icon: Lock,
                color: "bg-[#ad46ff]",
                textColor: "text-[#ad46ff]",
                bgColor: "bg-[#ad46ff]/10"
            };
        case "Public":
        default:
            return {
                label: "Công khai",
                icon: Globe,
                color: "bg-[#1447e6]",
                textColor: "text-[#1447e6]",
                bgColor: "bg-[#1447e6]/10"
            };
    }
};

export function GroupItem({ group, isSelected = false, onClick }: GroupItemProps) {
    const groupTypeInfo = getGroupTypeInfo(group.groupType);
    const TypeIcon = groupTypeInfo.icon;
    const truncatedName = truncateToWords(group.groupName, 4);

    return (
        <div
            className={cn(
                "group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700",
                isSelected && "bg-[#ad46ff]/10 border-[#ad46ff]/20 shadow-sm"
            )}
            onClick={onClick}
        >
            {/* Avatar */}
            <div className="flex-shrink-0">
                <Avatar className="h-10 w-10 ring-2 ring-gray-200 dark:ring-gray-700">
                    <AvatarImage src={group?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white font-semibold text-sm">
                        {group?.groupName?.charAt(0).toUpperCase() || "G"}
                    </AvatarFallback>
                </Avatar>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-1">
                    {/* Group Name */}
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate flex-1 mr-2">
                        {truncatedName}
                    </h3>

                    {/* Right side badges */}
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {/* Privacy Badge - Only show if groupType is available */}
                        {group.groupType && (
                            <Badge
                                variant="secondary"
                                className={cn(
                                    "text-xs px-2 py-0.5 rounded-full font-medium flex items-center justify-center gap-1 h-5 min-w-fit leading-none",
                                    groupTypeInfo.bgColor,
                                    groupTypeInfo.textColor
                                )}
                            >
                                <TypeIcon className="w-3 h-3 flex-shrink-0" />
                                <span className="whitespace-nowrap text-xs leading-none">{groupTypeInfo.label}</span>
                            </Badge>
                        )}

                        {/* Member Count */}
                        {group?.memberCount !== undefined && (
                            <Badge
                                variant="secondary"
                                className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1 h-5 min-w-fit leading-none"
                            >
                                <Users className="w-3 h-3 flex-shrink-0" />
                                <span className="whitespace-nowrap text-xs leading-none">{group.memberCount}</span>
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Group Description and Unread Count */}
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        {group.lastMessagePreview ? (
                            <MessagePreview
                                messageType={group.lastMessageType || 'Text'}
                                content={group.lastMessagePreview}
                                className="text-xs text-gray-500 dark:text-gray-400"
                            />
                        ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {group?.description || getDefaultDescription(group.groupType, group.groupName)}
                            </p>
                        )}
                    </div>
                    {group.unreadCount && group.unreadCount > 0 && (
                        <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0 ml-2" />
                    )}
                </div>
            </div>
        </div>
    );
}
