"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Upload,
    Users,
    Lock,
    Globe,
    Loader2,
    X,
} from "lucide-react";
import { useCustomerStore } from "@/store/customerStore";
import { createGroup, uploadImage } from "@/lib/customer-api-client";
import { ChatGroup } from "@/types/customer.types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CreateGroupDialog() {
    const [groupName, setGroupName] = useState("");
    const [description, setDescription] = useState("");
    const [groupType, setGroupType] = useState<1 | 2 | 3>(1); // 1: Private, 2: Public, 3: Community
    const [avatarUrl, setAvatarUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { isCreateGroupOpen, addGroup, closeCreateGroup } = useCustomerStore();

    // Reset form when dialog opens
    useEffect(() => {
        if (isCreateGroupOpen) {
            setGroupName("");
            setDescription("");
            setGroupType(1);
            setAvatarUrl("");
            setIsLoading(false);
            setIsUploadingAvatar(false);
        }
    }, [isCreateGroupOpen]);

    // Reset form when dialog closes
    useEffect(() => {
        if (!isCreateGroupOpen) {
            setGroupName("");
            setDescription("");
            setGroupType(1);
            setAvatarUrl("");
            setIsLoading(false);
            setIsUploadingAvatar(false);
        }
    }, [isCreateGroupOpen]);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsUploadingAvatar(true);
            try {
                // Upload file to server first
                const uploadResponse = await uploadImage(file);
                if (uploadResponse.success) {
                    setAvatarUrl(uploadResponse.data.fileUrl);
                    toast.success("Tải lên ảnh đại diện thành công!");
                } else {
                    toast.error(uploadResponse.message || "Không thể tải lên ảnh đại diện");
                }
            } catch (error) {
                console.error("Error uploading avatar:", error);
                toast.error("Có lỗi xảy ra khi tải lên ảnh. Vui lòng thử lại.");
                // Fallback to base64 for preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    setAvatarUrl(e.target?.result as string);
                };
                reader.readAsDataURL(file);
            } finally {
                setIsUploadingAvatar(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!groupName.trim()) {
            toast.error("Tên nhóm không được để trống");
            return;
        }

        if (groupName.trim().length < 2) {
            toast.error("Tên nhóm phải có ít nhất 2 ký tự");
            return;
        }

        setIsLoading(true);

        try {
            // Create request data exactly matching API documentation
            const groupData: any = {
                groupName: groupName.trim(),
                description: description.trim() || "Nhóm chat mới", // Default description if empty
                groupType: groupType, // 1: Private, 2: Public, 3: Community
                groupAvatarUrl: avatarUrl || "string" // Use avatar URL if available
            };

            // Handle avatar URL
            if (avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'))) {
                groupData.groupAvatarUrl = avatarUrl;
            } else if (avatarUrl && avatarUrl.startsWith('data:')) {
                // If it's a base64 image, we'll need to upload it first
                // For now, use default
                groupData.groupAvatarUrl = "string";
            }

            const response = await createGroup(groupData);

            if (response.success) {
                toast.success("Tạo nhóm thành công!");

                // Convert API response to ChatGroup format for store
                const newGroup: ChatGroup = {
                    id: response.data.groupId,
                    name: response.data.groupName,
                    description: description.trim() || "Nhóm chat mới",
                    avatarUrl: avatarUrl || undefined,
                    isPrivate: groupType === 1, // 1: Private, 2: Public, 3: Community
                    memberCount: 1, // Creator is the first member
                    unreadCount: 0,
                    isOnline: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isMyGroup: true,
                    category: undefined,
                    tags: []
                };

                addGroup(newGroup);
                // Also add to myGroups
                useCustomerStore.getState().setMyGroups([
                    newGroup,
                    ...useCustomerStore.getState().myGroups
                ]);
                handleClose();
            } else {
                toast.error(response.message || "Có lỗi xảy ra khi tạo nhóm. Vui lòng kiểm tra lại thông tin.");
            }
        } catch (error) {
            console.error("Error creating group:", error);
            toast.error("Có lỗi xảy ra khi tạo nhóm. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (isLoading) return; // Prevent closing while loading
        closeCreateGroup();
    };

    return (
        <Dialog open={isCreateGroupOpen} onOpenChange={(open) => {
            if (!open) {
                handleClose();
            }
        }}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto scrollbar-hide">
                <DialogHeader className="relative">
                    <DialogTitle className="flex items-center gap-2 pr-8">
                        <Users className="h-5 w-5" />
                        Tạo nhóm mới
                    </DialogTitle>
                    <DialogDescription>
                        Tạo một nhóm chat mới để kết nối với bạn bè và đồng nghiệp
                    </DialogDescription>

                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center space-y-3">
                        <div className="relative">
                            <Avatar className="h-24 w-24 cursor-pointer border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback className="text-lg">
                                    {isUploadingAvatar ? (
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                    ) : groupName ? (
                                        groupName.split(' ').map(n => n[0]).join('')
                                    ) : (
                                        <Upload className="h-8 w-8" />
                                    )}
                                </AvatarFallback>
                            </Avatar>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingAvatar}
                            >
                                {isUploadingAvatar ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                        />
                        <p className="text-sm text-muted-foreground text-center">
                            Tải lên ảnh đại diện cho nhóm (tùy chọn)
                        </p>
                    </div>

                    {/* Group Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="groupName" className="text-sm font-medium">
                            Tên nhóm <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="groupName"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Nhập tên nhóm..."
                            maxLength={50}
                            required
                            className={cn(
                                "border-gray-200 dark:border-gray-700 focus:border-[#ad46ff] focus:ring-[#ad46ff]/20",
                                groupName.length > 0 && groupName.trim().length < 2 && "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                            )}
                        />
                        {groupName.length > 0 && groupName.trim().length < 2 && (
                            <p className="text-xs text-red-500">
                                Tên nhóm phải có ít nhất 2 ký tự
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium">
                            Giới thiệu
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mô tả về nhóm của bạn (tùy chọn)..."
                            maxLength={200}
                            rows={3}
                            className="border-gray-200 dark:border-gray-700 focus:border-[#ad46ff] focus:ring-[#ad46ff]/20"
                        />
                    </div>

                    {/* Privacy Setting */}
                    <Card className="border-0 shadow-sm bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Lock className="h-4 w-4 text-gray-500" />
                                Cài đặt quyền riêng tư
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1.5">
                            {/* Private Group */}
                            <div className={cn(
                                "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 border",
                                groupType === 1
                                    ? "border-blue-300 bg-blue-50 dark:bg-blue-900/30 shadow-sm"
                                    : "border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                            )}
                                onClick={() => setGroupType(1)}
                            >
                                <div className={cn(
                                    "w-3 h-3 rounded-full border-2 transition-all duration-200",
                                    groupType === 1
                                        ? "border-blue-500 bg-blue-500"
                                        : "border-gray-400 dark:border-gray-500"
                                )} />
                                <div className="flex items-center gap-2.5 flex-1">
                                    <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/40">
                                        <Lock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Nhóm riêng tư</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Chỉ mời mới vào được</p>
                                    </div>
                                </div>
                            </div>

                            {/* Public Group */}
                            <div className={cn(
                                "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 border",
                                groupType === 2
                                    ? "border-green-300 bg-green-50 dark:bg-green-900/30 shadow-sm"
                                    : "border-gray-200 dark:border-gray-600 hover:border-green-200 dark:hover:border-green-700 hover:bg-green-50/50 dark:hover:bg-green-900/10"
                            )}
                                onClick={() => setGroupType(2)}
                            >
                                <div className={cn(
                                    "w-3 h-3 rounded-full border-2 transition-all duration-200",
                                    groupType === 2
                                        ? "border-green-500 bg-green-500"
                                        : "border-gray-400 dark:border-gray-500"
                                )} />
                                <div className="flex items-center gap-2.5 flex-1">
                                    <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/40">
                                        <Globe className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Nhóm công khai</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Ai cũng có thể tham gia</p>
                                    </div>
                                </div>
                            </div>

                            {/* Community Group */}
                            <div className={cn(
                                "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 border",
                                groupType === 3
                                    ? "border-purple-300 bg-purple-50 dark:bg-purple-900/30 shadow-sm"
                                    : "border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-900/10"
                            )}
                                onClick={() => setGroupType(3)}
                            >
                                <div className={cn(
                                    "w-3 h-3 rounded-full border-2 transition-all duration-200",
                                    groupType === 3
                                        ? "border-purple-500 bg-purple-500"
                                        : "border-gray-400 dark:border-gray-500"
                                )} />
                                <div className="flex items-center gap-2.5 flex-1">
                                    <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/40">
                                        <Users className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Cộng đồng</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Tập trung vào bài đăng</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <DialogFooter className="gap-3 pt-4 pb-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="min-w-[80px] h-10"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={!groupName.trim() || groupName.trim().length < 2 || isLoading}
                            className={cn(
                                "min-w-[100px] h-10 transition-all duration-200",
                                !groupName.trim() || groupName.trim().length < 2
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-[#ad46ff] to-[#1447e6] hover:from-[#ad46ff]/90 hover:to-[#1447e6]/90 text-white shadow-lg hover:shadow-xl"
                            )}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang tạo...
                                </>
                            ) : (
                                "Tạo nhóm"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
