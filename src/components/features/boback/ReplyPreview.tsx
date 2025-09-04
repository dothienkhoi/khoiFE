"use client";

import { Button } from "@/components/ui/button";
import { X, FileText, Image } from "lucide-react";
import { Message } from "@/types/customer.types";

interface ReplyPreviewProps {
    replyTo: Message;
    onCancelReply?: () => void;
}

export function ReplyPreview({ replyTo, onCancelReply }: ReplyPreviewProps) {
    if (!replyTo) return null;

    const renderContent = () => {
        // Kiểm tra loại tin nhắn để hiển thị phù hợp
        if (replyTo.messageType === 'Image') {
            return (
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-muted rounded flex items-center justify-center">
                        <Image className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">Hình ảnh</span>
                </div>
            );
        }

        if (replyTo.messageType === 'File') {
            return (
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-muted rounded flex items-center justify-center">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">Tệp tin</span>
                </div>
            );
        }

        // Tin nhắn văn bản hoặc có attachments
        if (replyTo.content) {
            return (
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {replyTo.content}
                </p>
            );
        }

        if (replyTo.attachments && replyTo.attachments.length > 0) {
            return (
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-muted rounded flex items-center justify-center">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {replyTo.attachments.length} tệp đính kèm
                    </span>
                </div>
            );
        }

        // Tin nhắn không có nội dung
        return (
            <p className="text-sm text-muted-foreground italic">
                Tin nhắn không có nội dung
            </p>
        );
    };

    return (
        <div className="mb-3 p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border-l-4 border-primary shadow-lg">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <p className="font-semibold text-xs text-primary">
                            Trả lời {replyTo.sender?.displayName || 'Người dùng'}
                        </p>
                    </div>
                    <div className="bg-background/90 rounded-md p-2 border border-primary/20 shadow-sm">
                        {renderContent()}
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                    onClick={onCancelReply}
                    title="Hủy trả lời"
                    disabled={!onCancelReply}
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}
