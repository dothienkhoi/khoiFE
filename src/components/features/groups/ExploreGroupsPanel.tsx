"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Users, Search as SearchIcon } from "lucide-react";
import { getMyGroups, getPublicGroups, joinPublicGroup } from "@/lib/customer-api-client";

interface ExploreGroupsPanelProps {
    onJoin?: (groupId: string) => void;
}

interface GroupItem {
    id: string;
    name: string;
    description?: string;
    avatarUrl?: string | null;
    type: "Public" | "Community";
    memberCount: number;
}

export function ExploreGroupsPanel({ onJoin }: ExploreGroupsPanelProps) {
    const [query, setQuery] = useState("");
    const [items, setItems] = useState<GroupItem[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set());
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Reset on query change
    useEffect(() => {
        setItems([]);
        setPage(1);
        setHasMore(true);
        setJoinedGroupIds(new Set());
    }, [query]);

    // Fetch joined groups first, then public groups
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                // First, fetch joined groups
                const joinedRes = await getMyGroups(1, 100);
                if (cancelled) return;

                const joinedIds = new Set<string>(
                    (joinedRes?.data?.items || []).map((group: any) =>
                        String(group.groupId || group.groupID || group.id)
                    )
                );

                // Then fetch public groups and filter
                const publicRes = await getPublicGroups(page, 20, query || undefined);
                if (cancelled) return;

                const allPublicGroups = (publicRes?.data?.items || [])
                    .map((g: any) => ({
                        id: g.groupId || g.groupID || g.id,
                        name: g.groupName,
                        description: g.description || g.groupDescription || "",
                        avatarUrl: g.groupAvatarUrl || g.avatarUrl || null,
                        type: "Public" as const,
                        memberCount: typeof g.memberCount === "number" ? g.memberCount : 1,
                    }));

                const normalized = allPublicGroups.filter((group) => !joinedIds.has(group.id));

                // Only update state if not cancelled
                if (!cancelled) {
                    setJoinedGroupIds(joinedIds);
                    setItems(prev => page === 1 ? normalized : [...prev, ...normalized]);
                    const totalPages = publicRes?.data?.totalPages ?? page;
                    setHasMore(page < totalPages);
                }
            } catch (error) {
                console.error("Failed to fetch groups:", error);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [page, query]);

    useEffect(() => {
        if (!sentinelRef.current) return;
        const el = sentinelRef.current;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !loading) {
                setPage(prev => prev + 1);
            }
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loading]);

    const handleJoinGroup = async (groupId: string) => {
        try {
            await joinPublicGroup(groupId);

            // Remove from list immediately
            setItems(prev => prev.filter(item => item.id !== groupId));

            // Add to joined groups set
            setJoinedGroupIds(prev => new Set([...prev, groupId]));

            // Call parent callback if provided
            onJoin?.(groupId);
        } catch (error) {
            console.error("Failed to join group:", error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/50">
            {/* Header Section */}
            <div className="px-6 py-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-[#ad46ff]/20 to-[#1447e6]/20 shadow-lg">
                        <Globe className="h-6 w-6 text-[#ad46ff]" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#ad46ff] to-[#1447e6]">
                            Khám Phá
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Tìm nhóm công khai và cộng đồng để tham gia cùng mọi người
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm nhóm công khai..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-12 h-12 bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-[#ad46ff]/20 focus:border-[#ad46ff] transition-all duration-200"
                    />
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto px-6 py-5 scrollbar-hide">
                    {loading && items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ad46ff]/20 border-t-[#ad46ff] mb-4"></div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Đang tải nhóm...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                                <SearchIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Không tìm thấy nhóm phù hợp
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                                Thử thay đổi từ khóa tìm kiếm hoặc tạo nhóm mới để bắt đầu
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Group Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {items.map((g, idx) => (
                                    <div
                                        key={`${g.id}-${idx}`}
                                        className="group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-xl hover:shadow-[#ad46ff]/10 transition-all duration-300 hover:-translate-y-1"
                                    >
                                        {/* Gradient Banner */}
                                        <div className="h-20 bg-gradient-to-r from-[#ad46ff]/30 via-[#1447e6]/30 to-[#ad46ff]/30 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                        </div>

                                        {/* Card Content */}
                                        <div className="p-5">
                                            <div className="flex items-start gap-4">
                                                <Avatar className="h-14 w-14 -mt-7 border-4 border-white dark:border-gray-800 shadow-lg">
                                                    <AvatarImage src={g.avatarUrl || undefined} />
                                                    <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white font-bold text-lg">
                                                        {g.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate text-lg">
                                                            {g.name}
                                                        </h3>
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                <Globe className="h-3 w-3" />
                                                                Công khai
                                                            </div>
                                                        </Badge>
                                                    </div>

                                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                                                        {g.description || "Kết nối và chia sẻ với cộng đồng rộng lớn"}
                                                    </p>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                                            <Users className="h-4 w-4" />
                                                            <span className="font-medium">{g.memberCount.toLocaleString("vi-VN")} thành viên</span>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white hover:from-[#ad46ff]/90 hover:to-[#1447e6]/90 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2 rounded-xl font-medium"
                                                            onClick={() => handleJoinGroup(g.id)}
                                                        >
                                                            Tham gia
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Loading Sentinel */}
                            <div ref={sentinelRef} className="h-8" />

                            {/* Loading More Indicator */}
                            {loading && items.length > 0 && (
                                <div className="flex items-center justify-center py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#ad46ff]/20 border-t-[#ad46ff]"></div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Đang tải thêm nhóm...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
