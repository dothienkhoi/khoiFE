"use client";

import { Button } from "@/components/ui/button";
import {
    Image,
    Camera,
    FileText,
    Music,
    Video,
    Download,
    X,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AttachmentOption {
    id: string;
    icon: any;
    label: string;
    description: string;
    color: string;
    bgColor: string;
    textColor: string;
    onClick: () => void;
}

interface AttachmentPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectOption: (option: AttachmentOption) => void;
    isUploading: boolean;
    disabled?: boolean;
}

const attachmentOptions: AttachmentOption[] = [
    {
        id: 'image',
        icon: Image,
        label: 'Hình ảnh',
        description: 'Chia sẻ ảnh',
        color: 'bg-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        textColor: 'text-blue-600 dark:text-blue-400',
        onClick: () => { }
    },
    {
        id: 'other',
        icon: Download,
        label: 'File khác',
        description: 'Gửi file bất kỳ',
        color: 'bg-gray-500',
        bgColor: 'bg-gray-50 dark:bg-gray-950/20',
        textColor: 'text-gray-600 dark:text-gray-400',
        onClick: () => { }
    }
];

export function AttachmentPopup({
    isOpen,
    onClose,
    onSelectOption,
    isUploading,
    disabled = false
}: AttachmentPopupProps) {
    if (!isOpen) return null;

    return (
        <div className="absolute bottom-full left-0 mb-3 p-4 bg-background border rounded-xl shadow-2xl z-50 min-w-[320px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-foreground">Đính kèm tệp</h3>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-muted"
                    onClick={onClose}
                    disabled={disabled || isUploading}
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>

            {/* Attachment Options Grid */}
            <div className="grid grid-cols-2 gap-3">
                {attachmentOptions.map((option) => (
                    <Button
                        key={option.id}
                        variant="ghost"
                        className={cn(
                            "w-full justify-start gap-3 h-auto p-4 hover:scale-105 transition-all duration-200",
                            option.bgColor,
                            "hover:shadow-md border border-transparent hover:border-border"
                        )}
                        onClick={() => onSelectOption(option)}
                        disabled={disabled || isUploading}
                    >
                        <div className={cn(
                            "p-2 rounded-lg",
                            option.bgColor
                        )}>
                            <option.icon className={cn("h-4 w-4", option.textColor)} />
                        </div>
                        <div className="text-left">
                            <div className={cn("font-medium text-sm", option.textColor)}>
                                {option.label}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {option.description}
                            </div>
                        </div>
                    </Button>
                ))}
            </div>

            {/* Upload Progress */}
            {isUploading && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                        <div className="flex-1">
                            <span className="text-sm text-muted-foreground">Đang tải lên...</span>
                            <div className="w-full bg-muted rounded-full h-1 mt-1">
                                <div className="bg-primary h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                    Tối đa 5 file, mỗi file tối đa 10MB
                </p>
            </div>
        </div>
    );
}
