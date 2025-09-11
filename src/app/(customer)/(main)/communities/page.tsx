"use client";

import { useEffect, useState } from "react";
import { useCustomerStore } from "@/store/customerStore";
import { CommunitiesSidebar } from "@/components/features/communities/CommunitiesSidebar";
import { PublicGroupsContent } from "@/components/features/communities/PublicGroupsContent";
import { CommunityPostsInterface } from "@/components/features/communities/CommunityPostsInterface";
import { getGroupDetails } from "@/lib/customer-api-client";

interface Community {
    id: string;
    name: string;
    description: string;
    avatarUrl?: string;
    memberCount: number;
    isAdmin: boolean;
}

export default function CommunitiesPage() {
    const { setActiveNavItem } = useCustomerStore();
    const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

    useEffect(() => {
        setActiveNavItem('communities');
    }, [setActiveNavItem]);

    // Handle community selection
    const handleCommunitySelect = (community: Community | null) => {
        setSelectedCommunity(community);
    };

    // Nhận cập nhật tức thì từ dialog cài đặt nhóm
    useEffect(() => {
        const handleGroupUpdated = (evt: any) => {
            const { groupId, groupName, description, avatarUrl } = evt.detail || {};
            if (!groupId) return;
            setSelectedCommunity((prev) => {
                if (!prev || prev.id !== groupId) return prev || null;
                return {
                    ...prev,
                    name: groupName ?? prev.name,
                    description: description ?? prev.description,
                    avatarUrl: avatarUrl ? `${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}ts=${Date.now()}` : prev.avatarUrl,
                } as Community;
            });
        };
        window.addEventListener('group:updated', handleGroupUpdated as EventListener);
        return () => window.removeEventListener('group:updated', handleGroupUpdated as EventListener);
    }, []);

    // Đảm bảo đồng bộ khi có yêu cầu refresh toàn bộ cộng đồng
    useEffect(() => {
        const handleCommunitiesRefresh = async () => {
            if (!selectedCommunity) return;
            try {
                const res = await getGroupDetails(selectedCommunity.id);
                if (res?.success && res.data) {
                    const d = res.data;
                    setSelectedCommunity(prev => prev ? {
                        ...prev,
                        name: d.groupName || prev.name,
                        description: d.description || prev.description,
                        avatarUrl: d.groupAvatarUrl ? `${d.groupAvatarUrl}${d.groupAvatarUrl.includes('?') ? '&' : '?'}ts=${Date.now()}` : prev.avatarUrl,
                    } : prev);
                }
            } catch { }
        };
        window.addEventListener('communities:refresh', handleCommunitiesRefresh as EventListener);
        return () => window.removeEventListener('communities:refresh', handleCommunitiesRefresh as EventListener);
    }, [selectedCommunity]);

    return (
        <div className="communities-layout">
            {/* Cột trái: Sidebar Cộng đồng */}
            <div className="communities-sidebar">
                <CommunitiesSidebar
                    selectedCommunity={selectedCommunity?.id || null}
                    onCommunitySelect={handleCommunitySelect}
                />
            </div>

            {/* Cột phải: Content */}
            <div className="communities-content">
                {selectedCommunity ? (
                    // Hiển thị giao diện đăng bài của cộng đồng đã chọn
                    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
                        {/* Header với thông tin cộng đồng */}
                        <div className="p-6 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                            <div className="flex items-center space-x-4 mb-4">
                                <button
                                    onClick={() => setSelectedCommunity(null)}
                                    className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    <span>Quay lại</span>
                                </button>
                            </div>

                            <div className="flex items-center space-x-3">
                                {/* Show community avatar image if available */}
                                <div className="w-12 h-12 rounded-full overflow-hidden">
                                    <img
                                        key={selectedCommunity.avatarUrl || 'default'}
                                        src={selectedCommunity.avatarUrl || '/images/default-avatar.png'}
                                        alt={selectedCommunity.name}
                                        className="w-12 h-12 object-cover"
                                    />
                                </div>

                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {selectedCommunity.name}
                                    </h1>
                                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span>{selectedCommunity.description}</span>
                                        {/* Ẩn số thành viên */}
                                        {selectedCommunity.isAdmin && (
                                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                                                Admin
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Giao diện đăng bài của cộng đồng */}
                        <CommunityPostsInterface
                            groupId={selectedCommunity.id}
                            groupName={selectedCommunity.name}
                            groupAvatar={selectedCommunity.avatarUrl}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
}

