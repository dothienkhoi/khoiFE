"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Users,
    Calendar,
    Lock,
    Globe,
    MessageCircle,
    X,
    Edit3,
    UserPlus,
    Link,
    Crown,
    User,
    Trash2,
    Settings
} from "lucide-react";
import { ChatGroup } from "@/types/customer.types";
import { cn } from "@/lib/utils";

interface GroupInfoModalProps {
    group: ChatGroup;
    isOpen: boolean;
    onClose: () => void;
}

interface GroupMember {
    id: string;
    displayName: string;
    avatarUrl?: string;
    role: 'admin' | 'member';
    isOnline: boolean;
    joinedAt: string;
}

export function GroupInfoModal({ group, isOpen, onClose }: GroupInfoModalProps) {
    const [activeTab, setActiveTab] = useState("info");
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: group.name || group.groupName || "",
        description: group.description || "",
        isPrivate: group.isPrivate
    });

    // Mock data - sẽ được thay thế bằng API call thật
    const mockMembers: GroupMember[] = [
        {
            id: "1",
            displayName: "Nguyễn Văn A",
            role: "admin",
            isOnline: true,
            joinedAt: "2025-01-01"
        },
        {
            id: "2",
            displayName: "Trần Thị B",
            role: "member",
            isOnline: false,
            joinedAt: "2025-01-02"
        }
    ];

    // Lấy tên nhóm từ các field có thể có
    const groupName = group.name || group.groupName || "Nhóm không tên";

    // Lấy avatar nhóm
    const groupAvatar = group.avatarUrl || group.groupAvatarUrl;

    // Tạo initials từ tên nhóm
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Format ngày tạo
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return "Không xác định";
        }
    };

    // Handle edit form changes
    const handleEditChange = (field: string, value: string | boolean) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    // Handle save changes
    const handleSaveChanges = () => {
        // TODO: Implement API call to update group
        setIsEditing(false);
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        setEditForm({
            name: group.name || group.groupName || "",
            description: group.description || "",
            isPrivate: group.isPrivate
        });
        setIsEditing(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl font-bold">
                        Thông tin chi tiết nhóm
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="info">Thông tin</TabsTrigger>
                        <TabsTrigger value="members">Thành viên</TabsTrigger>
                        <TabsTrigger value="invite">Mời bạn</TabsTrigger>
                        <TabsTrigger value="edit">Chỉnh sửa</TabsTrigger>
                    </TabsList>

                    {/* Tab: Thông tin nhóm */}
                    <TabsContent value="info" className="space-y-6 mt-6">
                        {/* Header nhóm */}
                        <div className="text-center">
                            <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-gray-200 dark:ring-gray-700">
                                <AvatarImage src={groupAvatar} />
                                <AvatarFallback className="bg-gradient-to-r from-[#1447e6] to-[#ad46ff] text-white font-bold text-3xl">
                                    {getInitials(groupName)}
                                </AvatarFallback>
                            </Avatar>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {groupName}
                            </h3>
                            {group.description && (
                                <p className="text-gray-600 dark:text-gray-400 text-base max-w-md mx-auto">
                                    {group.description}
                                </p>
                            )}
                        </div>

                        {/* Thông tin cơ bản */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-gray-500" />
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">Số thành viên</span>
                                </div>
                                <Badge variant="secondary" className="bg-[#1447e6] text-white text-sm px-3 py-1">
                                    {group.memberCount || 1}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-gray-500" />
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">Ngày tạo</span>
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {formatDate(group.createdAt)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <MessageCircle className="h-5 w-5 text-gray-500" />
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">Tin nhắn chưa đọc</span>
                                </div>
                                {group.unreadCount > 0 ? (
                                    <Badge variant="destructive" className="text-sm px-3 py-1">
                                        {group.unreadCount}
                                    </Badge>
                                ) : (
                                    <span className="text-sm text-gray-500">Không có</span>
                                )}
                            </div>

                            {/* Loại nhóm */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-3 mb-3">
                                    {group.isPrivate ? (
                                        <Lock className="h-5 w-5 text-orange-500" />
                                    ) : (
                                        <Globe className="h-5 w-5 text-green-500" />
                                    )}
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                                        Loại nhóm
                                    </span>
                                </div>
                                <Badge
                                    variant={group.isPrivate ? "secondary" : "default"}
                                    className={cn(
                                        group.isPrivate
                                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                                            : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                    )}
                                >
                                    {group.isPrivate ? "🔒 Nhóm riêng tư" : "🌍 Nhóm công khai"}
                                </Badge>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab: Danh sách thành viên */}
                    <TabsContent value="members" className="space-y-4 mt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold">Thành viên nhóm</h4>
                            <Badge variant="outline" className="text-sm">
                                {mockMembers.length} thành viên
                            </Badge>
                        </div>

                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {mockMembers.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={member.avatarUrl} />
                                            <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white text-sm">
                                                {member.displayName.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {member.displayName}
                                                </span>
                                                {member.role === 'admin' && (
                                                    <Crown className="h-4 w-4 text-yellow-500" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-xs px-2 py-1",
                                                        member.role === 'admin'
                                                            ? "border-yellow-300 text-yellow-700"
                                                            : "border-gray-300 text-gray-700"
                                                    )}
                                                >
                                                    {member.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                                                </Badge>
                                                <div className="flex items-center gap-1">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        member.isOnline ? "bg-green-500" : "bg-gray-400"
                                                    )} />
                                                    <span>
                                                        {member.isOnline ? "Đang hoạt động" : "Không hoạt động"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Admin actions */}
                                    {member.role === 'admin' && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                                                title="Chỉnh sửa vai trò"
                                            >
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                                title="Xóa thành viên"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Tab: Mời bạn bè */}
                    <TabsContent value="invite" className="space-y-6 mt-6">
                        <div className="text-center mb-6">
                            <h4 className="text-lg font-semibold mb-2">Mời bạn bè vào nhóm</h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Chia sẻ nhóm với bạn bè hoặc tạo link mời
                            </p>
                        </div>

                        {/* Mời trực tiếp */}
                        <div className="space-y-4">
                            <h5 className="font-medium text-gray-900 dark:text-white">Mời trực tiếp</h5>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Tìm kiếm bạn bè..."
                                    className="flex-1"
                                />
                                <Button size="sm" className="bg-[#1447e6] hover:bg-[#1447e6]/90">
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Mời
                                </Button>
                            </div>
                        </div>

                        {/* Link mời */}
                        <div className="space-y-4">
                            <h5 className="font-medium text-gray-900 dark:text-white">Link mời</h5>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-2 mb-3">
                                    <Link className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Link mời hiện tại</span>
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        value="https://fastbite.group/invite/abc123"
                                        readOnly
                                        className="flex-1 text-sm"
                                    />
                                    <Button variant="outline" size="sm">
                                        Sao chép
                                    </Button>
                                </div>
                            </div>

                            {/* Cài đặt link mời */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                        Thời gian hết hạn
                                    </label>
                                    <Select defaultValue="7days">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1day">1 ngày</SelectItem>
                                            <SelectItem value="7days">7 ngày</SelectItem>
                                            <SelectItem value="unlimited">Không giới hạn</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                        Giới hạn sử dụng
                                    </label>
                                    <Input
                                        type="number"
                                        placeholder="Không giới hạn"
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab: Chỉnh sửa nhóm */}
                    <TabsContent value="edit" className="space-y-6 mt-6">
                        <div className="text-center mb-6">
                            <h4 className="text-lg font-semibold mb-2">Chỉnh sửa thông tin nhóm</h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Cập nhật thông tin cơ bản của nhóm
                            </p>
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                {/* Avatar */}
                                <div className="text-center">
                                    <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-gray-200 dark:ring-gray-700">
                                        <AvatarImage src={groupAvatar} />
                                        <AvatarFallback className="bg-gradient-to-r from-[#1447e6] to-[#ad46ff] text-white font-bold text-xl">
                                            {getInitials(editForm.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Button variant="outline" size="sm">
                                        Thay đổi ảnh
                                    </Button>
                                </div>

                                {/* Form fields */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                            Tên nhóm
                                        </label>
                                        <Input
                                            value={editForm.name}
                                            onChange={(e) => handleEditChange('name', e.target.value)}
                                            placeholder="Nhập tên nhóm..."
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                            Mô tả
                                        </label>
                                        <Textarea
                                            value={editForm.description}
                                            onChange={(e) => handleEditChange('description', e.target.value)}
                                            placeholder="Nhập mô tả nhóm..."
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                            Loại nhóm
                                        </label>
                                        <Select
                                            value={editForm.isPrivate ? "private" : "public"}
                                            onValueChange={(value) => handleEditChange('isPrivate', value === 'private')}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="private">
                                                    <div className="flex items-center gap-2">
                                                        <Lock className="h-4 w-4" />
                                                        🔒 Nhóm riêng tư
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="public">
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="h-4 w-4" />
                                                        🌍 Nhóm công khai
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={handleCancelEdit}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        className="flex-1 bg-[#1447e6] hover:bg-[#1447e6]/90"
                                        onClick={handleSaveChanges}
                                    >
                                        Lưu thay đổi
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-[#1447e6] hover:bg-[#1447e6]/90"
                                >
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Chỉnh sửa nhóm
                                </Button>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
