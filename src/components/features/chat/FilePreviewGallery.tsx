"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FilePreviewModal } from './FilePreviewModal';

interface FilePreview {
    url: string;
    name: string;
    size: number;
    type: string;
}

interface FilePreviewGalleryProps {
    files: FilePreview[];
    onRemoveFile: (index: number) => void;
    onRemoveAll: () => void;
}

export function FilePreviewGallery({ files, onRemoveFile, onRemoveAll }: FilePreviewGalleryProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (files.length === 0) return null;

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };



    return (
        <>
            <div className="absolute bottom-20 right-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-lg max-w-md z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">File đã chọn</h4>
                        <span className="inline-flex items-center justify-center text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 font-medium">
                            {files.length}/5
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                            {files.reduce((total, file) => total + file.size, 0) > 0 && (
                                <span>• {formatFileSize(files.reduce((total, file) => total + file.size, 0))}</span>
                            )}
                        </span>
                        {files.length > 3 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                (3/{files.length})
                            </span>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRemoveAll}
                        className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20 transition-all duration-200"
                    >
                        Xóa tất cả
                    </Button>
                </div>

                {/* File Preview Gallery */}
                <div className="flex gap-3">
                    {files.slice(0, 3).map((file, index) => (
                        <div
                            key={index}
                            className="group/file relative flex-1 overflow-hidden rounded-lg"
                        >
                            {/* File Preview */}
                            <div className="aspect-square w-full overflow-hidden rounded-lg">
                                {file.type.startsWith('image/') && file.url ? (
                                    <img
                                        src={file.url}
                                        alt={file.name}
                                        className="h-full w-full object-cover transition-all duration-300 group-hover/file:scale-105 rounded-lg"
                                    />
                                ) : null}


                            </div>

                            {/* File Info */}
                            <div className="p-2 bg-white dark:bg-gray-800">
                                <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate" title={file.name}>
                                    {file.name}
                                </p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                    {formatFileSize(file.size)}
                                </p>
                            </div>

                            {/* File Type Badge */}
                            <div className="absolute top-2 left-2">
                                <div className={cn(
                                    "px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                                    file.type.startsWith('image/') && "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
                                    file.type.startsWith('video/') && "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
                                    file.type.startsWith('audio/') && "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
                                    !file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/') && "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300"
                                )}>
                                    {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Show remaining files count if more than 3 */}
                    {files.length > 3 && (
                        <div className="group/file relative flex-shrink-0 w-28 overflow-hidden rounded-lg cursor-pointer hover:scale-105 transition-all duration-300"
                            onClick={() => setIsModalOpen(true)}>
                            <div className="aspect-square w-full overflow-hidden rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 flex items-center justify-center hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-950/50 dark:hover:to-blue-950/50 transition-all duration-300">
                                <div className="text-center">
                                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                                        +{files.length - 3}
                                    </div>
                                    <div className="text-xs text-purple-600 dark:text-purple-400">
                                        ảnh khác
                                    </div>
                                </div>
                            </div>

                            {/* File Info */}
                            <div className="p-2 bg-white dark:bg-gray-800">
                                <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                                    Click để xem
                                </p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                    {files.slice(3).reduce((total, file) => total + file.size, 0) > 0 && (
                                        <span>{formatFileSize(files.slice(3).reduce((total, file) => total + file.size, 0))}</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* File Preview Modal */}
            <FilePreviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                files={files}
                title="Tất cả file đã chọn"
            />
        </>
    );
}

