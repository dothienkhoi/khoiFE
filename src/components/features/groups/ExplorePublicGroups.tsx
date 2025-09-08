"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Users, Search as SearchIcon } from "lucide-react";

interface ExplorePublicGroupsProps {
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

export function ExplorePublicGroups({ onJoin }: ExplorePublicGroupsProps) {
    const [query, setQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<"All" | "Public" | "Community">("All");
    const [items, setItems] = useState<GroupItem[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Fetch from API
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const { getPublicGroups } = await import("@/lib/customer-api-client");
                const res: any = await getPublicGroups(page, 20, query || undefined);
                if (cancelled) return;
                const normalized: GroupItem[] = (res?.data?.items || []).map((g: any) => ({
                    id: g.groupId || g.groupID || g.id,
                    name: g.groupName,
                    description: g.description || g.groupDescription || "",
                    avatarUrl: g.groupAvatarUrl || g.avatarUrl || null,
                    type: "Public",
                    memberCount: typeof g.memberCount === "number" ? g.memberCount : 1,
                }));
                setItems(prev => page === 1 ? normalized : [...prev, ...normalized]);
                const totalPages = res?.data?.totalPages ?? page;
                setHasMore(page < totalPages);
            } finally {
                setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [page, query]);

    // Reset on query/filter change
    useEffect(() => {
        setItems([]);
        setPage(1);
        setHasMore(true);
    }, [query, activeFilter]);

    useEffect(() => {
        if (!sentinelRef.current) return;
        const el = sentinelRef.current;
        const observer = new IntersectionObserver((entries) => {
            const first = entries[0];
            if (first.isIntersecting && !loading && hasMore) setPage(p => p + 1);
        }, { threshold: 1 });
        observer.observe(el);
        return () => observer.unobserve(el);
    }, [loading, hasMore]);

    return (
        <div className="flex-1 h-full relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full blur-3xl opacity-30 bg-[#ad46ff]/30"></div>
                <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-30 bg-[#1447e6]/30"></div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto h-full flex flex-col p-6">
                {/* Hero */}
                <div className="mb-6">
                    <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-[#1447e6]" />
                        <h2 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#ad46ff] to-[#1447e6]">Khám Phá</h2>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Tìm nhóm công khai và cộng đồng để tham gia cùng mọi người.</p>
                </div>

                {/* Search + Filter */}
                <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm kiếm nhóm công khai..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)}>
                        <TabsList className="grid grid-cols-3">
                            <TabsTrigger value="All">Tất cả</TabsTrigger>
                            <TabsTrigger value="Public">Công khai</TabsTrigger>
                            <TabsTrigger value="Community">Cộng đồng</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {items.map((g, idx) => (
                            <div key={`${g.id}-${idx}`} className="relative overflow-hidden rounded-xl bg-gray-50/70 dark:bg-gray-800/70 border border-gray-200/60 dark:border-gray-700/60 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                                {/* Banner */}
                                <div className="h-16 bg-gradient-to-r from-[#ad46ff]/25 to-[#1447e6]/25" />
                                <div className="p-4 pt-2 flex items-start gap-3">
                                    <div className="-mt-8">
                                        <Avatar className="h-12 w-12 ring-4 ring-white dark:ring-gray-900">
                                            <AvatarImage src={g.avatarUrl || ""} />
                                            <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white">
                                                {g.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{g.name}</p>
                                            <Badge variant="secondary" className={g.type === "Public" ? "bg-[#1447e6]/10 text-[#1447e6]" : "bg-[#ad46ff]/10 text-[#ad46ff]"}>
                                                {g.type === "Public" ? "Công khai" : "Cộng đồng"}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{g.description}</p>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                <Users className="h-3 w-3" /> {g.memberCount.toLocaleString("vi-VN")}
                                            </span>
                                            <Button
                                                size="sm"
                                                className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white"
                                                onClick={async () => {
                                                    try {
                                                        const { joinPublicGroup } = await import("@/lib/customer-api-client");
                                                        await joinPublicGroup(g.id);
                                                    } catch { }
                                                }}
                                            >
                                                Tham gia
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={sentinelRef} className="col-span-full h-6" />
                        {loading && (
                            <div className="col-span-full text-center text-sm text-gray-500 dark:text-gray-400 py-2">Đang tải...</div>
                        )}
                    </div>
                    {items.length === 0 && !loading && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Không tìm thấy nhóm phù hợp.</div>
                    )}
                </div>
            </div>
        </div>
    );
}


