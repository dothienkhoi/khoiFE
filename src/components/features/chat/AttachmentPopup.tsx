"use client";

import { Button } from "@/components/ui/button";
import { X, Image, Download, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttachmentPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onImageSelect: () => void;
    onFileSelect: () => void;
    selectedFilesCount: number;
    disabled?: boolean;
    isUploading?: boolean;
}

export function AttachmentPopup({
    isOpen,
    onClose,
    onImageSelect,
    onFileSelect,
    selectedFilesCount,
    disabled = false,
    isUploading = false
}: AttachmentPopupProps) {
    if (!isOpen) return null;

    const maxFiles = 5;
    const canAddFiles = selectedFilesCount < maxFiles;
    const isAtLimit = selectedFilesCount >= maxFiles;

    return (
        <div className="absolute bottom-full left-0 mb-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 min-w-[320px] animate-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Đính kèm tệp</h3>
                    <div className="px-2 py-1 bg-gradient-to-r from-[#ad46ff]/10 to-[#1447e6]/10 rounded-full border border-[#ad46ff]/20">
                        <span className="text-xs font-medium text-[#ad46ff]">
                            {selectedFilesCount}/{maxFiles}
                        </span>
                    </div>
                    {isAtLimit && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-full border border-yellow-200 dark:border-yellow-800">
                            <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                                Giới hạn
                            </span>
                        </div>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    onClick={onClose}
                    disabled={disabled || isUploading}
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>

            {/* Attachment Options Grid */}
            <div className="grid grid-cols-2 gap-3">
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start gap-3 h-auto p-4 hover:scale-105 transition-all duration-200 border border-transparent hover:border-border",
                        !canAddFiles
                            ? "bg-gray-100 dark:bg-gray-700 opacity-50 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 hover:shadow-md"
                    )}
                    onClick={() => {
                        if (canAddFiles) {
                            onImageSelect();
                            onClose();
                        }
                    }}
                    disabled={disabled || isUploading || !canAddFiles}
                >
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        <Image className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                        <div className="font-medium text-sm text-blue-600 dark:text-blue-400">
                            Hình ảnh
                        </div>
                    </div>
                </Button>

                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start gap-3 h-auto p-4 hover:scale-105 transition-all duration-200 border border-transparent hover:border-border",
                        !canAddFiles
                            ? "bg-gray-100 dark:bg-gray-700 opacity-50 cursor-not-allowed"
                            : "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-900/20 hover:shadow-md"
                    )}
                    onClick={() => {
                        if (canAddFiles) {
                            onFileSelect();
                            onClose();
                        }
                    }}
                    disabled={disabled || isUploading || !canAddFiles}
                >
                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-950/20">
                        <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="text-left">
                        <div className="font-medium text-sm text-gray-600 dark:text-gray-400">
                            File khác
                        </div>
                    </div>
                </Button>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Tối đa {maxFiles} file, mỗi file không quá 10MB
                </p>
            </div>
        </div>
    );
}
