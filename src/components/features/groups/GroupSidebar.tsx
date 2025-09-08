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
}

export function GroupSidebar({ onGroupSelect, selectedGroupId }: GroupSidebarProps) {
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

            const res = await getMyGroupsPaged(page, pageSize, searchTerm);
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
                    memberCount: undefined,
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
    }, [pageSize]);

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

    // Load more groups when scrolling to bottom
    const loadMoreGroups = useCallback(() => {
        if (!isLoadingMore && hasMorePages) {
            fetchGroups(currentPage + 1, true);
        }
    }, [currentPage, hasMorePages, isLoadingMore, fetchGroups]);

    // Handle scroll for infinite loading
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

        if (isNearBottom && hasMorePages && !isLoadingMore) {
            loadMoreGroups();
        }
    }, [hasMorePages, isLoadingMore, loadMoreGroups]);

    // Initial load
    useEffect(() => {
        fetchGroups(1, false);
    }, [fetchGroups]);

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

    // Filter groups based on search term with safe null checks
    const filteredGroups = Array.isArray(groups) ? groups.filter(group =>
        group &&
        group.groupName &&
        (safeToLowerCase(group.groupName).includes(safeToLowerCase(searchTerm)) ||
            safeToLowerCase(group.description || "").includes(safeToLowerCase(searchTerm)))
    ) : [];

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
                                Đã hiển thị tất cả nhóm ({totalRecords} nhóm)
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
                                ? "Thử tìm kiếm với từ khóa khác"
                                : "Tạo nhóm mới hoặc tìm kiếm nhóm để tham gia"
                            }
                        </p>
                        {!searchTerm && (
                            <Button
                                onClick={() => setIsCreateGroupOpen(true)}
                                className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] hover:from-[#ad46ff]/90 hover:to-[#1447e6]/90 text-white"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Tạo nhóm đầu tiên
                            </Button>
                        )}
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