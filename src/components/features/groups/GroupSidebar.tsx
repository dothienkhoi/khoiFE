"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Users, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { getGroups } from "@/lib/customer-api-client";

interface Group {
    groupId: string;
    groupName: string;
    description: string;
    avatarUrl?: string | null;
}

interface GroupSidebarProps {
    onGroupSelect: (group: Group) => void;
}

export function GroupSidebar({ onGroupSelect }: GroupSidebarProps) {
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [groups, setGroups] = useState<Group[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch groups on component mount
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                setIsLoading(true);
                const response = await getGroups();

                if (response.success && response.data && response.data.items && Array.isArray(response.data.items)) {
                    setGroups(response.data.items);
                } else if (response.success && response.data && Array.isArray(response.data)) {
                    setGroups(response.data);
                } else {
                    setGroups([]);
                }
            } catch (error) {
                setGroups([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGroups();
    }, []);

    // Filter groups based on search term
    const filteredGroups = Array.isArray(groups) ? groups.filter(group =>
        group && group.groupName && group.description &&
        group.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    // Handle group selection
    const handleGroupSelect = (group: Group) => {
        onGroupSelect(group);
    };

    // Refresh groups list after creating a new group
    const handleGroupCreated = async () => {
        try {
            const response = await getGroups();
            if (response.success && response.data && response.data.items && Array.isArray(response.data.items)) {
                setGroups(response.data.items);
            } else if (response.success && response.data && Array.isArray(response.data)) {
                setGroups(response.data);
            } else {
                setGroups([]);
            }
        } catch (error) {
            setGroups([]);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Trò chuyện nhóm</h1>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleGroupCreated}
                            disabled={isLoading}
                        >
                            🔄
                        </Button>
                        <Button
                            size="sm"
                            className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] hover:from-[#ad46ff]/90 hover:to-[#1447e6]/90"
                            onClick={() => setIsCreateGroupOpen(true)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm nhóm..."
                        className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Groups List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ad46ff] mx-auto"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Đang tải nhóm...</p>
                    </div>
                ) : filteredGroups.length > 0 ? (
                    <div className="p-2">
                        {filteredGroups.map((group) => (
                            <div
                                key={group?.groupId || Math.random()}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                                onClick={() => group && handleGroupSelect(group)}
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={group?.avatarUrl || undefined} />
                                    <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white font-semibold">
                                        {group?.groupName?.charAt(0).toUpperCase() || "G"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                            {group?.groupName || "Tên nhóm không xác định"}
                                        </h3>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Nhóm chat
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                        {group?.description || "Không có mô tả"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-[#ad46ff]/10 to-[#1447e6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
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
                                size="sm"
                                variant="outline"
                                className="w-full border-gray-300 dark:border-gray-600"
                                onClick={() => setIsCreateGroupOpen(true)}
                            >
                                <Plus className="h-3 w-3 mr-2" />
                                Tạo nhóm mới
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Create Group Dialog */}
            <CreateGroupDialog
                isOpen={isCreateGroupOpen}
                onClose={() => setIsCreateGroupOpen(false)}
                onGroupCreated={handleGroupCreated}
            />
        </div>
    );
}
