"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Image, FileText, Paperclip, Plus, Eye, Download, ZoomIn, ZoomOut, RotateCcw, Upload } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";

interface FilePreviewItem {
    file: File;
    previewUrl: string | null;
    type: 'image' | 'file';
}

interface FilePreviewProps {
    files: FilePreviewItem[];
    isUploading?: boolean;
    onRemoveFile: (index: number) => void;
    onClearAll: () => void;
    hideWhenPopupOpen?: boolean;
}

// Get file extension
const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
};

export function FilePreview({
    files,
    isUploading = false,
    onRemoveFile,
    onClearAll,
    hideWhenPopupOpen = false
}: FilePreviewProps) {
    const [showDialog, setShowDialog] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState<FilePreviewItem | null>(null);
    const [imageScale, setImageScale] = useState(1);
    const [imageRotation, setImageRotation] = useState(0);

    if (files.length === 0) return null;

    const maxVisibleFiles = 3;
    const visibleFiles = files.slice(0, maxVisibleFiles);
    const hasMoreFiles = files.length > maxVisibleFiles;

    const handleViewImage = (filePreview: FilePreviewItem) => {
        if (filePreview.previewUrl) {
            setSelectedImage(filePreview);
            setImageScale(1);
            setImageRotation(0);
            setShowImageModal(true);
        }
    };

    const handleZoomIn = () => {
        setImageScale(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setImageScale(prev => Math.max(prev - 0.25, 0.5));
    };

    const handleRotate = () => {
        setImageRotation(prev => (prev + 90) % 360);
    };

    const handleReset = () => {
        setImageScale(1);
        setImageRotation(0);
    };

    return (
        <>
            {/* Simple Progress Bar - Background of Message Input */}
            {isUploading && (
                <div className="fixed bottom-23 left-[415px] z-43">
                    <div
                        className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden transition-all duration-300"
                        style={{
                            width: `${Math.max(256, files.length * 64 + 48)}px` // 64px per file + 48px padding
                        }}
                    >
                        <div
                            className="h-full bg-gradient-to-r from-[#ad46ff] to-[#1447e6] rounded-full transition-all duration-500 ease-out relative"
                            style={{ width: '75%' }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Corner File Preview with Background Container */}
            {!hideWhenPopupOpen && (
                <div className="fixed bottom-25 left-[415px] z-40">
                    <div className="bg-white/95 dark:bg-gray-900/95 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-3 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            {/* Visible Files */}
                            {visibleFiles.map((filePreview, index) => (
                                <div
                                    key={`${filePreview.file.name}-${index}`}
                                    className="relative group"
                                >
                                    <div className={cn(
                                        "relative overflow-hidden rounded-xl border-2 transition-all duration-300",
                                        "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 group-hover:border-[#ad46ff]/50 group-hover:shadow-lg group-hover:scale-110"
                                    )}>
                                        {filePreview.previewUrl ? (
                                            // Image Display
                                            <div className="relative">
                                                <img
                                                    src={filePreview.previewUrl}
                                                    alt="Preview"
                                                    className="w-16 h-16 object-cover transition-all duration-300 group-hover:scale-110"
                                                />

                                                {/* Image Badge */}
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-[#ad46ff] to-[#1447e6] rounded-full flex items-center justify-center shadow-lg">
                                                    <Image className="h-2.5 w-2.5 text-white" />
                                                </div>

                                                {/* Hover Actions */}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onRemoveFile(index);
                                                        }}
                                                        disabled={isUploading}
                                                        title="Xóa file"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            // File Display
                                            <div className="relative w-16 h-16 bg-gradient-to-br from-[#ad46ff]/10 to-[#1447e6]/10 flex items-center justify-center">
                                                <div className="text-center">
                                                    <FileText className="h-6 w-6 text-[#ad46ff] mx-auto mb-1" />
                                                    <div className="text-xs font-bold text-[#ad46ff] bg-white dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
                                                        {getFileExtension(filePreview.file.name)}
                                                    </div>
                                                </div>

                                                {/* File Badge */}
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-[#ad46ff] to-[#1447e6] rounded-full flex items-center justify-center shadow-lg">
                                                    <FileText className="h-2.5 w-2.5 text-white" />
                                                </div>

                                                {/* Hover Actions for Files */}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onRemoveFile(index);
                                                        }}
                                                        disabled={isUploading}
                                                        title="Xóa file"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* More Files Button */}
                            {hasMoreFiles && (
                                <div className="relative group">
                                    <Button
                                        variant="ghost"
                                        className="w-16 h-16 bg-gradient-to-r from-[#ad46ff]/20 to-[#1447e6]/20 rounded-xl border-2 border-[#ad46ff]/30 flex items-center justify-center hover:shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:border-[#ad46ff]/50"
                                        onClick={() => setShowDialog(true)}
                                        disabled={isUploading}
                                    >
                                        <Plus className="h-6 w-6 text-[#ad46ff]" />
                                    </Button>
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                                        +{files.length - maxVisibleFiles} file khác
                                    </div>
                                </div>
                            )}

                            {/* File Counter Badge */}
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#ad46ff]/15 to-[#1447e6]/15 rounded-full border border-[#ad46ff]/25 backdrop-blur-sm">
                                <Paperclip className="h-3.5 w-3.5 text-[#ad46ff]" />
                                <span className="text-sm font-medium text-[#ad46ff]">
                                    {files.length}/5
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Beautiful Dialog for All Files */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#ad46ff]/10 to-[#1447e6]/10 rounded-full border border-[#ad46ff]/20">
                                <Paperclip className="h-4 w-4 text-[#ad46ff]" />
                                <span className="text-sm font-semibold text-[#ad46ff]">
                                    {files.length} file đã chọn
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="ml-auto text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
                                onClick={onClearAll}
                                disabled={isUploading}
                            >
                                Xóa tất cả
                            </Button>
                        </DialogTitle>
                    </DialogHeader>

                    {/* File Limit Validation */}
                    {files.length >= 5 && (
                        <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">!</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-1">
                                        Đã đạt giới hạn file
                                    </h4>
                                    <p className="text-xs text-orange-700 dark:text-orange-400 leading-relaxed">
                                        Chỉ thêm được tối đa 5 file. Vui lòng xóa một số file hiện tại trước khi thêm file mới.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-5 gap-4 p-4 max-h-[60vh] overflow-y-auto">
                        {files.map((filePreview, index) => (
                            <div
                                key={`dialog-${filePreview.file.name}-${index}`}
                                className="relative group"
                            >
                                <div className={cn(
                                    "relative overflow-hidden rounded-xl border-2 transition-all duration-300",
                                    "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 group-hover:border-[#ad46ff]/50 group-hover:shadow-xl group-hover:scale-105"
                                )}>
                                    {filePreview.previewUrl ? (
                                        // Dialog Image Display
                                        <div className="relative aspect-square">
                                            <img
                                                src={filePreview.previewUrl}
                                                alt="Preview"
                                                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                                            />

                                            {/* Dialog Image Badge */}
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-gradient-to-r from-[#ad46ff] to-[#1447e6] rounded-full flex items-center justify-center shadow-lg">
                                                <Image className="h-2.5 w-2.5 text-white" />
                                            </div>

                                            {/* Dialog Actions */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                                                    onClick={() => handleViewImage(filePreview)}
                                                    title="Xem ảnh"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                                                    onClick={() => onRemoveFile(index)}
                                                    disabled={isUploading}
                                                    title="Xóa file"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        // Dialog File Display
                                        <div className="relative aspect-square bg-gradient-to-br from-[#ad46ff]/10 to-[#1447e6]/10 flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="w-10 h-10 bg-gradient-to-r from-[#ad46ff] to-[#1447e6] rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                                    <FileText className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="text-sm font-bold text-[#ad46ff] bg-white/90 dark:bg-gray-800/90 px-2 py-0.5 rounded-lg shadow-sm">
                                                    {getFileExtension(filePreview.file.name)}
                                                </div>
                                            </div>

                                            {/* Dialog File Badge */}
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-gradient-to-r from-[#ad46ff] to-[#1447e6] rounded-full flex items-center justify-center shadow-lg">
                                                <FileText className="h-2.5 w-2.5 text-white" />
                                            </div>

                                            {/* Dialog Actions for Files */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                                                    onClick={() => onRemoveFile(index)}
                                                    disabled={isUploading}
                                                    title="Xóa file"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Dialog File Info */}
                                <div className="mt-2 text-center">
                                    <p className="text-xs font-medium truncate text-gray-900 dark:text-white leading-tight">
                                        {filePreview.file.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {formatFileSize(filePreview.file.size)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Image Viewer Modal */}
            <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
                    <div className="relative w-full h-full">
                        {/* Image Viewer Header */}
                        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                                        <Image className="h-4 w-4 text-white" />
                                        <span className="text-sm font-semibold text-white">
                                            {selectedImage?.file.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                                        <span className="text-sm font-semibold text-white">
                                            {formatFileSize(selectedImage?.file.size || 0)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-all duration-200"
                                        onClick={handleZoomOut}
                                        title="Thu nhỏ"
                                    >
                                        <ZoomOut className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-all duration-200"
                                        onClick={handleZoomIn}
                                        title="Phóng to"
                                    >
                                        <ZoomIn className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Image Display */}
                        <div className="w-full h-full flex items-center justify-center bg-black/90 p-4">
                            {selectedImage?.previewUrl && (
                                <div className="relative max-w-full max-h-full overflow-auto">
                                    <img
                                        src={selectedImage.previewUrl}
                                        alt={selectedImage.file.name}
                                        className="transition-all duration-300"
                                        style={{
                                            transform: `scale(${imageScale}) rotate(${imageRotation}deg)`,
                                            transformOrigin: 'center'
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Close Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 h-8 w-8 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-all duration-200"
                            onClick={() => setShowImageModal(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
