"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface CreateCommunityDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCommunityCreated: (community: any) => void;
}

export function CreateCommunityDialog({ open, onOpenChange, onCommunityCreated }: CreateCommunityDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
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
            toast.error("Vui lòng nhập tên cộng đồng");
            return;
        }

        setIsSubmitting(true);

        try {
            // TODO: Gọi API tạo cộng đồng
            // const response = await createCommunity({ name, description, avatar: avatarFile });
            
            // Mock response
            const newCommunity = {
                id: Date.now().toString(),
                name: name.trim(),
                description: description.trim(),
                avatarUrl: avatarPreview || undefined,
                memberCount: 1,
                isAdmin: true
            };

            onCommunityCreated(newCommunity);
            toast.success("Tạo cộng đồng thành công!");
            
            // Reset form
            setName("");
            setDescription("");
            setAvatarFile(null);
            setAvatarPreview("");
            
        } catch (error) {
            console.error("Error creating community:", error);
            toast.error("Không thể tạo cộng đồng. Vui lòng thử lại.");
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
            setAvatarFile(null);
            setAvatarPreview("");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Tạo cộng đồng mới</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Avatar Upload */}
                    <div className="space-y-2">
                        <Label>Ảnh đại diện cộng đồng</Label>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <Avatar className="h-16 w-16">
                                    {avatarPreview ? (
                                        <AvatarImage src={avatarPreview} />
                                    ) : (
                                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg">
                                            <Upload className="h-6 w-6" />
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                
                                {avatarPreview && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                                        onClick={removeAvatar}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                            
                            <div className="flex-1">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                    id="avatar-upload"
                                />
                                <Label
                                    htmlFor="avatar-upload"
                                    className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {avatarFile ? "Thay đổi ảnh" : "Chọn ảnh"}
                                </Label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    JPG, PNG hoặc GIF. Tối đa 2MB.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Community Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Tên cộng đồng *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nhập tên cộng đồng..."
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Mô tả</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mô tả ngắn về cộng đồng..."
                            rows={3}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !name.trim()}
                        >
                            {isSubmitting ? "Đang tạo..." : "Tạo cộng đồng"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
