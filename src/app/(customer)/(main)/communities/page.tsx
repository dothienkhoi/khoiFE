"use client";

import { useEffect, useState } from "react";
import { useCustomerStore } from "@/store/customerStore";
import { CommunitiesSidebar } from "@/components/features/communities/CommunitiesSidebar";
import { PublicGroupsContent } from "@/components/features/communities/PublicGroupsContent";
import { CommunityPostsInterface } from "@/components/features/communities/CommunityPostsInterface";

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

    return (
        <div className="flex h-full communities-page-layout">
            {/* Cột trái: Sidebar Cộng đồng */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                <CommunitiesSidebar
                    selectedCommunity={selectedCommunity?.id || null}
                    onCommunitySelect={handleCommunitySelect}
                />
            </div>

            {/* Cột phải: Content */}
            <div className="flex-1">
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
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    {selectedCommunity.name.charAt(0).toUpperCase()}
                                </div>

                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {selectedCommunity.name}
                                    </h1>
                                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span>{selectedCommunity.description}</span>
                                        <div className="flex items-center space-x-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                            </svg>
                                            <span>{selectedCommunity.memberCount.toLocaleString()} thành viên</span>
                                        </div>
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
                ) : (
                    // Hiển thị danh sách nhóm công khai (mặc định)
                    <PublicGroupsContent
                        selectedCommunity={null}
                    />
                )}
            </div>
        </div>
    );
}
