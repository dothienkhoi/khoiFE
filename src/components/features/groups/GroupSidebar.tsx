"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Plus, Users, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getMyGroupsPaged } from "@/lib/customer-api-client";
import { safeToLowerCase } from "@/lib/utils";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { GroupItem } from "./GroupItem";

interface Group {
    groupId: string;
    groupName: string;
    description: string;
    avatarUrl?: string | null;
    lastMessagePreview?: string;
    lastMessageTimestamp?: string;
    unreadCount?: number;
    groupType?: "Public" | "Private" | "Community";
    memberCount?: number;
    conversationId?: number;
}

interface GroupSidebarProps {
    onGroupSelect: (group: Group) => void;
    selectedGroupId?: string;
    refreshTrigger?: number;
}

export function GroupSidebar({ onGroupSelect, selectedGroupId, refreshTrigger }: GroupSidebarProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    // Client-side pagination after fetching conversations
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMorePages, setHasMorePages] = useState(true);
    const [totalRecords, setTotalRecords] = useState(0);
    const pageSize = 20;
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Fetch my groups using /api/v1/me/groups (paged)
    const fetchGroups = useCallback(async (page: number = 1, append: boolean = false) => {
        try {
            if (page === 1) {
                setIsLoading(true);
            } else {
                setIsLoadingMore(true);
            }

            // Don't send searchTerm to API since server doesn't filter properly
            // We'll do client-side filtering instead
            const res = await getMyGroupsPaged(page, pageSize);

            if (res.success && res.data) {
                const items = res.data.items || [];

                const mapped: Group[] = items.map((g: any) => ({
                    groupId: g.groupId,
                    groupName: g.groupName,
                    description: g.description || "",
                    avatarUrl: g.avatarUrl || null,
                    lastMessagePreview: "",
                    lastMessageTimestamp: undefined,
                    unreadCount: 0,
                    groupType: (g.groupType?.toLowerCase() === "private" ? "Private" : "Public"),
                    memberCount: typeof g.memberCount === "number" ? g.memberCount : undefined,
                    conversationId: g.conversationId
                }));

                if (append) setGroups(prev => [...prev, ...mapped]); else setGroups(mapped);
                setTotalRecords(res.data.totalRecords || mapped.length);
                setHasMorePages((res.data.pageNumber || page) < (res.data.totalPages || 1));
                setCurrentPage(res.data.pageNumber || page);
            } else {
                if (!append) setGroups([]);
            }
        } catch (error) {
            if (!append) {
                setGroups([]);
            }
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [pageSize]); // Remove searchTerm dependency since we're not using server-side search

    // Function to manually add new group to top of list
    const addNewGroupToTop = useCallback((newGroup: any) => {
        const transformedGroup: Group = {
            groupId: newGroup.groupId,
            groupName: newGroup.groupName,
            description: newGroup.description || "",
            avatarUrl: newGroup.groupAvatarUrl || null,
            lastMessagePreview: newGroup.description || "",
            lastMessageTimestamp: undefined,
            unreadCount: 0,
            groupType: newGroup.groupType || "Public",
            memberCount: 1,
            conversationId: newGroup.defaultConversationId || parseInt(newGroup.groupId)
        };

        setGroups(prev => [transformedGroup, ...prev]);
        setTotalRecords(prev => prev + 1);
    }, []);

    // Refresh groups when refreshTrigger changes
    useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0) {
            fetchGroups(1, false);
        }
    }, [refreshTrigger, fetchGroups]);

    // Load more groups when scrolling to bottom
    const loadMoreGroups = useCallback(() => {
        if (!isLoadingMore && hasMorePages) {
            fetchGroups(currentPage + 1, true);
        }
    }, [currentPage, hasMorePages, isLoadingMore, fetchGroups]);

    // Load all pages for comprehensive search
    const loadAllPagesForSearch = useCallback(async () => {
        try {
            setIsLoading(true);

            // First, get the total number of pages
            const firstPageRes = await getMyGroupsPaged(1, pageSize);
            if (!firstPageRes.success || !firstPageRes.data) {
                return;
            }

            const totalPages = firstPageRes.data.totalPages || 1;
            const totalRecords = firstPageRes.data.totalRecords || 0;

            if (totalPages <= 1) {
                // Only one page, just use the data we already have
                setIsLoading(false);
                return;
            }

            // Load all remaining pages
            const allGroups = [...(firstPageRes.data.items || [])];

            for (let page = 2; page <= totalPages; page++) {
                const pageRes = await getMyGroupsPaged(page, pageSize);

                if (pageRes.success && pageRes.data) {
                    allGroups.push(...(pageRes.data.items || []));
                }
            }

            // Transform all groups
            const mapped: Group[] = allGroups.map((g: any) => ({
                groupId: g.groupId,
                groupName: g.groupName,
                description: g.description || "",
                avatarUrl: g.avatarUrl || null,
                lastMessagePreview: "",
                lastMessageTimestamp: undefined,
                unreadCount: 0,
                groupType: (g.groupType?.toLowerCase() === "private" ? "Private" : "Public"),
                memberCount: typeof g.memberCount === "number" ? g.memberCount : undefined,
                conversationId: g.conversationId
            }));

            // Update state with all groups
            setGroups(mapped);
            setTotalRecords(totalRecords);
            setHasMorePages(false); // No more pages to load
            setCurrentPage(totalPages);

        } catch (error) {
            console.error("Failed to load all pages for search:", error);
        } finally {
            setIsLoading(false);
        }
    }, [pageSize]);

    // Handle scroll for infinite loading
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

        if (isNearBottom && hasMorePages && !isLoadingMore) {
            loadMoreGroups();
        }
    }, [hasMorePages, isLoadingMore, loadMoreGroups]);

    // Handle search term changes with debounce
    // Load ALL pages when searching to ensure we can find groups from any page
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (searchTerm && searchTerm.trim()) {
                // Load all pages to ensure we can search through all groups
                await loadAllPagesForSearch();
            } else {
                // If no search term, reset to show all groups
                setCurrentPage(1);
                setHasMorePages(true);
                fetchGroups(1, false);
            }
        }, searchTerm ? 300 : 0);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Initial load only when component mounts
    useEffect(() => {
        fetchGroups(1, false);
    }, []); // Empty dependency array - only run on mount

    // Listen for real-time message updates (only update unread count, keep description)
    useEffect(() => {
        const handleNewMessage = (event: CustomEvent) => {
            const { conversationId, message, isFromCurrentUser } = event.detail;

            // Only update if message is from another user and we're not currently viewing this conversation
            if (!isFromCurrentUser && selectedGroupId !== conversationId.toString()) {
                setGroups(prevGroups =>
                    prevGroups.map(group => {
                        if (group.conversationId === conversationId) {
                            return {
                                ...group,
                                unreadCount: (group.unreadCount || 0) + 1
                            };
                        }
                        return group;
                    })
                );
            }
        };

        const handleResetUnreadCount = (event: CustomEvent) => {
            const { conversationId } = event.detail;

            setGroups(prevGroups =>
                prevGroups.map(group => {
                    if (group.conversationId === conversationId) {
                        return {
                            ...group,
                            unreadCount: 0
                        };
                    }
                    return group;
                })
            );
        };

        window.addEventListener('newMessageReceived', handleNewMessage as EventListener);
        window.addEventListener('resetGroupUnreadCount', handleResetUnreadCount as EventListener);

        return () => {
            window.removeEventListener('newMessageReceived', handleNewMessage as EventListener);
            window.removeEventListener('resetGroupUnreadCount', handleResetUnreadCount as EventListener);
        };
    }, [selectedGroupId]);

    // Client-side filtering as backup since server doesn't filter properly
    const filteredGroups = searchTerm && searchTerm.trim()
        ? groups.filter(group =>
            group &&
            group.groupName &&
            (group.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (group.description || "").toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : groups;


    // Handle group selection
    const handleGroupSelect = (group: Group) => {
        onGroupSelect(group);

        // Reset unread count when group is selected
        if (group.unreadCount && group.unreadCount > 0) {
            setGroups(prevGroups =>
                prevGroups.map(g =>
                    g.groupId === group.groupId
                        ? { ...g, unreadCount: 0 }
                        : g
                )
            );
        }
    };

    // Add new group to the top of the list after creating
    const handleGroupCreated = useCallback(async (newGroupData?: any) => {
        // If we have new group data, add it to top immediately
        if (newGroupData && newGroupData.groupId) {
            addNewGroupToTop(newGroupData);
        }

        // Also refresh the entire list to ensure consistency
        setTimeout(async () => {
            setCurrentPage(1);
            setHasMorePages(true);
            await fetchGroups(1, false);
        }, 1000);

    }, [fetchGroups, addNewGroupToTop]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-[#ad46ff]/10 to-[#1447e6]/10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Trò chuyện nhóm</h2>

                </div>

                {/* Search Input with Action Button */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />

                    {/* Action Button Inside Search */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCreateGroupOpen(true)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-lg bg-gradient-to-r from-[#ad46ff]/10 to-[#1447e6]/10 hover:from-[#ad46ff]/20 hover:to-[#1447e6]/20 text-[#ad46ff] hover:text-[#ad46ff]/80 shadow-sm transition-all duration-300"
                        title="Tạo nhóm mới"
                    >
                        <Plus className="h-3 w-3" />
                    </Button>

                    <Input
                        placeholder="Tìm kiếm nhóm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-[#ad46ff] focus:ring-[#ad46ff]/20 transition-all duration-300"
                    />


                </div>
            </div>

            {/* Groups List */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4 scrollbar-hide"
                onScroll={handleScroll}
            >
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-[#ad46ff]/10 to-[#1447e6]/10 rounded-full flex items-center justify-center mb-4 animate-pulse">
                            <Users className="w-8 h-8 text-[#ad46ff]" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Đang tải nhóm...</p>
                    </div>
                ) : filteredGroups.length > 0 ? (
                    <div className="space-y-2">
                        {filteredGroups.map((group) => (
                            <GroupItem
                                key={group?.groupId || Math.random()}
                                group={group}
                                isSelected={selectedGroupId === group.groupId}
                                onClick={() => group && handleGroupSelect(group)}
                            />
                        ))}

                        {/* Loading more indicator */}
                        {isLoadingMore && (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-[#ad46ff]" />
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                    Đang tải thêm...
                                </span>
                            </div>
                        )}

                        {/* End of list indicator */}
                        {!hasMorePages && filteredGroups.length > 0 && (
                            <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                                {searchTerm ? (
                                    <div>
                                        <p>Đã tìm kiếm trong tất cả nhóm</p>
                                        <p className="text-xs mt-1">Tìm thấy {filteredGroups.length} nhóm cho "{searchTerm}" từ {totalRecords} nhóm tổng cộng</p>
                                    </div>
                                ) : (
                                    `Đã hiển thị tất cả nhóm của bạn (${totalRecords} nhóm)`
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-[#ad46ff]/10 to-[#1447e6]/10 rounded-full flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-[#ad46ff]" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            {searchTerm ? "Không tìm thấy nhóm" : "Chưa có nhóm nào"}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                            {searchTerm
                                ? `Thử tìm kiếm với từ khóa khác cho "${searchTerm}"`
                                : "Tạo nhóm mới hoặc tham gia nhóm từ Khám Phá"
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Create Group Dialog */}
            <CreateGroupDialog
                open={isCreateGroupOpen}
                onOpenChange={setIsCreateGroupOpen}
                onGroupCreated={handleGroupCreated}
            />
        </div>
    );
}