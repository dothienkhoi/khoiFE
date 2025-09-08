"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Globe, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { getGroupDetails, getGroupMembers, searchUsersForInvite, inviteUserToGroup, createGroupInviteLink } from "@/lib/customer-api-client";

interface QuickGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    group: {
        groupId: string;
        groupName: string;
        description?: string;
        groupType?: "Public" | "Private" | "Community";
        avatarUrl?: string | null;
        memberCount?: number;
    } | null;
}

export function QuickGroupDialog({ open, onOpenChange, group }: QuickGroupDialogProps) {


    if (!group) return null;

    const getDefaultDescription = (type?: string): string => {
        switch (type) {
            case "Private":
                return "Chia sẻ thông tin nội bộ và trò chuyện an toàn";
            case "Community":
                return "Nơi giao lưu và học hỏi từ nhiều thành viên";
            case "Public":
            default:
                return "Kết nối và chia sẻ với cộng đồng rộng lớn";
        }
    };

    const getBadgeClasses = (type?: string): string => {
        switch (type) {
            case "Private":
                return "bg-[#ad46ff]/10 text-[#ad46ff]";
            case "Public":
            default:
                return "bg-[#1447e6]/10 text-[#1447e6]";
        }
    };

    const [fullInfo, setFullInfo] = useState<typeof group | null>(null);
    const [members, setMembers] = useState<Array<{ userId: string; displayName: string; avatarUrl?: string | null; role?: string }>>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [candidates, setCandidates] = useState<Array<{ userId: string; fullName: string; avatarUrl?: string | null }>>([]);
    const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
    const [expiresInHours, setExpiresInHours] = useState<number>(24);
    const [maxUses, setMaxUses] = useState<number>(1);
    const [generatedLink, setGeneratedLink] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (!open || !group?.groupId) return;
            const isUuid = /^[0-9a-fA-F-]{36}$/.test(group.groupId);
            if (!isUuid) {
                // Fallback: no GUID available → skip details fetch
                setFullInfo(null);
                return;
            }
            try {
                const res = await getGroupDetails(group.groupId);
                if (!cancelled && res?.success && res.data) {
                    setFullInfo({
                        groupId: res.data.groupId,
                        groupName: res.data.groupName,
                        description: res.data.description,
                        groupType: res.data.groupType?.toLowerCase() === "private" ? "Private" : "Public",
                        avatarUrl: res.data.groupAvatarUrl,
                        memberCount: res.data.memberCount
                    });
                }
            } catch { }
        };
        load();
        return () => { cancelled = true; };
    }, [open, group?.groupId]);

    useEffect(() => {
        const loadMembers = async () => {
            const targetGroupId = (fullInfo && fullInfo.groupId) || group?.groupId;
            if (!open || !targetGroupId) return;
            const isUuid = /^[0-9a-fA-F-]{36}$/.test(targetGroupId);
            if (!isUuid) {
                setMembers([]);
                return;
            }
            try {
                setIsLoadingMembers(true);
                const res: any = await getGroupMembers(targetGroupId);
                if (res?.success && res.data) {
                    const raw = Array.isArray(res.data) ? res.data : (res.data?.items || []);
                    const normalized = raw.map((m: any) => ({
                        userId: m.userId,
                        displayName: m.fullName || m.displayName || "Người dùng",
                        avatarUrl: m.avatarUrl || null,
                        role: m.role || "Member"
                    }));
                    setMembers(normalized);
                } else {
                    setMembers([]);
                }
            } catch {
                setMembers([]);
            } finally {
                setIsLoadingMembers(false);
            }
        };
        loadMembers();
    }, [open, group?.groupId, fullInfo?.groupId]);

    // Auto search (debounced) when user types
    useEffect(() => {
        if (!open || !group?.groupId) return;
        // Only search when groupId is GUID (backend requires GUID)
        if (!/^[0-9a-fA-F-]{36}$/.test(group.groupId)) {
            setCandidates([]);
            return;
        }
        const keyword = searchTerm.trim();
        if (keyword.length < 2) {
            setCandidates([]);
            return;
        }
        const handle = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res: any = await searchUsersForInvite(group.groupId, keyword);
                if (res?.success && res.data) {
                    setCandidates(res.data);
                } else {
                    setCandidates([]);
                }
            } finally {
                setIsSearching(false);
            }
        }, 350);
        return () => clearTimeout(handle);
    }, [searchTerm, open, group?.groupId]);

    const effective = fullInfo || group;
    const memberCountDisplay = typeof effective.memberCount === "number" && effective.memberCount > 0 ? effective.memberCount : 1;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[520px] p-0 bg-white dark:bg-gray-900">
                <div className="flex h-full">
                    {/* Left column - basic group info */}
                    <div className="w-1/3 p-6 border-r border-gray-200 dark:border-gray-800 bg-gradient-to-br from-[#ad46ff]/5 to-[#1447e6]/5">
                        <div className="flex flex-col items-center mb-6">
                            <Avatar className="h-20 w-20 mb-4 ring-4 ring-[#ad46ff]/20">
                                <AvatarImage src={effective.avatarUrl || ""} alt={effective.groupName} />
                                <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white text-xl font-semibold">
                                    {effective.groupName?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                                {effective.groupName}
                            </h2>
                            <Badge variant="secondary" className={`flex items-center gap-1 ${getBadgeClasses(effective.groupType)}`}>
                                {effective.groupType === "Private" ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                                {effective.groupType === "Private" ? "Riêng tư" : "Công khai"}
                            </Badge>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mô tả nhóm</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800 p-3 rounded-lg">
                                {effective.description?.trim() || getDefaultDescription(effective.groupType)}
                            </p>
                        </div>

                        <div className="p-3 bg-white/60 dark:bg-gray-800 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <Users className="h-4 w-4" />
                                <span>Thành viên</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{memberCountDisplay}</span>
                        </div>
                    </div>

                    {/* Right column - tabs */}
                    <div className="w-2/3 flex flex-col">
                        <DialogHeader className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">Chi tiết nhóm</DialogTitle>
                        </DialogHeader>

                        <div className="flex-1 p-6">
                            <Tabs defaultValue="members" className="h-full flex flex-col">
                                <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 pb-4">
                                    <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800">
                                        <TabsTrigger value="members">Thành viên</TabsTrigger>
                                        <TabsTrigger value="invite">Mời thành viên</TabsTrigger>
                                        <TabsTrigger value="edit">Chỉnh sửa</TabsTrigger>
                                    </TabsList>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    <TabsContent value="members" className="h-full">
                                        {isLoadingMembers ? (
                                            <div className="flex items-center justify-center h-48 text-sm text-gray-600 dark:text-gray-400">Đang tải thành viên...</div>
                                        ) : members.length === 0 ? (
                                            <div className="flex items-center justify-center h-48 text-sm text-gray-600 dark:text-gray-400">Chưa có thành viên</div>
                                        ) : (
                                            <div className="space-y-2">
                                                {members.map(m => (
                                                    <div key={m.userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={m.avatarUrl || ""} />
                                                                <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white text-sm">
                                                                    {m.displayName.charAt(0).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{m.displayName}</span>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">{m.role === "Admin" ? "Quản trị viên" : "Thành viên"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </TabsContent>
                                    <TabsContent value="invite" className="h-full">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tìm người dùng theo tên hoặc email</label>
                                                <div className="mt-2 flex gap-2 items-stretch">
                                                    <input
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        placeholder="Nhập tên hoặc email..."
                                                        className="flex-1 min-w-0 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
                                                    />
                                                    {/* Nút tìm kiếm giữ lại để người dùng bấm thủ công nếu muốn */}
                                                    <button
                                                        onClick={() => setSearchTerm((s) => s)}
                                                        disabled={!searchTerm.trim() || isSearching}
                                                        className="rounded-md bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white text-sm px-4 py-2 disabled:opacity-60"
                                                    >
                                                        {isSearching ? "Đang tìm..." : "Tìm kiếm"}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                {(!searchTerm.trim() || searchTerm.trim().length < 2) && !isSearching && candidates.length === 0 && (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">Nhập từ khóa để tìm người dùng.</div>
                                                )}

                                                {searchTerm.trim().length >= 2 && !isSearching && candidates.length === 0 && (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">Không tìm thấy người dùng.</div>
                                                )}

                                                {candidates.map((u) => (
                                                    <div key={u.userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={u.avatarUrl || ""} />
                                                                <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white text-sm">
                                                                    {u.fullName?.charAt(0)?.toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{u.fullName}</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            disabled={!!invitingUserId || !/^[0-9a-fA-F-]{36}$/.test(group?.groupId || "")}
                                                            onClick={async () => {
                                                                if (!group?.groupId || !/^[0-9a-fA-F-]{36}$/.test(group.groupId)) return;
                                                                setInvitingUserId(u.userId);
                                                                try {
                                                                    await inviteUserToGroup(group.groupId, [u.userId]);
                                                                    setCandidates(prev => prev.filter(c => c.userId !== u.userId));
                                                                } finally {
                                                                    setInvitingUserId(null);
                                                                }
                                                            }}
                                                        >
                                                            {invitingUserId === u.userId ? "Đang mời..." : "Mời"}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Invite link generator */}
                                            <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Tạo liên kết mời</h4>
                                                <div className="grid grid-cols-2 gap-3 mb-3">
                                                    <div>
                                                        <label className="text-xs text-gray-600 dark:text-gray-400">Thời hạn (giờ)</label>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={expiresInHours}
                                                            onChange={(e) => setExpiresInHours(Number(e.target.value))}
                                                            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-600 dark:text-gray-400">Số lần sử dụng tối đa</label>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={maxUses}
                                                            onChange={(e) => setMaxUses(Number(e.target.value))}
                                                            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="rounded-md bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white text-sm px-4 py-2 disabled:opacity-60"
                                                        disabled={isGenerating || !/^[0-9a-fA-F-]{36}$/.test(group?.groupId || "")}
                                                        onClick={async () => {
                                                            if (!group?.groupId || !/^[0-9a-fA-F-]{36}$/.test(group.groupId)) return;
                                                            setIsGenerating(true);
                                                            try {
                                                                const res = await createGroupInviteLink(group.groupId, { expiresInHours, maxUses });
                                                                if (res.success && res.data?.fullUrl) {
                                                                    setGeneratedLink(res.data.fullUrl);
                                                                    await navigator.clipboard.writeText(res.data.fullUrl);
                                                                }
                                                            } finally {
                                                                setIsGenerating(false);
                                                            }
                                                        }}
                                                    >
                                                        {isGenerating ? "Đang tạo..." : "Tạo liên kết"}
                                                    </button>
                                                    {generatedLink && (
                                                        <input
                                                            value={generatedLink}
                                                            readOnly
                                                            className="flex-1 min-w-0 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
                                                        />
                                                    )}
                                                </div>
                                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Liên kết sẽ chuyển người dùng tới ứng dụng: http://localhost:3000/</p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="edit" className="h-full">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Form chỉnh sửa thông tin nhóm (sẽ gọi API sau).</div>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}


