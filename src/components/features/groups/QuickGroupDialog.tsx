"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Users, Globe, Lock, LogOut, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { getGroupDetails, getGroupMembers, searchUsersForInvite, inviteUserToGroup, createGroupInviteLink, leaveGroup, updateGroupInfo, updateGroupAvatar } from "@/lib/customer-api-client";

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
    onGroupLeft?: () => void; // Callback khi rời khỏi nhóm thành công
}

export function QuickGroupDialog({ open, onOpenChange, group, onGroupLeft }: QuickGroupDialogProps) {


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
    const [isLeaving, setIsLeaving] = useState(false);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string>("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    // We no longer upload avatar separately; handled in the single Save action

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

    const handleLeaveGroup = async () => {
        if (!group?.groupId) return;

        try {
            setIsLeaving(true);
            const response = await leaveGroup(group.groupId);

            if (response.success) {
                toast.success("Đã rời khỏi nhóm thành công");
                onOpenChange(false); // Đóng dialog
                // Gọi callback để refresh danh sách nhóm
                onGroupLeft?.();
            } else {
                toast.error("Không thể rời khỏi nhóm");
            }
        } catch (error) {
            console.error("Error leaving group:", error);
            toast.error("Có lỗi xảy ra khi rời khỏi nhóm");
        } finally {
            setIsLeaving(false);
        }
    };

    const effective = fullInfo || group;
    // Sync edit fields when dialog opens or group data loads
    useEffect(() => {
        if (!open || !effective) return;
        setEditName(effective.groupName || "");
        setEditDescription(effective.description || "");
        setAvatarPreview(effective.avatarUrl || "");
    }, [open, effective?.groupId]);
    const memberCountDisplay = typeof effective.memberCount === "number" && effective.memberCount > 0 ? effective.memberCount : 1;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl h-[640px] p-0 bg-white dark:bg-gray-900">
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

                        <div className="p-3 bg-white/60 dark:bg-gray-800 rounded-lg flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <Users className="h-4 w-4" />
                                <span>Thành viên</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{memberCountDisplay}</span>
                        </div>

                        {/* Leave Group Button */}
                        <Button
                            onClick={handleLeaveGroup}
                            disabled={isLeaving}
                            variant="outline"
                            className="w-full border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            {isLeaving ? "Đang rời khỏi..." : "Rời khỏi nhóm"}
                        </Button>
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

                                <div className="flex-1 overflow-y-hidden">
                                    <TabsContent value="members" className="h-full">
                                        {isLoadingMembers ? (
                                            <div className="flex items-center justify-center h-48 text-sm text-gray-600 dark:text-gray-400">Đang tải thành viên...</div>
                                        ) : members.length === 0 ? (
                                            <div className="flex items-center justify-center h-48 text-sm text-gray-600 dark:text-gray-400">Chưa có thành viên</div>
                                        ) : (
                                            // Members list (scrollable to avoid breaking layout)
                                            <div className="space-y-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 p-2">
                                                {[...members]
                                                    .sort((a, b) => {
                                                        const aw = a.role === "Admin" ? 0 : 1;
                                                        const bw = b.role === "Admin" ? 0 : 1;
                                                        if (aw !== bw) return aw - bw; // Admins first
                                                        return (a.displayName || "").localeCompare(b.displayName || "");
                                                    })
                                                    .map(m => (
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
                                            {/* Invite link generator - moved to the top */}
                                            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
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
                                                                if (res.success && res.data) {
                                                                    const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                                                                    const displayUrl = res.data.invitationCode
                                                                        ? `${appOrigin}/invite/${res.data.invitationCode}`
                                                                        : (res.data.fullUrl || '').replace(/https?:\/\/localhost:\d+/i, appOrigin);
                                                                    setGeneratedLink(displayUrl);
                                                                    if (displayUrl) await navigator.clipboard.writeText(displayUrl);
                                                                }
                                                            } finally {
                                                                setIsGenerating(false);
                                                            }
                                                        }}
                                                    >
                                                        {isGenerating ? "Đang tạo..." : "Tạo liên kết"}
                                                    </button>
                                                    <input
                                                        value={generatedLink}
                                                        placeholder="Tạo liên kết mời bạn bè"
                                                        readOnly
                                                        className="flex-1 min-w-0 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tìm người dùng theo tên hoặc email</label>
                                                <div className="mt-2 relative flex gap-2 items-stretch">
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
                                                    {searchTerm.trim().length >= 2 && candidates.length > 0 && (
                                                        <div className="absolute left-0 right-0 top-full mt-2 z-30 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl max-h-64 overflow-y-auto">
                                                            {candidates.map((u) => (
                                                                <div key={u.userId} className="flex items-center justify-between gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                        <Avatar className="h-7 w-7">
                                                                            <AvatarImage src={u.avatarUrl || ""} />
                                                                            <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white text-xs">
                                                                                {u.fullName?.charAt(0)?.toUpperCase()}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <span className="text-sm text-gray-900 dark:text-white truncate">{u.fullName}</span>
                                                                    </div>
                                                                    <button
                                                                        className="rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
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
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                {(!searchTerm.trim() || searchTerm.trim().length < 2) && !isSearching && candidates.length === 0 && (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">Nhập từ khóa để tìm người dùng.</div>
                                                )}

                                                {searchTerm.trim().length >= 2 && !isSearching && candidates.length === 0 && (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">Không tìm thấy người dùng.</div>
                                                )}
                                                {/* Khi có kết quả, hiển thị trong dropdown phía trên; không render danh sách dài phía dưới */}
                                            </div>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="edit" className="h-full">
                                        <div className="space-y-4 p-1">
                                            {/* Avatar uploader - click on avatar to select */}
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 text-center">Ảnh đại diện nhóm</label>
                                                <div className="flex justify-center">
                                                    <div className="relative group cursor-pointer" onClick={() => document.getElementById('group-avatar-input')?.click()}>
                                                        <Avatar className="h-20 w-20 ring-4 ring-gray-200 dark:ring-gray-700">
                                                            <AvatarImage src={avatarPreview || ""} />
                                                            <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white font-semibold text-xl">
                                                                {editName?.charAt(0)?.toUpperCase() || "G"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Camera className="h-6 w-6 text-white" />
                                                        </div>
                                                    </div>

                                                    <input
                                                        id="group-avatar-input"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0] || null;
                                                            if (!file) return;
                                                            setAvatarFile(file);
                                                            const reader = new FileReader();
                                                            reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
                                                            reader.readAsDataURL(file);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tên nhóm</label>
                                                <Input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    placeholder="Nhập tên nhóm"
                                                    maxLength={20}
                                                    className="transition-all duration-200 focus:ring-2 focus:ring-[#ad46ff]/20 focus:border-[#ad46ff] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                                />
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {editName.length}/20 ký tự
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Mô tả</label>
                                                <Textarea
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    placeholder="Nhập mô tả nhóm"
                                                    maxLength={200}
                                                    className="min-h-[100px] resize-none transition-all duration-200 focus:ring-2 focus:ring-[#ad46ff]/20 focus:border-[#ad46ff] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                                />
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {editDescription.length}/200 ký tự
                                                </p>
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setEditName(effective.groupName || "");
                                                        setEditDescription(effective.description || "");
                                                        setAvatarPreview(effective.avatarUrl || "");
                                                        setAvatarFile(null);
                                                    }}
                                                >
                                                    Đặt lại
                                                </Button>
                                                <Button
                                                    onClick={async () => {
                                                        if (!effective?.groupId) return;
                                                        if (!editName.trim()) { toast.error("Vui lòng nhập tên nhóm"); return; }
                                                        if (editName.length > 20) { toast.error("Tên nhóm không được vượt quá 20 ký tự"); return; }
                                                        if (editDescription.length > 200) { toast.error("Mô tả không được vượt quá 200 ký tự"); return; }
                                                        try {
                                                            setIsSavingEdit(true);
                                                            let newAvatarUrl = effective.avatarUrl;
                                                            let hasNameOrDescriptionChange = false;

                                                            // If avatar selected, upload avatar first (so we can broadcast one update)
                                                            if (avatarFile) {
                                                                const avatarRes = await updateGroupAvatar(effective.groupId, avatarFile);
                                                                if (avatarRes?.success) {
                                                                    newAvatarUrl = avatarRes.data?.avatarUrl || avatarPreview;
                                                                    setAvatarPreview(newAvatarUrl);
                                                                    setFullInfo(prev => prev ? { ...prev, avatarUrl: newAvatarUrl } : prev);
                                                                } else {
                                                                    toast.error(avatarRes?.message || "Không thể cập nhật ảnh nhóm");
                                                                    return;
                                                                }
                                                            }

                                                            // Check if name or description changed
                                                            const nameChanged = editName.trim() !== (effective.groupName || "");
                                                            const descChanged = editDescription !== (effective.description || "");
                                                            hasNameOrDescriptionChange = nameChanged || descChanged;

                                                            const res = await updateGroupInfo(effective.groupId, {
                                                                groupName: editName.trim(),
                                                                description: editDescription?.trim() || ""
                                                            });
                                                            if (res?.success) {
                                                                // Only show success toast if name or description changed
                                                                if (hasNameOrDescriptionChange) {
                                                                    toast.success("Cập nhật nhóm thành công");
                                                                }
                                                                // Update local state so UI reflects changes immediately
                                                                setFullInfo(prev => prev ? { ...prev, groupName: editName.trim(), description: editDescription } : prev);
                                                                // Notify other UI parts (sidebar, headers) to update without reload
                                                                window.dispatchEvent(new CustomEvent('groupInfoUpdated', {
                                                                    detail: {
                                                                        groupId: effective.groupId,
                                                                        groupName: editName.trim(),
                                                                        description: editDescription,
                                                                        avatarUrl: newAvatarUrl
                                                                    }
                                                                }));
                                                            } else {
                                                                toast.error(res?.message || "Không thể cập nhật nhóm");
                                                            }
                                                        } catch (err) {
                                                            toast.error("Có lỗi khi cập nhật nhóm");
                                                        } finally {
                                                            setIsSavingEdit(false);
                                                        }
                                                    }}
                                                    disabled={isSavingEdit}
                                                >
                                                    {isSavingEdit ? "Đang lưu..." : "Lưu thay đổi"}
                                                </Button>
                                            </div>
                                        </div>
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


