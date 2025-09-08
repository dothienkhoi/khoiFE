"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getGroupConversations, getGroups } from "@/lib/customer-api-client";
import { safeToLowerCase } from "@/lib/utils";
import { getMessagePreview } from "@/lib/utils/messageUtils";
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
    conversationId?: number; // Add conversationId for API calls
}

interface GroupSidebarProps {
    onGroupSelect: (group: Group) => void;
    selectedGroupId?: string;
}

export function GroupSidebar({ onGroupSelect, selectedGroupId }: GroupSidebarProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);



    // Fetch groups and conversations on component mount
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                setIsLoading(true);

                // Fetch both groups and conversations
                const [groupsResponse, conversationsResponse] = await Promise.all([
                    getGroups(),
                    getGroupConversations()
                ]);

                // Process and merge data
                const mergedGroups = mergeGroupsAndConversations(
                    groupsResponse.success ? groupsResponse.data?.items || [] : [],
                    conversationsResponse.success ? conversationsResponse.data || [] : []
                );

                setGroups(mergedGroups);
            } catch (error) {
                console.error("Error fetching groups and conversations:", error);
                setGroups([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGroups();
    }, []);

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
                                // Keep description, don't update lastMessagePreview
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

    // Helper function to merge groups and conversations data
    const mergeGroupsAndConversations = (groupsData: any[], conversationsData: any[]) => {
        // Create a map of conversations by conversationId for quick lookup
        const conversationsMap = new Map();
        conversationsData.forEach(conversation => {
            if (conversation && conversation.conversationId && conversation.conversationType === "Group") {
                conversationsMap.set(conversation.conversationId, conversation);
            }
        });

        // Create a map to track which conversations have been assigned
        const assignedConversations = new Set();

        // Process groups and merge with conversation data
        const mergedGroups = groupsData
            .filter(group => group && typeof group === 'object' && group.groupId && group.groupName)
            .map(group => {
                // Try to find matching conversation by defaultConversationId or groupId
                let conversation = null;

                // First try to find by defaultConversationId if available
                if (group.defaultConversationId) {
                    conversation = conversationsMap.get(group.defaultConversationId);
                    if (conversation) {
                        assignedConversations.add(conversation.conversationId);
                    }
                }

                // If not found, try to find by groupId pattern
                if (!conversation) {
                    // Look for conversation that might match this group
                    for (const [convId, conv] of conversationsMap.entries()) {
                        // Skip if this conversation is already assigned
                        if (assignedConversations.has(conv.conversationId)) {
                            continue;
                        }

                        // Try to match by group name or other patterns
                        if (conv.displayName === group.groupName ||
                            conv.displayName.toLowerCase().includes(group.groupName.toLowerCase())) {
                            conversation = conv;
                            assignedConversations.add(conv.conversationId);
                            break;
                        }
                    }
                }

                // If still not found, try to find any unassigned conversation
                if (!conversation) {
                    for (const [convId, conv] of conversationsMap.entries()) {
                        if (!assignedConversations.has(conv.conversationId)) {
                            conversation = conv;
                            assignedConversations.add(conv.conversationId);
                            break;
                        }
                    }
                }

                // If still not found, don't assign any conversation
                if (!conversation) {
                    console.warn(`No conversation found for group: ${group.groupName} (${group.groupId})`);
                } else {
                    // Mapped group to conversation
                }

                return {
                    groupId: group.groupId,
                    groupName: group.groupName,
                    description: group.description || "",
                    avatarUrl: group.groupAvatarUrl || group.avatarUrl || null,
                    lastMessagePreview: group.description || "", // Remove "Chưa có tin nhắn nào"
                    lastMessageTimestamp: conversation?.lastMessageTimestamp || null,
                    unreadCount: conversation?.unreadCount || 0,
                    groupType: group.groupType || undefined,
                    memberCount: group.memberCount || 1, // Fix typo: groupMemberCount -> memberCount
                    conversationId: conversation?.conversationId // Use conversationId from conversation
                };
            });

        // If no groups found, fallback to conversations only
        if (mergedGroups.length === 0) {
            return conversationsData
                .filter(conversation =>
                    conversation &&
                    conversation.conversationId &&
                    conversation.conversationType === "Group"
                )
                .map(conversation => ({
                    groupId: `conversation-${conversation.conversationId}`,
                    groupName: conversation.displayName,
                    description: "",
                    avatarUrl: conversation.avatarUrl || null,
                    lastMessagePreview: "", // Remove "Chưa có tin nhắn nào"
                    lastMessageTimestamp: conversation.lastMessageTimestamp || null,
                    unreadCount: conversation.unreadCount || 0,
                    groupType: undefined,
                    memberCount: 1,
                    conversationId: conversation.conversationId
                }));
        }

        return mergedGroups;
    };

    // Add new group to the top of the list after creating
    const handleGroupCreated = async (newGroupData?: any) => {
        // Always refresh the entire list to get the latest data including avatar
        try {
            const [groupsResponse, conversationsResponse] = await Promise.all([
                getGroups(),
                getGroupConversations()
            ]);

            const mergedGroups = mergeGroupsAndConversations(
                groupsResponse.success ? groupsResponse.data?.items || [] : [],
                conversationsResponse.success ? conversationsResponse.data || [] : []
            );
            setGroups(mergedGroups);
        } catch (error) {
            console.error("Error refreshing groups and conversations:", error);
            setGroups([]);
        }
    };





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
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
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
