"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, X, Loader2, Globe, Lock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createGroup } from "@/lib/customer-api-client";

interface CreateGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGroupCreated: (response?: any) => void;
}

export function CreateGroupDialog({ open, onOpenChange, onGroupCreated }: CreateGroupDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [groupType, setGroupType] = useState<"Public" | "Private">("Public");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Kích thước file không được vượt quá 2MB");
                return;
            }
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatarPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Vui lòng nhập tên nhóm");
            return;
        }

        if (name.trim().length < 2) {
            toast.error("Tên nhóm phải có ít nhất 2 ký tự");
            return;
        }

        if (name.trim().length > 50) {
            toast.error("Tên nhóm không được vượt quá 50 ký tự");
            return;
        }

        setIsSubmitting(true);

        try {
            // Gọi API tạo nhóm thật
            const response = await createGroup({
                groupName: name.trim(),
                description: description.trim(),
                groupType: groupType,
                groupAvatarUrl: avatarPreview || undefined
            });

            if (response.success && response.data) {
                // Hiển thị success message
                setShowSuccess(true);

                // Delay để user thấy success message
                setTimeout(() => {
                    onGroupCreated(response);

                    // Reset form
                    setName("");
                    setDescription("");
                    setGroupType("Public");
                    setAvatarFile(null);
                    setAvatarPreview("");
                    setShowSuccess(false);

                    // Close dialog
                    onOpenChange(false);
                }, 1500);
            } else {
                toast.error(response.message || "Không thể tạo nhóm");
            }

        } catch (error: any) {
            console.error("Error creating group:", error);
            toast.error("Không thể tạo nhóm. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onOpenChange(false);
            // Reset form when closing
            setName("");
            setDescription("");
            setGroupType("Public");
            setAvatarFile(null);
            setAvatarPreview("");
            setShowSuccess(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                        Tạo nhóm mới
                    </DialogTitle>
                </DialogHeader>

                {showSuccess ? (
                    // Success Message
                    <div className="flex flex-col items-center justify-center py-12 space-y-6">
                        <div className="relative">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-pulse">
                                <CheckCircle className="w-12 h-12 text-white" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Tạo nhóm thành công!
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Nhóm "{name}" đã được tạo thành công và sẵn sàng sử dụng.
                            </p>
                        </div>

                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Đang chuyển hướng...</span>
                        </div>
                    </div>
                ) : (
                    // Form Content
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column - Avatar & Basic Info */}
                            <div className="space-y-6">
                                {/* Avatar Upload */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Ảnh đại diện nhóm
                                    </Label>
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="relative group">
                                            <Avatar className="h-24 w-24 ring-4 ring-gray-200 dark:ring-gray-700 transition-all duration-300 group-hover:ring-[#ad46ff]/30">
                                                {avatarPreview ? (
                                                    <AvatarImage src={avatarPreview} className="object-cover" />
                                                ) : (
                                                    <AvatarFallback className="bg-gradient-to-br from-[#ad46ff] to-[#1447e6] text-white text-2xl font-bold">
                                                        <Upload className="h-8 w-8" />
                                                    </AvatarFallback>
                                                )}
                                            </Avatar>

                                            {avatarPreview && (
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute -top-2 -right-2 h-7 w-7 p-0 rounded-full shadow-lg hover:scale-110 transition-transform duration-200"
                                                    onClick={removeAvatar}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="text-center">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                                className="hidden"
                                                id="avatar-upload"
                                            />
                                            <Label
                                                htmlFor="avatar-upload"
                                                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ad46ff] transition-all duration-200"
                                            >
                                                <Upload className="h-4 w-4 mr-2" />
                                                {avatarFile ? "Thay đổi ảnh" : "Chọn ảnh"}
                                            </Label>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                JPG, PNG hoặc GIF. Tối đa 2MB.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Group Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Tên nhóm *
                                    </Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Nhập tên nhóm..."
                                        required
                                        maxLength={50}
                                        className="transition-all duration-200 focus:ring-2 focus:ring-[#ad46ff]/20 focus:border-[#ad46ff]"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {name.length}/50 ký tự
                                    </p>
                                </div>
                            </div>

                            {/* Right Column - Description & Privacy */}
                            <div className="space-y-6">
                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Mô tả (Tùy chọn)
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Mô tả ngắn về nhóm..."
                                        rows={4}
                                        maxLength={200}
                                        className="resize-none transition-all duration-200 focus:ring-2 focus:ring-[#ad46ff]/20 focus:border-[#ad46ff]"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {description.length}/200 ký tự
                                    </p>
                                </div>

                                {/* Privacy Settings */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Quyền riêng tư
                                    </Label>
                                    <RadioGroup
                                        value={groupType}
                                        onValueChange={(value: string) => setGroupType(value as "Public" | "Private")}
                                        className="space-y-3"
                                    >
                                        <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer">
                                            <RadioGroupItem value="Public" id="public" className="text-[#1447e6]" />
                                            <Label htmlFor="public" className="flex items-center space-x-3 cursor-pointer flex-1">
                                                <div className={cn(
                                                    "p-2 rounded-full",
                                                    groupType === "Public"
                                                        ? "bg-[#1447e6]/10 text-[#1447e6]"
                                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                                )}>
                                                    <Globe className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900 dark:text-white">Công khai</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        Bất kỳ ai cũng có thể tìm thấy và tham gia nhóm
                                                    </div>
                                                </div>
                                            </Label>
                                        </div>

                                        <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer">
                                            <RadioGroupItem value="Private" id="private" className="text-[#ad46ff]" />
                                            <Label htmlFor="private" className="flex items-center space-x-3 cursor-pointer flex-1">
                                                <div className={cn(
                                                    "p-2 rounded-full",
                                                    groupType === "Private"
                                                        ? "bg-[#ad46ff]/10 text-[#ad46ff]"
                                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                                )}>
                                                    <Lock className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900 dark:text-white">Riêng tư</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        Chỉ thành viên được mời mới có thể tham gia
                                                    </div>
                                                </div>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="px-6 py-2 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !name.trim() || name.trim().length < 2}
                                className="px-6 py-2 bg-gradient-to-r from-[#ad46ff] to-[#1447e6] hover:from-[#ad46ff]/90 hover:to-[#1447e6]/90 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Đang tạo...
                                    </>
                                ) : (
                                    "Tạo nhóm"
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
