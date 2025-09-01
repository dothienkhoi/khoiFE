"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Settings, Edit, UserPlus, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Community {
    id: string;
    name: string;
    description: string;
    avatarUrl?: string;
    memberCount: number;
    isAdmin: boolean;
}

interface CommunityMember {
    id: string;
    name: string;
    avatarUrl?: string;
    role: "admin" | "member";
    joinedAt: string;
}

interface CommunitySettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    community: Community | null;
}

export function CommunitySettingsDialog({ open, onOpenChange, community }: CommunitySettingsDialogProps) {
    const [activeTab, setActiveTab] = useState("details");
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mock members data
    const [members] = useState<CommunityMember[]>([
        {
            id: "1",
            name: "Nguyễn Văn A",
            avatarUrl: "/api/placeholder/32/32",
            role: "admin",
            joinedAt: "2024-01-01"
        },
        {
            id: "2",
            name: "Trần Thị B",
            avatarUrl: "/api/placeholder/32/32",
            role: "member",
            joinedAt: "2024-01-15"
        },
        {
            id: "3",
            name: "Lê Văn C",
            avatarUrl: "/api/placeholder/32/32",
            role: "member",
            joinedAt: "2024-02-01"
        }
    ]);

    // Initialize edit form when community changes
    useState(() => {
        if (community) {
            setEditName(community.name);
            setEditDescription(community.description);
        }
    });

    const handleSaveChanges = async () => {
        if (!community) return;

        setIsSubmitting(true);
        try {
            // TODO: Gọi API cập nhật cộng đồng
            // await updateCommunity(community.id, { name: editName, description: editDescription });

            toast.success("Cập nhật cộng đồng thành công!");
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating community:", error);
            toast.error("Không thể cập nhật cộng đồng. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyInviteLink = () => {
        const inviteLink = `${window.location.origin}/invite/community/${community?.id}`;
        navigator.clipboard.writeText(inviteLink);
        toast.success("Đã sao chép link mời!");
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa thành viên này?")) return;

        try {
            // TODO: Gọi API xóa thành viên
            // await removeMemberFromCommunity(community!.id, memberId);

            toast.success("Đã xóa thành viên khỏi cộng đồng!");
        } catch (error) {
            console.error("Error removing member:", error);
            toast.error("Không thể xóa thành viên. Vui lòng thử lại.");
        }
    };

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!community) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
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

                    {/* Tab: Chi tiết cộng đồng */}
                    <TabsContent value="details" className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={community.avatarUrl} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-2xl">
                                    {community.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                                <h3 className="text-xl font-semibold">{community.name}</h3>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    {community.description}
                                </p>
                                <div className="flex items-center space-x-4 mt-3">
                                    <div className="flex items-center space-x-1">
                                        <Users className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {community.memberCount} thành viên
                                        </span>
                                    </div>
                                    <Badge variant="secondary">
                                        {community.isAdmin ? "Quản trị viên" : "Thành viên"}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab: Thành viên cộng đồng */}
                    <TabsContent value="members" className="space-y-4">
                        <div className="space-y-3">
                            {filteredMembers.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={member.avatarUrl} />
                                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                                {member.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div>
                                            <p className="font-medium">{member.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Tham gia {new Date(member.joinedAt).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                                            {member.role === "admin" ? "Quản trị viên" : "Thành viên"}
                                        </Badge>

                                        {community.isAdmin && member.role !== "admin" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRemoveMember(member.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Tab: Chỉnh sửa cộng đồng */}
                    <TabsContent value="edit" className="space-y-4">
                        {!isEditing ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-medium">Thông tin cộng đồng</h4>
                                    <Button onClick={() => setIsEditing(true)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Chỉnh sửa
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-sm font-medium">Tên cộng đồng</Label>
                                        <p className="text-gray-900 dark:text-white">{community.name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Mô tả</Label>
                                        <p className="text-gray-600 dark:text-gray-400">{community.description}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
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

                                <div className="space-y-3">
                                    <div>
                                        <Label htmlFor="edit-name">Tên cộng đồng</Label>
                                        <Input
                                            id="edit-name"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-description">Mô tả</Label>
                                        <Textarea
                                            id="edit-description"
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* Tab: Thêm thành viên */}
                    <TabsContent value="invite" className="space-y-4">
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-lg font-medium mb-3">Mời thành viên mới</h4>

                                {/* Link mời */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium mb-1">Link mời tham gia</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Chia sẻ link này để mời bạn bè tham gia cộng đồng
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
                            </div>

                            {/* Tìm kiếm bạn bè */}
                            <div>
                                <h5 className="text-md font-medium mb-3">Tìm bạn bè để mời</h5>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Tìm kiếm bạn bè..."
                                        className="pl-10"
                                    />
                                </div>

                                <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                                    <UserPlus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Tính năng tìm kiếm bạn bè đang được phát triển
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
