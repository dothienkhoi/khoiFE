"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Users, MapPin, Calendar, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CommunityPostsInterface } from "./CommunityPostsInterface";
import { getGroups, getGroupDetails, joinGroup, leaveGroup } from "@/lib/customer-api-client";

interface PublicGroup {
    id: string;
    name: string;
    description: string;
    avatarUrl?: string;
    memberCount: number;
    category: string;
    location?: string;
    lastActivity: string;
    isJoined: boolean;
}

interface PublicGroupsContentProps {
    selectedCommunity: string | null;
}

export function PublicGroupsContent({ selectedCommunity }: PublicGroupsContentProps) {
    const [groups, setGroups] = useState<PublicGroup[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedGroup, setSelectedGroup] = useState<PublicGroup | null>(null);
    const groupsPerPage = 10;

    // Load only real Community groups via API (no mock)
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            let realCommunities: PublicGroup[] = [];
            try {
                const res = await getGroups();
                if (res.success && res.data) {
                    let items: any[] = [];
                    if (Array.isArray(res.data.items)) items = res.data.items; else if (Array.isArray(res.data)) items = res.data;

                    // fetch details for type filtering
                    const details = await Promise.all(items.map(async (g) => {
                        const id = g.groupId || g.GroupID;
                        try { return await getGroupDetails(id); } catch { return { success: false }; }
                    }));

                    realCommunities = items
                        .map((g, idx) => ({ base: g, detail: details[idx] }))
                        .filter(r => r.detail?.success && r.detail.data?.groupType === "Community")
                        .map(r => {
                            const g = r.base; const d = r.detail.data;
                            return {
                                id: g.groupId || g.GroupID,
                                name: g.groupName || g.GroupName,
                                description: g.description || g.Description || "",
                                avatarUrl: g.avatarUrl || g.groupAvatarUrl || g.GroupAvatarUrl || d?.groupAvatarUrl || undefined,
                                memberCount: g.memberCount || g.MemberCount || d?.memberCount || 0,
                                category: "Cộng đồng",
                                location: undefined,
                                lastActivity: "",
                                isJoined: true // current user is member/creator
                            } as PublicGroup;
                        });
                }
            } catch (e) {
                // ignore network issues
            }

            // Only use real communities (no mock)
            setGroups(realCommunities);
            setTotalPages(Math.ceil(realCommunities.length / groupsPerPage) || 1);
            setIsLoading(false);
        };

        load();
    }, []);

    // Filter groups based on search term and category
    const filteredGroups = groups.filter(group => {
        const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "all" || group.category === selectedCategory;
        // Hide any group that the current user has already joined/created
        const notJoined = !group.isJoined;
        return matchesSearch && matchesCategory && notJoined;
    });

    // Paginate groups
    const startIndex = (currentPage - 1) * groupsPerPage;
    const paginatedGroups = filteredGroups.slice(startIndex, startIndex + groupsPerPage);

    // Handle group selection
    const handleGroupSelect = (group: PublicGroup) => {
        setSelectedGroup(group);
    };

    // Handle back to groups list
    const handleBackToGroups = () => {
        setSelectedGroup(null);
    };

    // Handle group join/leave
    const handleGroupAction = async (groupId: string, action: "join" | "leave") => {
        try {
            if (action === "join") {
                await joinGroup(groupId);
                // Remove joined group from public grid immediately
                setGroups(prev => prev.filter(g => g.id !== groupId));
            } else {
                await leaveGroup(groupId);
                // If leaving, ensure it's visible again (but only shows for users not joined; current user still sees it hidden)
                setGroups(prev => prev.map(group => group.id === groupId ? { ...group, isJoined: false } : group));
            }
        } catch (error) {
            console.error(`Error ${action}ing group:`, error);
        }
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const categories = [
        { value: "all", label: "Tất cả" },
        { value: "Cộng đồng", label: "Cộng đồng" }
    ];

    if (selectedGroup) {
        return (
            <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
                <div className="p-6 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center space-x-4 mb-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBackToGroups}
                            className="flex items-center space-x-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Quay lại</span>
                        </Button>

                        <div className="flex items-center space-x-3">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={selectedGroup.avatarUrl} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to purple-600 text-white font-semibold">
                                    {selectedGroup.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {selectedGroup.name}
                                </h1>
                                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span>{selectedGroup.description}</span>
                                    <div className="flex items-center space-x-1">
                                        <Users className="h-3 w-3" />
                                        <span>{selectedGroup.memberCount.toLocaleString()} thành viên</span>
                                    </div>
                                    <Badge variant="outline">{selectedGroup.category}</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <CommunityPostsInterface
                    groupId={selectedGroup.id}
                    groupName={selectedGroup.name}
                    groupAvatar={selectedGroup.avatarUrl}
                />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            <div className="p-6 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nhóm công khai</h1>
                    {selectedCommunity && (
                        <Badge variant="secondary">Cộng đồng: {selectedCommunity}</Badge>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Tìm kiếm nhóm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                    </div>

                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                    {category.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardHeader>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : paginatedGroups.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {paginatedGroups.map((group) => (
                                <Card key={group.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleGroupSelect(group)}>
                                    <CardHeader>
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={group.avatarUrl} />
                                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                                                    {group.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{group.name}</h3>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <Badge variant="outline" className="text-xs">{group.category}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-3">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{group.description}</p>

                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center space-x-1">
                                                <Users className="h-3 w-3" />
                                                <span>{group.memberCount.toLocaleString()} thành viên</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>{group.lastActivity || ""}</span>
                                            </div>
                                        </div>

                                        <Button onClick={(e) => { e.stopPropagation(); handleGroupAction(group.id, group.isJoined ? "leave" : "join"); }} variant={group.isJoined ? "outline" : "default"} className="w-full" size="sm">
                                            {group.isJoined ? "Rời nhóm" : "Tham gia nhóm"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center space-x-2">
                                <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                    Trang trước
                                </Button>

                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => handlePageChange(page)} className="w-8 h-8 p-0">
                                            {page}
                                        </Button>
                                    ))}
                                </div>

                                <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                                    Trang sau
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <Search className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Không tìm thấy nhóm nào</h3>
                        <p className="text-gray-500 dark:text-gray-400">Hiện chưa có nhóm Community công khai nào phù hợp.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
