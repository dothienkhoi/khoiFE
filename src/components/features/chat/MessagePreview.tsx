// components/features/chat/MessagePreview.tsx
"use client";

import { Image, FileText, MessageCircle, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessagePreviewProps {
    messageType: string;
    content: string;
    className?: string;
}

export function MessagePreview({ messageType, content, className }: MessagePreviewProps) {
    const getIcon = () => {
        switch (messageType) {
            case 'Image':
                return <Image className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
            case 'File':
                return <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
            case 'Poll':
                return <BarChart3 className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
            case 'Text':
            default:
                return <MessageCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
        }
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {getIcon()}
            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {content}
            </span>
        </div>
    );
}
