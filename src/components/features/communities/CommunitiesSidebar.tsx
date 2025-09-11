"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CreateCommunityDialog } from "./CreateCommunityDialog";
import { CommunitySettingsDialog } from "./CommunitySettingsDialog";
import { getGroups, getGroupDetails } from "@/lib/customer-api-client";

interface Community {
    id: string;
    groupId: string;
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
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const [selectedCommunityForSettings, setSelectedCommunityForSettings] = useState<Community | null>(null);

    // Fetch Community groups from API
    const fetchCommunities = async () => {
        try {
            setIsLoading(true);

            // 1) Load groups the user is in
            const response = await getGroups();
            if (!(response.success && response.data)) {
                setCommunities([]);
                return;
            }

            let groupsData: any[] = [];
            if (response.data.items && Array.isArray(response.data.items)) groupsData = response.data.items;
            else if (Array.isArray(response.data)) groupsData = response.data;

            if (!groupsData || groupsData.length === 0) {
                setCommunities([]);
                return;
            }

            // 2) Many backends do NOT include GroupType in /me/groups → enrich per group
            const detailResults = await Promise.all(
                groupsData.map(async (g) => {
                    const id = g.groupId || g.GroupID;
                    try {
                        const detail = await getGroupDetails(id);
                        return { base: g, detail };
                    } catch (e) {
                        return { base: g, detail: { success: false } } as any;
                    }
                })
            );

            // 3) Filter only Community
            const onlyCommunities = detailResults
                .filter((r: any) => r?.detail?.success && (r.detail.data?.groupType === "Community"))
                .map((r: any) => {
                    const g = r.base;
                    const d = r.detail.data;
                    return {
                        id: g.groupId || g.GroupID,
                        groupId: g.groupId || g.GroupID,
                        name: g.groupName || g.GroupName,
                        description: g.description || g.Description || "",
                        avatarUrl: g.avatarUrl || g.groupAvatarUrl || g.GroupAvatarUrl || d?.groupAvatarUrl || undefined,
                        memberCount: g.memberCount || g.MemberCount || d?.memberCount || 0,
                        isAdmin: g.isAdmin || g.IsAdmin || false,
                    } as Community;
                });

            setCommunities(onlyCommunities);
        } catch (e) {
            setCommunities([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCommunities();
    }, []);

    // Listen for refresh events (e.g., when user leaves a group)
    useEffect(() => {
        const handleRefresh = () => {
            fetchCommunities();
            // Clear selection if the selected community is no longer in the list
            if (selectedCommunity) {
                const stillExists = communities.some(c => c.id === selectedCommunity);
                if (!stillExists) {
                    onCommunitySelect(null);
                }
            }
        };

        window.addEventListener('communities:refresh', handleRefresh);

        return () => {
            window.removeEventListener('communities:refresh', handleRefresh);
        };
    }, [selectedCommunity, communities, onCommunitySelect]);

    // Live update a single community when settings dialog reports changes
    useEffect(() => {
        const handleGroupUpdated = (evt: any) => {
            const { groupId, groupName, description, avatarUrl } = evt.detail || {};
            if (!groupId) return;
            setCommunities(prev => prev.map(c => {
                if (c.id !== groupId) return c;
                const updated: Community = {
                    ...c,
                    name: groupName ?? c.name,
                    description: description ?? c.description,
                    avatarUrl: avatarUrl ? `${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}ts=${Date.now()}` : c.avatarUrl,
                };
                return updated;
            }));
        };
        window.addEventListener('group:updated', handleGroupUpdated as EventListener);
        return () => window.removeEventListener('group:updated', handleGroupUpdated as EventListener);
    }, []);

    const filteredCommunities = communities.filter(community =>
        (community.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (community.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCommunitySelect = (community: Community) => { onCommunitySelect(community); };
    const handleSettingsClick = (community: Community, e: React.MouseEvent) => {
        e.stopPropagation(); setSelectedCommunityForSettings(community); setShowSettingsDialog(true);
    };

    const handleCommunityCreated = (_created: Community) => { setShowCreateDialog(false); fetchCommunities(); };

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cộng đồng</h2>
                <div className="relative mb-4">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm cộng đồng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button onClick={() => setShowCreateDialog(true)} className="w-full" size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Tạo cộng đồng mới
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="p-3 rounded-lg animate-pulse">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredCommunities.length > 0 ? (
                    <div className="space-y-2">
                        {filteredCommunities.map((community) => (
                            <div key={community.id} onClick={() => handleCommunitySelect(community)} className={`p-3 rounded-lg cursor-pointer transition-colors group ${selectedCommunity === community.id ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" : "hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        <Avatar className="h-10 w-10 flex-shrink-0">
                                            <AvatarImage src={community.avatarUrl} />
                                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">{community.name.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="font-medium text-gray-900 dark:text-white truncate">{community.name}</h3>
                                                {community.isAdmin && (<Badge variant="secondary" className="text-xs">Admin</Badge>)}
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{community.description}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={(e) => handleSettingsClick(community, e)} className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"><Settings className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">Chưa có cộng đồng nào</p>
                        <Button onClick={() => setShowCreateDialog(true)} variant="outline" size="sm" className="mt-3"><Plus className="h-4 w-4 mr-2" />Tạo cộng đồng đầu tiên</Button>
                    </div>
                )}
            </div>

            <CreateCommunityDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onCommunityCreated={handleCommunityCreated} />
            <CommunitySettingsDialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog} community={selectedCommunityForSettings} />
        </div>
    );
}
