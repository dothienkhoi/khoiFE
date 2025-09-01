"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Upload, File, Image, Video, Music, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { uploadFile, uploadMultipleFiles } from '@/lib/customer-api-client';

interface FileUploadProps {
    onUploadComplete: (files: Array<{ success: boolean; data?: any; error?: string; fileName: string }>) => void;
    multiple?: boolean;
    accept?: string;
    maxFiles?: number;
    fileType?: 'image' | 'file' | 'video' | 'audio';
    className?: string;
}

interface FileWithPreview extends File {
    preview?: string;
    id: string;
}

export function FileUpload({
    onUploadComplete,
    multiple = false,
    accept = "*/*",
    maxFiles = 5,
    fileType = 'file',
    className = ""
}: FileUploadProps) {
    const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get file icon based on type
    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
        if (file.type.startsWith('video/')) return <Video className="h-4 w-4" />;
        if (file.type.startsWith('audio/')) return <Music className="h-4 w-4" />;

        // Check file extension for common file types
        const extension = file.name.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return <FileText className="h-4 w-4 text-red-500" />;
            case 'doc':
            case 'docx':
                return <FileText className="h-4 w-4 text-blue-500" />;
            case 'xls':
            case 'xlsx':
                return <FileText className="h-4 w-4 text-green-500" />;
            case 'ppt':
            case 'pptx':
                return <FileText className="h-4 w-4 text-orange-500" />;
            case 'zip':
            case 'rar':
            case '7z':
                return <FileText className="h-4 w-4 text-purple-500" />;
            case 'txt':
                return <FileText className="h-4 w-4 text-gray-500" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    // Format file size
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));

        // Add color coding for file sizes
        if (size > 100) return `${size} ${sizes[i]} (Lớn)`;
        if (size > 50) return `${size} ${sizes[i]} (Trung bình)`;
        return `${size} ${sizes[i]}`;
    };

    // Handle file selection
    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);

        if (files.length === 0) return;

        // Check max files limit
        if (multiple && files.length > maxFiles) {
            toast.error(`Chỉ có thể chọn tối đa ${maxFiles} file`);
            return;
        }

        // Check file size limits
        const maxSize = fileType === 'image' ? 10 * 1024 * 1024 :
            fileType === 'file' ? 50 * 1024 * 1024 :
                fileType === 'video' ? 100 * 1024 * 1024 :
                    fileType === 'audio' ? 20 * 1024 * 1024 : 50 * 1024 * 1024;

        const oversizedFiles = files.filter(file => file.size > maxSize);
        if (oversizedFiles.length > 0) {
            const maxSizeMB = Math.round(maxSize / (1024 * 1024));
            toast.error(`File ${oversizedFiles.map(f => f.name).join(', ')} quá lớn. Kích thước tối đa: ${maxSizeMB}MB`);
            return;
        }

        // Create file previews
        const filesWithPreviews: FileWithPreview[] = files.map(file => ({
            ...file,
            id: Math.random().toString(36).substr(2, 9),
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        }));

        setSelectedFiles(prev => multiple ? [...prev, ...filesWithPreviews] : filesWithPreviews);

        // Clear input value to allow selecting the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [multiple, maxFiles]);

    // Remove file
    const removeFile = useCallback((fileId: string) => {
        setSelectedFiles(prev => {
            const file = prev.find(f => f.id === fileId);
            if (file?.preview) {
                URL.revokeObjectURL(file.preview);
            }
            return prev.filter(f => f.id !== fileId);
        });
        setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
        });
    }, []);

    // Clear all files
    const clearAllFiles = useCallback(() => {
        selectedFiles.forEach(file => {
            if (file.preview) {
                URL.revokeObjectURL(file.preview);
            }
        });
        setSelectedFiles([]);
        setUploadProgress({});
    }, [selectedFiles]);

    // Upload files
    const handleUpload = useCallback(async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);
        setUploadProgress({});

        try {
            let results;

            if (multiple && selectedFiles.length > 1) {
                // Upload multiple files
                results = await uploadMultipleFiles(
                    selectedFiles,
                    fileType,
                    (progress) => {
                        // Update progress for all files
                        const progressPerFile = progress / selectedFiles.length;
                        const newProgress: Record<string, number> = {};
                        selectedFiles.forEach(file => {
                            newProgress[file.id] = progressPerFile;
                        });
                        setUploadProgress(newProgress);
                    }
                );
            } else {
                // Upload single file
                const file = selectedFiles[0];
                const result = await uploadFile(file, fileType, (progress) => {
                    setUploadProgress(prev => ({
                        ...prev,
                        [file.id]: progress
                    }));
                });
                results = { success: result.success, data: [result] };
            }

            if (results.success) {
                toast.success('Tải lên file thành công!');
                // Transform results to match expected format
                const transformedResults = results.data.map((result: any) => ({
                    success: result.success,
                    data: result.data,
                    error: result.error || undefined,
                    fileName: result.fileName || result.data?.fileName || 'Unknown file'
                }));
                onUploadComplete(transformedResults);
                clearAllFiles();
            } else {
                toast.error('Có lỗi xảy ra khi tải lên file');
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.message || 'Không thể tải lên file');
        } finally {
            setUploading(false);
            setUploadProgress({});
        }
    }, [selectedFiles, multiple, fileType, onUploadComplete, clearAllFiles]);

    // Drag and drop handlers
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            const event = { target: { files } } as any;
            handleFileSelect(event);
        }
    }, [handleFileSelect]);

    return (
        <div className={`space-y-4 ${className}`}>
            {/* File Input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                accept="*/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Upload Area */}
            <Card
                className={`border-2 border-dashed transition-colors ${isDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <CardContent className="p-6 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                        Kéo thả file vào đây hoặc click để chọn
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        {multiple
                            ? `Chọn tối đa ${maxFiles} file để tải lên`
                            : 'Chọn 1 file để tải lên'
                        }
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Hỗ trợ: Ảnh (10MB), File (50MB), Video (100MB), Audio (20MB)
                    </p>
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        variant="outline"
                    >
                        Chọn File
                    </Button>
                </CardContent>
            </Card>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium">File đã chọn ({selectedFiles.length})</h4>
                        <Button
                            onClick={clearAllFiles}
                            variant="ghost"
                            size="sm"
                            disabled={uploading}
                        >
                            Xóa tất cả
                        </Button>
                    </div>

                    {selectedFiles.map((file) => (
                        <Card key={file.id} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    {/* File Preview/Icon */}
                                    {file.preview ? (
                                        <img
                                            src={file.preview}
                                            alt={file.name}
                                            className="h-12 w-12 object-cover rounded-lg"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                                            {getFileIcon(file)}
                                        </div>
                                    )}

                                    {/* File Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{file.name}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>{formatFileSize(file.size)}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {file.type || file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {file.lastModified ? new Date(file.lastModified).toLocaleDateString('vi-VN') : 'Unknown date'}
                                        </p>
                                    </div>

                                    {/* Progress Bar */}
                                    {uploading && uploadProgress[file.id] !== undefined && (
                                        <div className="w-24">
                                            <Progress value={uploadProgress[file.id]} className="h-2" />
                                            <p className="text-xs text-center mt-1">
                                                {uploadProgress[file.id]}%
                                            </p>
                                        </div>
                                    )}

                                    {/* Remove Button */}
                                    <Button
                                        onClick={() => removeFile(file.id)}
                                        variant="ghost"
                                        size="sm"
                                        disabled={uploading}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Upload Button */}
                    <Button
                        onClick={handleUpload}
                        disabled={uploading || selectedFiles.length === 0}
                        className="w-full"
                        size="lg"
                    >
                        {uploading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Đang tải lên...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                Tải lên {selectedFiles.length} file
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
