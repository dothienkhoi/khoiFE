import React from 'react';
import { X, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface FilePreview {
    url: string;
    name: string;
    size: number;
    type: string;
}

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    files: FilePreview[];
    title?: string;
}

export function FilePreviewModal({ isOpen, onClose, files, title = "Tất cả file đã chọn" }: FilePreviewModalProps) {
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleDownload = (file: FilePreview) => {
        const a = document.createElement('a');
        a.href = file.url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handlePreview = (file: FilePreview) => {
        if (file.type.startsWith('image/')) {
            window.open(file.url, '_blank');
        }
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) {
            return <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🖼️</span>
            </div>;
        }
        if (type.startsWith('video/')) {
            return <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎥</span>
            </div>;
        }
        if (type.startsWith('audio/')) {
            return <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎵</span>
            </div>;
        }
        return <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/30 rounded-lg flex items-center justify-center">
            <span className="text-2xl">📄</span>
        </div>;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-purple-700 dark:text-purple-300">
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {files.map((file, index) => (
                            <div
                                key={index}
                                className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                            >
                                {/* File Preview */}
                                <div className="aspect-square w-full overflow-hidden bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
                                    {file.type.startsWith('image/') && file.url ? (
                                        <img
                                            src={file.url}
                                            alt={file.name}
                                            className="h-full w-full object-cover transition-all duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center">
                                            {getFileIcon(file.type)}
                                        </div>
                                    )}

                                    {/* File Type Badge */}
                                    <div className="absolute top-2 left-2">
                                        <div className={`
                                            px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm
                                            ${file.type.startsWith('image/') && "bg-purple-100/90 text-purple-700 dark:bg-purple-900/80 dark:text-purple-300"}
                                            ${file.type.startsWith('video/') && "bg-red-100/90 text-red-700 dark:bg-red-900/80 dark:text-red-300"}
                                            ${file.type.startsWith('audio/') && "bg-green-100/90 text-green-700 dark:bg-green-900/80 dark:text-green-300"}
                                            ${!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/') && "bg-gray-100/90 text-gray-700 dark:bg-gray-900/80 dark:text-gray-300"}
                                        `}>
                                            {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <div className="flex gap-2">
                                            {file.type.startsWith('image/') && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handlePreview(file)}
                                                    className="bg-white/90 text-black hover:bg-white shadow-lg"
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Xem
                                                </Button>
                                            )}
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleDownload(file)}
                                                className="bg-white/90 text-black hover:bg-white shadow-lg"
                                            >
                                                <Download className="h-4 w-4 mr-1" />
                                                Tải
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* File Info */}
                                <div className="p-4">
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-2 line-clamp-2" title={file.name}>
                                        {file.name}
                                    </h4>
                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <span>{formatFileSize(file.size)}</span>
                                        <span className="text-purple-600 dark:text-purple-400 font-medium">
                                            #{index + 1}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{files.length}</span> file được chọn
                        {files.reduce((total, file) => total + file.size, 0) > 0 && (
                            <span className="ml-2">
                                • Tổng: <span className="font-medium">{formatFileSize(files.reduce((total, file) => total + file.size, 0))}</span>
                            </span>
                        )}
                    </div>
                    <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-700 text-white">
                        Đóng
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
