"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, X } from "lucide-react";
import { createGroup } from "@/lib/customer-api-client";
import { toast } from "sonner";

interface CreateGroupDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onGroupCreated?: () => void;
}

export function CreateGroupDialog({ isOpen, onClose, onGroupCreated }: CreateGroupDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [description, setDescription] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error("Vui lòng chọn file ảnh");
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Kích thước ảnh không được vượt quá 5MB");
                return;
            }

            setAvatarFile(file);

            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
        }
    };

    const removeAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!groupName.trim()) {
            toast.error("Vui lòng nhập tên nhóm");
            return;
        }

        // Kiểm tra độ dài tên nhóm
        if (groupName.trim().length < 2) {
            toast.error("Tên nhóm phải có ít nhất 2 ký tự");
            return;
        }

        if (groupName.trim().length > 50) {
            toast.error("Tên nhóm không được vượt quá 50 ký tự");
            return;
        }

        // Kiểm tra độ dài mô tả
        if (description.trim().length > 200) {
            toast.error("Mô tả không được vượt quá 200 ký tự");
            return;
        }

        setIsLoading(true);

        try {
            const groupData = {
                groupName: groupName.trim(),
                description: description.trim() || "",
                groupType: (isPrivate ? "Private" : "Public") as "Private" | "Public" | "Community",
                groupAvatarUrl: avatarFile ? "" : ""
            };

            const response = await createGroup(groupData);

            if (response.success) {
                // Reset form
                setGroupName("");
                setDescription("");
                setIsPrivate(false);
                removeAvatar();

                // Close dialog
                onClose();

                // Call callback to refresh groups list
                if (onGroupCreated) {
                    onGroupCreated();
                }

                // TODO: Refresh groups list or navigate to the new group
            } else {
                toast.error(response.message || "Không thể tạo nhóm");
            }
        } catch (error: any) {
            console.error("Error creating group:", error);

            // Log detailed error information
            if (error.response) {
                console.error("Error response:", error.response);
                console.error("Error status:", error.response.status);
                console.error("Error data:", error.response.data);

                // Show more specific error message
                if (error.response.status === 400) {
                    const errorData = error.response.data;

                    if (errorData && errorData.errors && errorData.errors.length > 0) {
                        const firstError = errorData.errors[0];

                        if (firstError.message) {
                            toast.error(`Lỗi validation: ${firstError.message}`);
                        } else if (firstError.errorMessage) {
                            toast.error(`Lỗi validation: ${firstError.errorMessage}`);
                        } else {
                            toast.error("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin nhóm.");
                        }
                    } else if (errorData && errorData.message) {
                        toast.error(`Lỗi: ${errorData.message}`);
                    } else {
                        toast.error("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin nhóm.");
                    }
                } else if (error.response.status === 401) {
                    toast.error("Bạn cần đăng nhập để tạo nhóm");
                } else if (error.response.status === 403) {
                    toast.error("Bạn không có quyền tạo nhóm");
                } else {
                    toast.error(`Lỗi server: ${error.response.status}`);
                }
            } else if (error.request) {
                console.error("Error request:", error.request);
                toast.error("Không thể kết nối đến server. Vui lòng thử lại sau.");
            } else {
                toast.error("Có lỗi xảy ra khi tạo nhóm");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Tạo nhóm mới</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                            <Avatar className="w-20 h-20">
                                {avatarPreview ? (
                                    <AvatarImage src={avatarPreview} alt="Group avatar preview" />
                                ) : (
                                    <AvatarFallback className="text-lg font-semibold bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white">
                                        {groupName ? groupName.charAt(0).toUpperCase() : "G"}
                                    </AvatarFallback>
                                )}
                            </Avatar>

                            {avatarPreview && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                                    onClick={removeAvatar}
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Chọn ảnh
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarSelect}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Group Name */}
                    <div className="space-y-2">
                        <Label htmlFor="groupName">Tên nhóm *</Label>
                        <Input
                            id="groupName"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Nhập tên nhóm..."
                            disabled={isLoading}
                            maxLength={50}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Mô tả</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mô tả về nhóm..."
                            disabled={isLoading}
                            maxLength={200}
                            rows={3}
                        />
                    </div>

                    {/* Privacy Setting */}
                    <div className="space-y-3">
                        <Label htmlFor="privacy" className="text-base font-medium">Chế độ riêng tư</Label>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Public Option */}
                            <div
                                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${!isPrivate
                                    ? 'border-[#1447e6] bg-[#1447e6]/5'
                                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                                    }`}
                                onClick={() => setIsPrivate(false)}
                            >
                                <input
                                    type="radio"
                                    name="privacy"
                                    checked={!isPrivate}
                                    onChange={() => setIsPrivate(false)}
                                    className="sr-only"
                                />

                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!isPrivate
                                        ? 'border-[#1447e6]'
                                        : 'border-gray-300 dark:border-gray-500'
                                        }`}>
                                        {!isPrivate && (
                                            <div className="w-2.5 h-2.5 bg-[#1447e6] rounded-full"></div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-3 h-3 bg-[#1447e6] rounded-full"></div>
                                            <span className={`font-medium ${!isPrivate
                                                ? 'text-[#1447e6]'
                                                : 'text-gray-700 dark:text-gray-300'
                                                }`}>
                                                Công khai
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Ai cũng có thể tham gia
                                        </p>
                                    </div>
                                </div>


                            </div>

                            {/* Private Option */}
                            <div
                                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${isPrivate
                                    ? 'border-[#ad46ff] bg-[#ad46ff]/5'
                                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                                    }`}
                                onClick={() => setIsPrivate(true)}
                            >
                                <input
                                    type="radio"
                                    name="privacy"
                                    checked={isPrivate}
                                    onChange={() => setIsPrivate(true)}
                                    className="sr-only"
                                />

                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isPrivate
                                        ? 'border-[#ad46ff]'
                                        : 'border-gray-300 dark:border-gray-500'
                                        }`}>
                                        {isPrivate && (
                                            <div className="w-2.5 h-2.5 bg-[#ad46ff] rounded-full"></div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-3 h-3 bg-[#ad46ff] rounded-full"></div>
                                            <span className={`font-medium ${isPrivate
                                                ? 'text-[#ad46ff]'
                                                : 'text-gray-700 dark:text-gray-300'
                                                }`}>
                                                Riêng tư
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Chỉ thành viên mới có thể tham gia
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {isPrivate
                                ? "Nhóm riêng tư sẽ không hiển thị trong kết quả tìm kiếm công khai"
                                : "Nhóm công khai sẽ hiển thị trong kết quả tìm kiếm và ai cũng có thể tham gia"
                            }
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !groupName.trim()}
                            className="flex-1 bg-gradient-to-r from-[#ad46ff] to-[#1447e6] hover:from-[#ad46ff]/90 hover:to-[#1447e6]/90"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang tạo...
                                </>
                            ) : (
                                "Tạo nhóm"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
