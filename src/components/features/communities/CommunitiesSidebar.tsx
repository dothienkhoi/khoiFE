"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CreateCommunityDialog } from "./CreateCommunityDialog";
import { CommunitySettingsDialog } from "./CommunitySettingsDialog";

interface Community {
    id: string;
    name: string;
    description: string;
    avatarUrl?: string;
    memberCount: number;
    isAdmin: boolean;
}

interface CommunitiesSidebarProps {
    selectedCommunity: string | null;
    onCommunitySelect: (community: Community | null) => void;
}

export function CommunitiesSidebar({ selectedCommunity, onCommunitySelect }: CommunitiesSidebarProps) {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const [selectedCommunityForSettings, setSelectedCommunityForSettings] = useState<Community | null>(null);

    // Mock data - sẽ thay thế bằng API call
    useEffect(() => {
        const mockCommunities: Community[] = [
            {
                id: "1",
                name: "Cộng đồng Công nghệ",
                description: "Chia sẻ kiến thức về công nghệ và lập trình",
                avatarUrl: "/api/placeholder/40/40",
                memberCount: 1250,
                isAdmin: true
            },
            {
                id: "2",
                name: "Cộng đồng Marketing",
                description: "Kết nối các chuyên gia marketing",
                avatarUrl: "/api/placeholder/40/40",
                memberCount: 890,
                isAdmin: false
            },
            {
                id: "3",
                name: "Cộng đồng Thiết kế",
                description: "Sáng tạo và thiết kế đồ họa",
                avatarUrl: "/api/placeholder/40/40",
                memberCount: 567,
                isAdmin: false
            }
        ];
        setCommunities(mockCommunities);
    }, []);

    // Filter communities based on search term
    const filteredCommunities = communities.filter(community =>
        community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle community selection
    const handleCommunitySelect = (community: Community) => {
        onCommunitySelect(community);
    };

    // Handle settings button click
    const handleSettingsClick = (community: Community, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedCommunityForSettings(community);
        setShowSettingsDialog(true);
    };

    // Handle community creation
    const handleCommunityCreated = (newCommunity: Community) => {
        setCommunities(prev => [newCommunity, ...prev]);
        setShowCreateDialog(false);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Cộng đồng
                </h2>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm cộng đồng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Create Community Button */}
                <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="w-full"
                    size="sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo cộng đồng mới
                </Button>
            </div>

            {/* Communities List */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-3 animate-pulse">
                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredCommunities.length > 0 ? (
                    <div className="space-y-2">
                        {filteredCommunities.map((community) => (
                            <div
                                key={community.id}
                                onClick={() => handleCommunitySelect(community)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedCommunity === community.id
                                    ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        <Avatar className="h-10 w-10 flex-shrink-0">
                                            <AvatarImage src={community.avatarUrl} />
                                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                                                {community.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                                    {community.name}
                                                </h3>
                                                {community.isAdmin && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Admin
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                {community.description}
                                            </p>
                                            <div className="flex items-center space-x-1 mt-1">
                                                <Users className="h-3 w-3 text-gray-400" />
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {community.memberCount.toLocaleString()} thành viên
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Settings Button */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => handleSettingsClick(community, e)}
                                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm ? "Không tìm thấy cộng đồng nào" : "Chưa có cộng đồng nào"}
                        </p>
                        {!searchTerm && (
                            <Button
                                onClick={() => setShowCreateDialog(true)}
                                variant="outline"
                                size="sm"
                                className="mt-3"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Tạo cộng đồng đầu tiên
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Dialogs */}
            <CreateCommunityDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onCommunityCreated={handleCommunityCreated}
            />

            <CommunitySettingsDialog
                open={showSettingsDialog}
                onOpenChange={setShowSettingsDialog}
                community={selectedCommunityForSettings}
            />
        </div>
    );
}
