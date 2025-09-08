"use client";

import { useEffect, useState } from "react";
import { useCustomerStore } from "@/store/customerStore";
import { GroupChatInterface } from "@/components/features/groups/GroupChatInterface";
import { GroupSidebar } from "@/components/features/groups/GroupSidebar";

interface Group {
    groupId: string;
    groupName: string;
    description: string;
    avatarUrl?: string | null;
    groupType?: "Public" | "Private" | "Community";
    memberCount?: number;
    conversationId?: number; // Add conversationId for API calls
}

export default function GroupsPage() {
    const {
        setActiveNavItem
    } = useCustomerStore();

    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    useEffect(() => {
        setActiveNavItem('groups');
    }, [setActiveNavItem]);

    // Handle group selection
    const handleGroupSelect = (group: Group) => {
        setSelectedGroup(group);
    };

    const handleBackToExplore = () => {
        // Clear current selection so user can click the same conversation again later
        setSelectedGroup(null);
    };

    return (
        <div className="flex h-full chat-page-layout">
            {/* Cột trái: Danh sách trò chuyện nhóm */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                <GroupSidebar
                    onGroupSelect={handleGroupSelect}
                    selectedGroupId={selectedGroup?.groupId}
                />
            </div>

            {/* Cột phải: Khung chat chính */}
            <div className="flex-1">
                <GroupChatInterface
                    groupId={selectedGroup?.groupId}
                    conversationId={selectedGroup?.conversationId}
                    groupName={selectedGroup?.groupName}
                    groupAvatar={selectedGroup?.avatarUrl || undefined}
                    groupType={selectedGroup?.groupType}
                    description={selectedGroup?.description}
                    onBackToExplore={handleBackToExplore}
                />
            </div>
        </div>
    );
}
