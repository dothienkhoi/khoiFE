"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users, Settings, Edit, UserPlus, Copy, Trash2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { getGroupDetails, getGroupMembers, updateGroup, leaveGroup, searchUsersForInvite, createGroupInviteLink, inviteUserToGroup, transferAndLeaveGroup, updateMemberRole, updateGroupAvatar, uploadStagingAvatar } from "@/lib/customer-api-client";
import { GroupMember } from "@/types/customer.types";
import { useProfile } from "@/components/providers/ProfileProvider";
import { handleApiError } from "@/lib/utils";

interface Community {
    id: string;
    name: string;
    description: string;
    avatarUrl?: string;
    memberCount: number;
    isAdmin: boolean;
}

// Sử dụng GroupMember từ types thay vì interface riêng

interface CommunitySettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    community: Community | null;
}

export function CommunitySettingsDialog({ open, onOpenChange, community }: CommunitySettingsDialogProps) {
    const [activeTab, setActiveTab] = useState("details");
    const { userProfile } = useProfile();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nameError, setNameError] = useState<string>("");
    const [descError, setDescError] = useState<string>("");
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [groupDetails, setGroupDetails] = useState<any>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [showTransferDialog, setShowTransferDialog] = useState(false);
    const [selectedNewAdmin, setSelectedNewAdmin] = useState<string>("");
    const [inviteCandidates, setInviteCandidates] = useState<any[]>([]);
    const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
    const [friendSearchTerm, setFriendSearchTerm] = useState("");
    const [inviteLink, setInviteLink] = useState<string>("");
    const [expiresInHours, setExpiresInHours] = useState<number>(24);
    const [maxUses, setMaxUses] = useState<number>(10);
    const [invitingUsers, setInvitingUsers] = useState<Set<string>>(new Set());

    // Load group details and members when dialog opens and community changes
    useEffect(() => {
        if (open && community) {
            loadGroupDetails();
            setEditName(community.name);
            setEditDescription(community.description);
        }
    }, [open, community]);

    const loadGroupDetails = async () => {
        if (!community) return;

        setIsLoadingDetails(true);
        try {
            const response = await getGroupDetails(community.id);
            if (response.success && response.data) {
                setGroupDetails(response.data);
                // Cập nhật members từ group details
                if (response.data.members && Array.isArray(response.data.members)) {
                    setMembers(response.data.members);
                }
                // Cập nhật thông tin edit nếu có
                if (response.data.groupName) {
                    setEditName(response.data.groupName);
                }
                if (response.data.description) {
                    setEditDescription(response.data.description);
                }
            } else {
                throw new Error(response.message || "Không thể tải thông tin nhóm");
            }
        } catch (error) {
            console.error("Error loading group details:", error);
            handleApiError(error, "Không thể tải thông tin nhóm");
            setGroupDetails(null);
            setMembers([]);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const loadMembers = async () => {
        if (!community) return;

        setIsLoadingMembers(true);
        try {
            const response = await getGroupMembers(community.id);
            if (response.success && response.data) {
                // Đảm bảo response.data là array
                const membersData = Array.isArray(response.data) ? response.data : [];
                setMembers(membersData);
            } else {
                throw new Error(response.message || "Không thể tải danh sách thành viên");
            }
        } catch (error) {
            console.error("Error loading members:", error);
            handleApiError(error, "Không thể tải danh sách thành viên");
            // Set empty array khi có lỗi
            setMembers([]);
        } finally {
            setIsLoadingMembers(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!community) return;

        // Basic validation
        const nameTrim = editName.trim();
        const descTrim = editDescription.trim();
        if (!nameTrim) {
            setNameError("Tên cộng đồng không được để trống");
            toast.error("Vui lòng nhập tên cộng đồng");
            return;
        }
        if (!descTrim) {
            setDescError("Mô tả không được để trống");
            toast.error("Vui lòng nhập mô tả");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await updateGroup(community.id, {
                name: nameTrim,
                description: descTrim
            });

            if (response.success) {
            toast.success("Cập nhật cộng đồng thành công!");
                // Cập nhật ngay UI trong dialog
                setGroupDetails((prev: any) => prev ? { ...prev, groupName: nameTrim, description: descTrim } : { groupName: nameTrim, description: descTrim });
            setIsEditing(false);
                // Thông báo cho sidebar/ các view khác làm mới
                window.dispatchEvent(new CustomEvent('communities:refresh', {
                    detail: {
                        groupId: community.id,
                        updated: { groupName: nameTrim, description: descTrim }
                    }
                }));
                window.dispatchEvent(new CustomEvent('group:updated', {
                    detail: {
                        groupId: community.id,
                        groupName: nameTrim,
                        description: descTrim
                    }
                }));
                // Update community name in parent component if needed
                // You might want to add a callback prop to notify parent component
            } else {
                throw new Error(response.message || "Không thể cập nhật cộng đồng");
            }
        } catch (error) {
            console.error("Error updating community:", error);
            handleApiError(error, "Không thể cập nhật cộng đồng");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa thành viên này?")) return;

        try {
            // Note: removeMemberFromGroup function was removed, this functionality is not available
            toast.error("Chức năng xóa thành viên không khả dụng");
            return;
        } catch (error) {
            console.error("Error removing member:", error);
            handleApiError(error, "Không thể xóa thành viên");
        }
    };

    const handleLeaveGroup = async () => {
        if (!community) return;

        // Kiểm tra nếu user hiện tại là admin cuối cùng
        const adminMembers = members.filter(m => m.role.toLowerCase() === "admin");
        const currentUserId = (userProfile as any)?.id || (userProfile as any)?.userId;
        const isLastAdmin = adminMembers.length === 1 && adminMembers[0].userId === currentUserId;

        if (isLastAdmin) {
            // Nếu là admin cuối cùng, hiển thị dialog chuyển quyền
            setShowTransferDialog(true);
            return;
        }

        if (!confirm("Bạn có chắc chắn muốn rời khỏi nhóm này?")) return;

        try {
            const response = await leaveGroup(community.id);

            if (response.success) {
                toast.success("Đã rời khỏi nhóm thành công!");
                // Đóng dialog và refresh danh sách communities
                onOpenChange(false);
                // Dispatch event để refresh sidebar
                window.dispatchEvent(new CustomEvent('communities:refresh'));
            } else {
                throw new Error(response.message || "Không thể rời khỏi nhóm");
            }
        } catch (error) {
            console.error("Error leaving group:", error);
            handleApiError(error, "Không thể rời khỏi nhóm");
        }
    };

    const handleTransferAndLeave = async () => {
        if (!community || !selectedNewAdmin) return;

        try {
            const response = await transferAndLeaveGroup(community.id, selectedNewAdmin);

            if (response.success) {
                toast.success("Đã chuyển quyền và rời nhóm thành công!");
                setShowTransferDialog(false);
                onOpenChange(false);
                window.dispatchEvent(new CustomEvent('communities:refresh'));
            } else {
                throw new Error(response.message || "Không thể chuyển quyền và rời nhóm");
            }
        } catch (error) {
            console.error("Error transferring and leaving group:", error);
            handleApiError(error, "Không thể chuyển quyền và rời nhóm");
        }
    };

    const handleUpdateMemberRole = async (memberId: string, action: string) => {
        if (!community) return;

        try {
            const response = await updateMemberRole(community.id, memberId, action as any);
            if (response.success) {
                toast.success(`Đã ${action === "add_admin_role" ? "thêm" : "xóa"} quyền admin thành công!`);
                await loadGroupDetails();
            } else {
                throw new Error(response.message || "Không thể cập nhật vai trò thành viên");
            }
        } catch (error) {
            console.error("Error updating member role:", error);
            handleApiError(error, "Không thể cập nhật vai trò thành viên");
        }
    };

    const handleSearchFriends = async (searchTerm: string) => {
        if (!community || !searchTerm.trim()) {
            setInviteCandidates([]);
            return;
        }

        setIsLoadingCandidates(true);
        try {
            const response = await searchUsersForInvite(community.id, searchTerm);
            if (response.success && response.data) {
                setInviteCandidates(response.data);
            } else {
                setInviteCandidates([]);
            }
        } catch (error) {
            console.error("Error searching friends:", error);
            handleApiError(error, "Không thể tìm kiếm bạn bè");
            setInviteCandidates([]);
        } finally {
            setIsLoadingCandidates(false);
        }
    };

    const handleCreateInviteLink = async () => {
        if (!community) return;

        try {
            console.log("Creating invite link with params:", {
                groupId: community.id,
                expiresInHours,
                maxUses
            });

            const response = await createGroupInviteLink(community.id, { expiresInHours, maxUses });
            console.log("Create invite link response:", response);

            if (response.success && response.data) {
                // Sử dụng fullUrl từ response
                const link = response.data.fullUrl;
                console.log("Extracted link:", link);

                if (link) {
                    setInviteLink(link);
                    toast.success("Đã tạo link mời thành công!");
                } else {
                    console.error("No link found in response:", response.data);
                    toast.error("Không thể lấy link từ response");
                }
            } else {
                throw new Error(response.message || "Không thể tạo link mời");
            }
        } catch (error) {
            console.error("Error creating invite link:", error);
            handleApiError(error, "Không thể tạo link mời");
        }
    };

    const handleCopyInviteLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            toast.success("Đã sao chép link mời!");
        }
    };

    const handleInviteUser = async (userId: string) => {
        if (!community) return;

        // Thêm user vào set đang gửi lời mời
        setInvitingUsers(prev => new Set(prev).add(userId));

        try {
            console.log(`[UI] Starting invite process for user ${userId} to group ${community.id}`);

            const response = await inviteUserToGroup(community.id, [userId]);

            if (response.success) {
                toast.success("Đã gửi lời mời thành công!");
                // Xóa user khỏi danh sách candidates sau khi mời thành công
                setInviteCandidates(prev => prev.filter(candidate => candidate.userId !== userId));
                console.log(`[UI] Successfully invited user ${userId}`);
            } else {
                throw new Error(response.message || "Không thể gửi lời mời");
            }
        } catch (error: any) {
            console.error("Error sending invitation:", error);

            // Check if it's a timeout error
            const isTimeout = error?.code === 'ECONNABORTED' || error?.message?.includes('timeout');

            if (isTimeout) {
                toast.error("Lời mời đang được xử lý, vui lòng chờ một chút...", {
                    description: "Có thể mất vài phút để hoàn thành. Bạn có thể thử lại sau."
                });
            } else {
                handleApiError(error, "Không thể gửi lời mời");
            }
        } finally {
            // Xóa user khỏi set đang gửi lời mời
            setInvitingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    };

    const filteredMembers = Array.isArray(members) ? members.filter(member =>
        member.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    if (!community) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl w-[680px] max-h-[85vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        <Settings className="h-5 w-5" />
                        <span>Cài đặt cộng đồng: {community.name}</span>
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="details">Chi tiết</TabsTrigger>
                        <TabsTrigger value="members">Thành viên</TabsTrigger>
                        <TabsTrigger value="edit">Chỉnh sửa</TabsTrigger>
                        <TabsTrigger value="invite">Thêm thành viên</TabsTrigger>
                    </TabsList>

                    {/* Scrollable area to keep dialog size stable */}
                    <div className="h-[60vh] overflow-y-auto pr-2">
                    {/* Tab: Chi tiết cộng đồng */}
                    <TabsContent value="details" className="space-y-4">
                            {isLoadingDetails ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : (
                                <>
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-20 w-20">
                                            <AvatarImage src={groupDetails?.groupAvatarUrl || community.avatarUrl} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-2xl">
                                                {(groupDetails?.groupName || community.name).charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                                            <h3 className="text-xl font-semibold">
                                                {groupDetails?.groupName || community.name}
                                            </h3>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                                {groupDetails?.description || community.description}
                                            </p>
                                </div>
                            </div>

                                    {/* Nút rời khỏi nhóm */}
                                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <Button
                                            variant="destructive"
                                            onClick={handleLeaveGroup}
                                            className="w-full"
                                        >
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Rời khỏi nhóm
                                        </Button>
                        </div>

                                </>
                            )}
                    </TabsContent>

                    {/* Tab: Thành viên cộng đồng */}
                    <TabsContent value="members" className="space-y-4">
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Tìm kiếm thành viên..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        <div className="space-y-3">
                                {isLoadingMembers ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                        <span className="ml-2 text-gray-500">Đang tải danh sách thành viên...</span>
                                    </div>
                                ) : !Array.isArray(members) || filteredMembers.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        {searchTerm ? "Không tìm thấy thành viên nào" : "Chưa có thành viên nào"}
                                    </div>
                                ) : (
                                    <ScrollArea className="h-64 w-full">
                                        <div className="space-y-2 pr-4">
                            {filteredMembers.map((member) => (
                                                <div key={member.userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={member.avatarUrl} />
                                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                                                {member.fullName.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div>
                                                            <p className="font-medium">{member.fullName}</p>
                                                            {member.joinedAt && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Tham gia {new Date(member.joinedAt).toLocaleDateString('vi-VN')}
                                            </p>
                                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                                        <Badge variant={member.role.toLowerCase() === "admin" ? "default" : "secondary"}>
                                                            {member.role.toLowerCase() === "admin" ? "Quản trị viên" : "Thành viên"}
                                        </Badge>

                                                        {community.isAdmin && (
                                                            <div className="flex items-center space-x-1">
                                                                {/* Nút quản lý vai trò */}
                                                                {member.role.toLowerCase() === "admin" ? (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleUpdateMemberRole(member.userId, "remove_admin_role")}
                                                                        className="text-orange-600 hover:text-orange-700"
                                                                        title="Xóa quyền admin"
                                                                    >
                                                                        <Users className="h-4 w-4" />
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleUpdateMemberRole(member.userId, "add_admin_role")}
                                                                        className="text-blue-600 hover:text-blue-700"
                                                                        title="Thêm quyền admin"
                                                                    >
                                                                        <Users className="h-4 w-4" />
                                                                    </Button>
                                                                )}

                                                                {/* Nút xóa thành viên (chỉ cho member) */}
                                                                {member.role.toLowerCase() !== "admin" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                                        onClick={() => handleRemoveMember(member.userId)}
                                                className="text-red-600 hover:text-red-700"
                                                                        title="Xóa thành viên"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                                                )}
                                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                        </div>
                    </TabsContent>

                    {/* Tab: Chỉnh sửa cộng đồng */}
                        <TabsContent value="edit" className="space-y-6">
                        {!isEditing ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-medium">Thông tin cộng đồng</h4>
                                    <Button onClick={() => setIsEditing(true)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Chỉnh sửa
                                    </Button>
                                </div>
                            </div>
                        ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur z-10 py-2">
                                    <h4 className="text-lg font-medium">Chỉnh sửa thông tin</h4>
                                    <div className="space-x-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsEditing(false)}
                                            disabled={isSubmitting}
                                        >
                                            Hủy
                                        </Button>
                                        <Button
                                            onClick={handleSaveChanges}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                                        </Button>
                                    </div>
                                </div>

                                    <div className="space-y-5">
                                    <div>
                                            <Label className="text-sm font-medium mb-2 block">Ảnh đại diện nhóm</Label>
                                            <div className="flex items-center gap-4 flex-wrap">
                                                <Avatar className="h-20 w-20">
                                                    <AvatarImage src={groupDetails?.groupAvatarUrl || community.avatarUrl} />
                                                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-2xl">
                                                        {(groupDetails?.groupName || community.name).charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex items-center gap-2">
                                                    <input type="file" accept="image/*" id="group-avatar-input" className="hidden" onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file || !community) return;
                                                        try {
                                                            // Tùy chọn: upload staging để preview nhanh
                                                            try {
                                                                const tmp = await uploadStagingAvatar(file, 'group');
                                                                if (tmp.success && tmp.data?.fileUrl) {
                                                                    // cập nhật preview tạm
                                                                    setGroupDetails((prev: any) => prev ? { ...prev, groupAvatarUrl: tmp.data.fileUrl } : prev);
                                                                }
                                                            } catch { /* ignore preview errors */ }

                                                            const res = await updateGroupAvatar(community.id, file);
                                                            if (res.success) {
                                                                toast.success('Cập nhật ảnh đại diện nhóm thành công!');
                                                                // Cập nhật ngay UI + phát sự kiện đồng bộ
                                                                if (res.data?.avatarUrl) {
                                                                    setGroupDetails((prev: any) => prev ? { ...prev, groupAvatarUrl: res.data.avatarUrl } : prev);
                                                                    window.dispatchEvent(new CustomEvent('communities:refresh', {
                                                                        detail: { groupId: community.id, updated: { avatarUrl: res.data.avatarUrl } }
                                                                    }));
                                                                    window.dispatchEvent(new CustomEvent('group:updated', {
                                                                        detail: { groupId: community.id, avatarUrl: res.data.avatarUrl }
                                                                    }));
                                                                }
                                                                await loadGroupDetails();
                                                            } else {
                                                                toast.error(res.message || 'Không thể cập nhật ảnh nhóm');
                                                            }
                                                        } catch (err) {
                                                            handleApiError(err, 'Không thể cập nhật ảnh nhóm');
                                                        }
                                                    }} />
                                                    <Button variant="outline" size="sm" onClick={() => document.getElementById('group-avatar-input')?.click()}>
                                                        Chọn ảnh
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                        <Label htmlFor="edit-name">Tên cộng đồng</Label>
                                        <Input
                                            id="edit-name"
                                            value={editName}
                                                onChange={(e) => { setEditName(e.target.value); setNameError(""); }}
                                                placeholder="Nhập tên cộng đồng"
                                        />
                                            {nameError && (
                                                <p className="mt-1 text-sm text-red-500">{nameError}</p>
                                            )}
                                    </div>
                                        <div className="space-y-2">
                                        <Label htmlFor="edit-description">Mô tả</Label>
                                        <Textarea
                                            id="edit-description"
                                            value={editDescription}
                                                onChange={(e) => { setEditDescription(e.target.value); setDescError(""); }}
                                            rows={3}
                                                placeholder="Nhập mô tả"
                                        />
                                            {descError && (
                                                <p className="mt-1 text-sm text-red-500">{descError}</p>
                                            )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* Tab: Thêm thành viên */}
                        <TabsContent value="invite" className="space-y-6">
                            <div className="space-y-6">
                            <div>
                                    <h4 className="text-lg font-medium mb-4">Mời thành viên mới</h4>

                                    {/* Tạo link mời */}
                                    <div className="p-5 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-5 border border-gray-200 dark:border-gray-700">
                                        <div className="space-y-3">
                                            <h5 className="text-sm font-medium">Tạo link mời</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="expires-hours">Thời hạn (giờ)</Label>
                                                    <Input
                                                        id="expires-hours"
                                                        type="number"
                                                        value={expiresInHours}
                                                        onChange={(e) => setExpiresInHours(Number(e.target.value))}
                                                        min="0"
                                                        placeholder="24"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="max-uses">Số lần sử dụng tối đa</Label>
                                                    <Input
                                                        id="max-uses"
                                                        type="number"
                                                        value={maxUses}
                                                        onChange={(e) => setMaxUses(Number(e.target.value))}
                                                        min="0"
                                                        placeholder="10"
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                onClick={handleCreateInviteLink}
                                                className="w-full mt-1"
                                            >
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                Tạo link mời
                                            </Button>
                                        </div>

                                        {/* Hiển thị link mời */}
                                        {inviteLink && (
                                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                    <div className="min-w-0">
                                            <p className="text-sm font-medium mb-1">Link mời tham gia</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 break-all">
                                                            {inviteLink}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCopyInviteLink}
                                        >
                                            <Copy className="h-4 w-4 mr-2" />
                                            Sao chép
                                        </Button>
                                    </div>
                                            </div>
                                        )}

                                </div>
                            </div>

                            {/* Tìm kiếm bạn bè */}
                                <div className="space-y-3">
                                    <h5 className="text-md font-medium">Tìm bạn bè để mời</h5>
                                <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Tìm kiếm bạn bè..."
                                            value={friendSearchTerm}
                                            onChange={(e) => {
                                                setFriendSearchTerm(e.target.value);
                                                handleSearchFriends(e.target.value);
                                            }}
                                        className="pl-10"
                                    />
                                </div>

                                    {/* Hiển thị kết quả tìm kiếm */}
                                    <div className="mt-2">
                                        {isLoadingCandidates ? (
                                            <div className="flex items-center justify-center py-10">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                <span className="ml-2 text-gray-500">Đang tìm kiếm...</span>
                                            </div>
                                        ) : inviteCandidates.length > 0 ? (
                                            <ScrollArea className="h-64 w-full">
                                                <div className="space-y-3 pr-4">
                                                    {inviteCandidates.map((candidate) => (
                                                        <div key={candidate.userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                            <div className="flex items-center space-x-3">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={candidate.avatarUrl} />
                                                                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">
                                                                        {candidate.fullName.charAt(0).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="min-w-0">
                                                                    <p className="font-medium text-sm truncate max-w-[200px]">{candidate.fullName}</p>
                                                                    {candidate.email && (
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                                                            {candidate.email}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleInviteUser(candidate.userId)}
                                                                disabled={invitingUsers.has(candidate.userId)}
                                                                className="min-w-[96px]"
                                                            >
                                                                {invitingUsers.has(candidate.userId) ? (
                                                                    <>
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-1"></div>
                                                                        Đang mời
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <UserPlus className="h-4 w-4 mr-1" />
                                                                        Mời
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        ) : friendSearchTerm ? (
                                            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                                                <UserPlus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Không tìm thấy bạn bè nào
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                                    <UserPlus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Nhập tên để tìm kiếm bạn bè
                                    </p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>

            {/* Dialog chuyển quyền admin */}
            <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Chuyển quyền admin</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Bạn là admin cuối cùng của nhóm. Vui lòng chọn thành viên để chuyển quyền admin trước khi rời khỏi nhóm.
                        </p>

                        <div>
                            <Label htmlFor="new-admin">Chọn admin mới</Label>
                            <select
                                id="new-admin"
                                value={selectedNewAdmin}
                                onChange={(e) => setSelectedNewAdmin(e.target.value)}
                                className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                            >
                                <option value="">-- Chọn thành viên --</option>
                                {members
                                    .filter(member => member.role.toLowerCase() !== "admin")
                                    .map(member => (
                                        <option key={member.userId} value={member.userId}>
                                            {member.fullName}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div className="flex space-x-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowTransferDialog(false)}
                                className="flex-1"
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleTransferAndLeave}
                                disabled={!selectedNewAdmin}
                                className="flex-1"
                            >
                                Chuyển quyền và rời nhóm
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
