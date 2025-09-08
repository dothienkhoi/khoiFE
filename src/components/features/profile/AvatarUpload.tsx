"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { updateUserAvatar } from "@/lib/customer-api-client";
import { toast } from "sonner";

interface AvatarUploadProps {
    onAvatarUpdated: () => void;
    className?: string;
}

export function AvatarUpload({ onAvatarUpdated, className }: AvatarUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Vui lòng chọn file ảnh");
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Kích thước file quá lớn (tối đa 5MB)");
            return;
        }

        setIsUploading(true);

        try {
            const response = await updateUserAvatar(file);

            if (response.success) {
                toast.success("Cập nhật ảnh đại diện thành công");
                onAvatarUpdated();
            } else {
                throw new Error(response.message || "Cập nhật ảnh đại diện thất bại");
            }
        } catch (error: any) {
            console.error("Avatar upload error:", error);
            toast.error(error.response?.data?.message || error.message || "Cập nhật ảnh đại diện thất bại");
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleClick = () => {
        if (!isUploading && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className={className}>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClick}
                disabled={isUploading}
                className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
            >
                {isUploading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                    <Camera className="h-3 w-3" />
                )}
            </Button>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isUploading}
            />
        </div>
    );
}

