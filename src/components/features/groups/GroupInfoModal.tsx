// components/features/groups/GroupInfoModal.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    X,
    Users,
    UserPlus,
    Edit3,
    Settings,
    Globe,
    Lock,
    Calendar,
    MessageCircle,
    Crown,
    MoreHorizontal,
    Search,
    Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    group?: any; // Sẽ được thay thế bằng type thật sau
}

export function GroupInfoModal({ isOpen, onClose, group }: GroupInfoModalProps) {
    const [activeTab, setActiveTab] = useState("info");
    const [isEditing, setIsEditing] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="relative p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#ad46ff]/5 to-[#1447e6]/5">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 ring-4 ring-[#ad46ff]/20 shadow-xl">
                            <AvatarImage src={group?.groupAvatarUrl} />
                            <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white font-bold text-2xl">
                                {group?.groupName?.split(" ").map((n: string) => n[0]).join("") || "G"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {group?.groupName || "Tên nhóm"}
                            </h2>
                            <div className="flex items-center gap-3">
                                <Badge
                                    variant="outline"
                                    className="border-[#1447e6] text-[#1447e6] bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 font-bold rounded-full"
                                >
                                    <Users className="h-3 w-3 mr-1.5" />
                                    {group?.memberCount || 0} thành viên
                                </Badge>
                                <Badge
                                    variant="secondary"
                                    className="px-3 py-1.5 rounded-full"
                                >
                                    {group?.groupType === "Private" ? (
                                        <>
                                            <Lock className="h-3 w-3 mr-1.5" />
                                            Riêng tư
                                        </>
                                    ) : (
                                        <>
                                            <Globe className="h-3 w-3 mr-1.5" />
                                            Công khai
                                        </>
                                    )}
                                </Badge>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-10 w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                        <TabsList className="flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-2 gap-1 mx-6 mt-4">
                            <TabsTrigger
                                value="info"
                                className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-[#ad46ff] data-[state=active]:shadow-sm rounded-lg py-2 px-4"
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Thông tin
                            </TabsTrigger>
                            <TabsTrigger
                                value="members"
                                className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-[#ad46ff] data-[state=active]:shadow-sm rounded-lg py-2 px-4"
                            >
                                <Users className="h-4 w-4 mr-2" />
                                Thành viên
                            </TabsTrigger>
                            <TabsTrigger
                                value="invite"
                                className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-[#ad46ff] data-[state=active]:shadow-sm rounded-lg py-2 px-4"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Mời người
                            </TabsTrigger>
                            <TabsTrigger
                                value="edit"
                                className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-[#ad46ff] data-[state=active]:shadow-sm rounded-lg py-2 px-4"
                            >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Chỉnh sửa
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-hidden p-6">
                            {/* Thông tin nhóm */}
                            <TabsContent value="info" className="h-full mt-0">
                                <div className="space-y-6">
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <MessageCircle className="h-5 w-5 text-[#ad46ff]" />
                                            Mô tả nhóm
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                            {group?.description && group.description !== "string" ? group.description : "Chưa có mô tả cho nhóm này. Hãy thêm mô tả để các thành viên hiểu rõ hơn về mục đích của nhóm!"}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                <Calendar className="h-5 w-5 text-[#1447e6]" />
                                                Thông tin cơ bản
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Ngày tạo:</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {group?.createdAt ? new Date(group.createdAt).toLocaleDateString('vi-VN') : "Chưa có thông tin"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Loại nhóm:</span>
                                                    <Badge variant="outline" className="border-[#ad46ff] text-[#ad46ff]">
                                                        {group?.groupType === "Private" ? "Riêng tư" : "Công khai"}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">ID nhóm:</span>
                                                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                                                        {group?.groupId || "Chưa có thông tin"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                <Crown className="h-5 w-5 text-[#ad46ff]" />
                                                Quản trị viên
                                            </h3>
                                            <div className="space-y-3">
                                                {group?.members?.filter((member: any) => member.role === "Admin").map((admin: any, index: number) => (
                                                    <div key={admin.userId} className="flex items-center gap-3">
                                                        <Avatar className="h-12 w-12">
                                                            <AvatarImage src={admin.avatarUrl} />
                                                            <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white font-bold">
                                                                {admin.fullName?.split(" ").map((n: string) => n[0]).join("") || "A"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {admin.fullName || "Tên quản trị viên"}
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                Quản trị viên chính
                                                            </p>
                                                        </div>
                                                    </div>
                                                )) || (
                                                        <p className="text-gray-500 dark:text-gray-400">Chưa có thông tin quản trị viên</p>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Danh sách thành viên */}
                            <TabsContent value="members" className="h-full mt-0">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Thành viên nhóm ({group?.memberCount || 0})
                                        </h3>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Tìm kiếm thành viên..."
                                                className="pl-10 pr-4 h-10 w-64 border-gray-200 dark:border-gray-700 focus:border-[#ad46ff] focus:ring-[#ad46ff]/20"
                                            />
                                        </div>
                                    </div>

                                    <ScrollArea className="h-96">
                                        <div className="space-y-3">
                                            {group?.members && group.members.length > 0 ? (
                                                group.members.map((member: any, index: number) => (
                                                    <div key={member.userId} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10">
                                                                <AvatarImage src={member.avatarUrl} />
                                                                <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white font-bold">
                                                                    {member.fullName?.split(" ").map((n: string) => n[0]).join("") || "U"}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium text-gray-900 dark:text-white">
                                                                    {member.fullName || "Thành viên"}
                                                                </p>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {member.role === "Admin" ? "Quản trị viên" : "Thành viên"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {member.role === "Admin" && (
                                                                <Badge className="bg-[#ad46ff] text-white px-2 py-1 text-xs">
                                                                    <Crown className="h-3 w-3 mr-1" />
                                                                    Quản trị viên
                                                                </Badge>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                                    <p>Chưa có thành viên nào trong nhóm</p>
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </TabsContent>

                            {/* Mời người */}
                            <TabsContent value="invite" className="h-full mt-0">
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-r from-[#ad46ff]/10 to-[#1447e6]/10 rounded-2xl p-6 border border-[#ad46ff]/20">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <UserPlus className="h-5 w-5 text-[#ad46ff]" />
                                            Mời người tham gia nhóm
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                                            Mời bạn bè hoặc đồng nghiệp tham gia nhóm để cùng chia sẻ và trao đổi thông tin.
                                        </p>

                                        <div className="space-y-4">
                                            <div className="flex gap-3">
                                                <Input
                                                    placeholder="Nhập email hoặc tên người dùng..."
                                                    className="flex-1 border-gray-200 dark:border-gray-700 focus:border-[#ad46ff] focus:ring-[#ad46ff]/20"
                                                />
                                                <Button className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white hover:from-[#ad46ff]/90 hover:to-[#1447e6]/90 px-6">
                                                    <UserPlus className="h-4 w-4 mr-2" />
                                                    Mời
                                                </Button>
                                            </div>


                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Chỉnh sửa thông tin nhóm */}
                            <TabsContent value="edit" className="h-full mt-0">
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-r from-[#1447e6]/10 to-[#ad46ff]/10 rounded-2xl p-6 border border-[#1447e6]/20">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Edit3 className="h-5 w-5 text-[#1447e6]" />
                                            Chỉnh sửa thông tin nhóm
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                                            Cập nhật thông tin nhóm để phản ánh chính xác mục đích và hoạt động hiện tại.
                                        </p>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Tên nhóm
                                                </label>
                                                <Input
                                                    placeholder="Nhập tên nhóm mới..."
                                                    defaultValue={group?.groupName}
                                                    className="border-gray-200 dark:border-gray-700 focus:border-[#1447e6] focus:ring-[#1447e6]/20"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Mô tả nhóm
                                                </label>
                                                <Textarea
                                                    placeholder="Nhập mô tả nhóm..."
                                                    defaultValue={group?.description && group.description !== "string" ? group.description : ""}
                                                    rows={4}
                                                    className="border-gray-200 dark:border-gray-700 focus:border-[#1447e6] focus:ring-[#1447e6]/20 resize-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Loại nhóm
                                                </label>
                                                <div className="flex gap-3">
                                                    <Button
                                                        variant={group?.groupType === "Private" ? "outline" : "default"}
                                                        className={cn(
                                                            "flex-1",
                                                            group?.groupType !== "Private" && "bg-gradient-to-r from-[#1447e6] to-[#ad46ff] text-white"
                                                        )}
                                                    >
                                                        <Globe className="h-4 w-4 mr-2" />
                                                        Công khai
                                                    </Button>
                                                    <Button
                                                        variant={group?.groupType === "Private" ? "default" : "outline"}
                                                        className={cn(
                                                            "flex-1",
                                                            group?.groupType === "Private" && "bg-gradient-to-r from-[#1447e6] to-[#ad46ff] text-white"
                                                        )}
                                                    >
                                                        <Lock className="h-4 w-4 mr-2" />
                                                        Riêng tư
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 pt-4">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setIsEditing(false)}
                                                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                                                >
                                                    Hủy bỏ
                                                </Button>
                                                <Button className="flex-1 bg-gradient-to-r from-[#1447e6] to-[#ad46ff] text-white hover:from-[#1447e6]/90 hover:to-[#ad46ff]/90">
                                                    <Edit3 className="h-4 w-4 mr-2" />
                                                    Lưu thay đổi
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
