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
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        setActiveNavItem('groups');
    }, [setActiveNavItem]);

    // Listen for group info updates to update selectedGroup state
    useEffect(() => {
        const handleGroupInfoUpdated = (event: CustomEvent) => {
            const { groupId, groupName, description, avatarUrl } = event.detail || {};
            if (!groupId || !selectedGroup || selectedGroup.groupId !== groupId) return;

            setSelectedGroup(prev => prev ? {
                ...prev,
                groupName: groupName ?? prev.groupName,
                description: description ?? prev.description,
                avatarUrl: avatarUrl ?? prev.avatarUrl
            } : null);
        };

        window.addEventListener('groupInfoUpdated', handleGroupInfoUpdated as EventListener);
        return () => window.removeEventListener('groupInfoUpdated', handleGroupInfoUpdated as EventListener);
    }, [selectedGroup]);

    // Handle group selection
    const handleGroupSelect = (group: Group) => {
        setSelectedGroup(group);
    };

    const handleBackToExplore = () => {
        // Clear current selection so user can click the same conversation again later
        setSelectedGroup(null);
        // Trigger refresh of group list
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="flex h-full chat-page-layout">
            {/* Cột trái: Danh sách trò chuyện nhóm */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                <GroupSidebar
                    onGroupSelect={handleGroupSelect}
                    selectedGroupId={selectedGroup?.groupId}
                    refreshTrigger={refreshTrigger}
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
                    onGroupLeft={() => {
                        // Khi rời khỏi nhóm, refresh danh sách nhóm
                        setRefreshTrigger(prev => prev + 1);
                    }}
                />
            </div>
        </div>
    );
}
