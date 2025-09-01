"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Search,
    Users,
    Plus,
    MessageCircle,
    Settings
} from "lucide-react";
import { useCustomerStore } from "@/store/customerStore";
import { ChatGroup } from "@/types/customer.types";
import { cn } from "@/lib/utils";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { getMyGroups } from "@/lib/customer-api-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function MyGroups() {
    const router = useRouter();
    const { myGroups, setMyGroups, setActiveChat, activeChatId, activeChatType, toggleCreateGroup } = useCustomerStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const filteredGroups = myGroups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleGroupClick = (group: ChatGroup) => {
        setActiveChat(group.id, 'group');
        // Navigate to group chat
        router.push(`/groups/${group.id}`);
    };

    const formatLastSeen = (lastSeen?: string) => {
        if (!lastSeen) return '';
        const date = new Date(lastSeen);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Vừa xong';
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
        return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    };

    // Load my groups when component mounts
    useEffect(() => {
        const loadMyGroups = async () => {
            if (isLoading) return;

            setIsLoading(true);
            try {
                const response = await getMyGroups();
                if (response.success) {
                    // Convert API response to ChatGroup format
                    const groups: ChatGroup[] = response.data.items.map(item => ({
                        id: item.groupId,
                        name: item.groupName,
                        description: item.description || "Nhóm chat",
                        avatarUrl: item.avatarUrl || undefined,
                        isPrivate: false, // Default value
                        memberCount: 0, // Not provided by API
                        unreadCount: 0, // Not provided by API
                        isOnline: true, // Default value
                        createdAt: new Date().toISOString(), // Default value
                        updatedAt: new Date().toISOString(), // Default value
                        isMyGroup: true,
                        category: undefined,
                        tags: undefined,
                        lastMessage: undefined
                    }));
                    setMyGroups(groups);
                } else {
                    toast.error(response.message || "Không thể tải danh sách nhóm");
                }
            } catch (error: any) {
                toast.error("Có lỗi xảy ra khi tải danh sách nhóm");
            } finally {
                setIsLoading(false);
            }
        };

        loadMyGroups();
    }, [setMyGroups]);



    return (
        <div className="h-full flex flex-col">
            {/* Compact header */}
            <div className="flex-shrink-0 p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Nhóm của tôi</h2>
                    <Button onClick={toggleCreateGroup} size="sm">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm nhóm..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"

                    />
                </div>
            </div>

            {/* Groups List */}
            <div className="flex-1 overflow-hidden scrollbar-hide">
                <ScrollArea className="h-full">
                    <div className="p-2">
                        {isLoading ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-sm font-medium">Đang tải...</p>
                            </div>
                        ) : filteredGroups.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-sm font-medium">Không có nhóm nào</p>
                                <p className="text-xs">
                                    {searchQuery ? "Tìm kiếm không có kết quả" : "Bạn chưa tham gia nhóm nào"}
                                </p>
                                {!searchQuery && (
                                    <Button
                                        onClick={toggleCreateGroup}
                                        className="mt-4"
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Plus className="h-3 w-3 mr-2" />
                                        Tạo nhóm
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredGroups.map((group) => (
                                    <div
                                        key={group.id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors",
                                            activeChatId === group.id && activeChatType === 'group' && "bg-accent"
                                        )}
                                        onClick={() => handleGroupClick(group)}
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={group.avatarUrl} />
                                            <AvatarFallback className="text-xs">
                                                {group.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-medium truncate text-sm">{group.name}</h3>
                                                {group.unreadCount > 0 && (
                                                    <Badge variant="destructive" className="text-xs h-4 min-w-[16px] px-1">
                                                        {group.unreadCount}
                                                    </Badge>
                                                )}
                                            </div>

                                            <p className="text-xs text-muted-foreground truncate">
                                                {group.description || 'Nhóm chat'}
                                            </p>

                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {group.memberCount}
                                                </span>
                                                {group.lastMessage && (
                                                    <>
                                                        <span className="text-xs text-muted-foreground">•</span>
                                                        <span className="text-xs text-muted-foreground truncate">
                                                            {group.lastMessage.content}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Create Group Dialog */}
            <CreateGroupDialog />
        </div>
    );
}
