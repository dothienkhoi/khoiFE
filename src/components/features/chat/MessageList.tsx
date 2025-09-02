"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Message } from "@/types/customer.types";
import { useCustomerStore } from "@/store/customerStore";
import { getMessageHistory } from "@/lib/customer-api-client";
import { useAuthStore } from "@/store/authStore";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
    Image as ImageIcon,
    File,
    MoreHorizontal,
    Reply,
    Heart
} from "lucide-react";
import { PollMessage } from "./PollMessage";
import { ImageGallery } from "./ImageGallery";
import { ChickenLoadingAnimation, BouncingDots } from "@/components/ui/loading-animation";

interface MessageListProps {
    conversationId: number;
    partnerName: string;
    partnerAvatar?: string;
    onReplyToMessage?: (message: Message) => void;
}

export function MessageList({ conversationId, partnerName, partnerAvatar, onReplyToMessage }: MessageListProps) {
    const { messages, setMessages } = useCustomerStore();
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const messageRefs = useRef<Record<string, HTMLDivElement>>({});

    // Lấy messages cho conversation hiện tại
    const conversationMessages = useMemo(() =>
        messages[conversationId] || [],
        [messages, conversationId]
    );

    // Auto scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollContainerRef.current && conversationMessages.length > 0) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [conversationMessages.length]);

    // Poll for new messages as fallback when SignalR fails
    useEffect(() => {
        if (!conversationId) return;

        const pollInterval = setInterval(async () => {
            try {
                // Get latest message timestamp
                const latestMessage = conversationMessages[conversationMessages.length - 1];
                if (!latestMessage) return;

                // Poll for messages newer than the latest one
                const response = await getMessageHistory(conversationId, undefined, 50);
                if (response.success) {
                    const newMessages = response.data.messages.filter(msg =>
                        new Date(msg.sentAt) > new Date(latestMessage.sentAt)
                    );

                    if (newMessages.length > 0) {
                        setMessages(conversationId, [...conversationMessages, ...newMessages]);
                    }
                }
            } catch (error) {
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(pollInterval);
    }, [conversationId, conversationMessages, setMessages]);

    // Load initial messages
    useEffect(() => {
        if (conversationId && conversationMessages.length === 0) {
            loadMessages();
        }
    }, [conversationId, conversationMessages.length]);

    // Listen for scroll to message event from search
    useEffect(() => {
        const handleScrollToMessage = (event: CustomEvent) => {
            const { messageId } = event.detail;
            if (messageId) {
                scrollToMessage(messageId);
            }
        };

        window.addEventListener('scrollToMessage', handleScrollToMessage as EventListener);
        return () => {
            window.removeEventListener('scrollToMessage', handleScrollToMessage as EventListener);
        };
    }, [conversationMessages]);

    // Scroll to specific message and highlight it
    const scrollToMessage = useCallback((messageId: string) => {
        const messageElement = messageRefs.current[messageId];
        if (messageElement && scrollContainerRef.current) {
            // Scroll to message
            messageElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            // Highlight message
            setHighlightedMessageId(messageId);

            // Remove highlight after 3 seconds
            setTimeout(() => {
                setHighlightedMessageId(null);
            }, 3000);
        }
    }, []);

    const loadMessages = async (beforeMessageId?: string) => {
        if (isLoadingMore) return;

        if (beforeMessageId) {
            setIsLoadingMore(true);
        }

        try {
            const response = await getMessageHistory(conversationId, beforeMessageId, 20);

            if (response.success) {
                const { messages: items, hasMore: more, nextCursor: cursor } = response.data;

                if (beforeMessageId) {
                    // Loading older messages - prepend to existing messages after delay
                    setTimeout(() => {
                        const newMessages = [...items, ...conversationMessages];
                        setMessages(conversationId, newMessages);

                        // Preserve scroll position after loading older messages
                        setTimeout(() => {
                            if (scrollContainerRef.current) {
                                const scrollHeight = scrollContainerRef.current.scrollHeight;
                                const oldScrollHeight = scrollHeight - (items.length * 100); // Approximate height per message
                                const scrollDiff = scrollHeight - oldScrollHeight;
                                scrollContainerRef.current.scrollTop = scrollDiff;
                            }
                        }, 100);
                    }, 2500); // Wait for chicken animation to complete
                } else {
                    // Initial load - replace all messages
                    setMessages(conversationId, items);
                }

                setHasMore(more);
                setNextCursor(cursor);
            } else {
                setHasMore(false);
            }
        } catch (error: any) {
            setHasMore(false);
        } finally {
            if (beforeMessageId) {
                setIsLoadingMore(false);
            }
        }
    };

    const loadMoreMessages = useCallback(() => {
        if (hasMore && nextCursor && !isLoadingMore) {
            loadMessages(nextCursor);
        }
    }, [hasMore, nextCursor, isLoadingMore, loadMessages]);

    const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop } = event.currentTarget;
        // Load more when user scrolls to top (within 100px) and has more than 10 messages
        if (scrollTop < 100 && hasMore && !isLoadingMore && conversationMessages.length > 10) {
            loadMoreMessages();
        }
    }, [hasMore, isLoadingMore, loadMoreMessages, conversationMessages.length]);

    const formatMessageTime = useCallback((timestamp: string) => {
        return formatDistanceToNow(new Date(timestamp), {
            addSuffix: true,
            locale: vi
        });
    }, []);

    const isOwnMessage = useCallback((message: Message) => {
        const currentUser = useAuthStore.getState().user;
        const currentUserId = currentUser?.id || "";
        return !!currentUserId && message.sender && message.sender.userId === currentUserId;
    }, []);

    // Helpers to deal with different attachment shapes from APIs
    const getAttachmentUrl = useCallback((attachment: any): string => {
        return attachment?.storageUrl ?? attachment?.fileUrl ?? "";
    }, []);

    const getAttachmentName = useCallback((attachment: any): string => {
        return attachment?.fileName ?? "Tệp";
    }, []);

    const getAttachmentSizeMB = useCallback((attachment: any): string => {
        const size = attachment?.fileSize ?? 0;
        return (size / 1024 / 1024).toFixed(2);
    }, []);

    const getAttachmentType = useCallback((attachment: any): string => {
        return attachment?.fileType ?? attachment?.mimeType ?? "";
    }, []);

    const isImageUrl = useCallback((url: string): boolean => {
        return /(\.png|\.jpe?g|\.gif|\.bmp|\.webp|\.avif)(\?.*)?$/i.test(url);
    }, []);

    // Render message content based on type
    const renderMessageContent = useCallback((message: Message) => {
        if (!message.messageType) {
            return (
                <p className="text-sm text-muted-foreground italic">
                    Tin nhắn không có loại
                </p>
            );
        }

        switch (message.messageType) {
            case 'Text':
                return (
                    <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content || 'Tin nhắn không có nội dung'}
                    </p>
                );

            case 'Image':
                return (
                    <ImageGallery
                        images={
                            (message.attachments && message.attachments.length > 0
                                ? message.attachments.map((att: any) => ({
                                    url: getAttachmentUrl(att),
                                    name: getAttachmentName(att),
                                    type: getAttachmentType(att)
                                }))
                                : (message.content && isImageUrl(message.content))
                                    ? [{
                                        url: message.content,
                                        name: partnerName,
                                        type: 'image'
                                    }]
                                    : []
                            )
                        }
                    />
                );

            case 'File':
                return (
                    <div className="space-y-2">
                        {(message.attachments && message.attachments.length > 0
                            ? message.attachments
                            : []
                        ).map((att: any, idx: number) => {
                            const url = getAttachmentUrl(att);
                            const type = getAttachmentType(att);
                            const isImage = typeof type === 'string' && type.startsWith('image/');
                            return (
                                <div key={`${message.id}-attachment-${idx}`} className="flex items-center gap-3 p-2 bg-background/20 rounded">
                                    <div className="p-2 rounded bg-white/60">
                                        {isImage ? (
                                            <ImageIcon className="h-4 w-4" />
                                        ) : (
                                            <File className="h-4 w-4" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium truncate" title={getAttachmentName(att)}>
                                            {getAttachmentName(att)}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">{getAttachmentSizeMB(att)} MB</p>
                                    </div>
                                    <button
                                        className="text-xs underline"
                                        onClick={() => window.open(url, '_blank')}
                                    >
                                        Tải xuống
                                    </button>
                                </div>
                            );
                        })}

                        {/* Fallback: show content as a link if looks like URL */}
                        {(!message.attachments || message.attachments.length === 0) && message.content && (
                            <div className="bg-background/20 rounded p-2">
                                <a className="text-xs underline" href={message.content} target="_blank" rel="noreferrer">
                                    {message.content}
                                </a>
                            </div>
                        )}
                    </div>
                );

            case 'Poll':
                return (
                    <PollMessage
                        message={message}
                        isOwnMessage={isOwnMessage(message)}
                        conversationId={conversationId}
                    />
                );

            default:
                return (
                    <p className="text-sm">{message.content || 'Tin nhắn không có nội dung'}</p>
                );
        }
    }, [getAttachmentUrl, getAttachmentName, getAttachmentType, isImageUrl, partnerName, isOwnMessage, conversationId]);

    // Loading state removed - messages will load silently

    return (
        <div className="h-full flex flex-col">
            {/* Loading indicator removed - messages will load silently */}

            {/* Scrollable messages container */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4 scrollbar-hide"
                onScroll={handleScroll}
                style={{
                    scrollbarWidth: 'none', /* Firefox */
                    msOverflowStyle: 'none'  /* Internet Explorer 10+ */
                }}
            >
                <div className="space-y-4">
                    {conversationMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <p className="text-sm">Chưa có tin nhắn nào</p>
                        </div>
                    ) : (
                        conversationMessages.map((message) => {
                            const own = isOwnMessage(message);
                            const isHighlighted = highlightedMessageId === message.id;

                            return (
                                <div
                                    ref={(el) => {
                                        if (el && message.id) messageRefs.current[message.id] = el;
                                    }}
                                    key={`message-${message.id || 'unknown'}-${message.sentAt || 'unknown'}`}
                                    className={cn(
                                        "flex gap-3 group transition-all duration-300",
                                        own ? "justify-end" : "justify-start",
                                        isHighlighted && "animate-pulse"
                                    )}
                                    style={{
                                        backgroundColor: isHighlighted ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                        borderRadius: isHighlighted ? '8px' : '0',
                                        padding: isHighlighted ? '8px' : '0',
                                        margin: isHighlighted ? '4px 0' : '0'
                                    }}
                                >
                                    {!own && message.sender && (
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                            <AvatarImage src={message.sender.avatarUrl || undefined} />
                                            <AvatarFallback className="text-xs">
                                                {message.sender.displayName ?
                                                    message.sender.displayName.split(' ').map(n => n[0]).join('') :
                                                    'U'
                                                }
                                            </AvatarFallback>
                                        </Avatar>
                                    )}

                                    <div className={cn(
                                        "group/message flex flex-col gap-1 max-w-[70%] w-fit",
                                        own ? "items-end" : "items-start"
                                    )}>

                                        {/* Reply Preview */}
                                        {message.parentMessage && message.parentMessage.sender && (
                                            <div className={cn(
                                                "mb-2 p-2 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border-l-4 border-primary/60 text-xs shadow-sm",
                                                own ? "text-right" : "text-left"
                                            )}>
                                                <div className="flex items-center gap-1 mb-1">
                                                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"></div>
                                                    <span className="text-primary font-semibold text-xs">
                                                        Trả lời {message.parentMessage.sender.displayName || 'Người dùng'}
                                                    </span>
                                                </div>
                                                <div className="bg-background/90 rounded-md p-2 border border-primary/20 shadow-sm">
                                                    <p className="text-muted-foreground line-clamp-1 text-xs font-medium">
                                                        {message.parentMessage.content || 'Tin nhắn không có nội dung'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}


                                        <div className={cn(
                                            "flex items-end gap-1",
                                            own ? "flex-row-reverse" : "flex-row"
                                        )}>
                                            {/* Message Bubble */}
                                            <div
                                                className={cn(
                                                    "px-3 py-2 rounded-lg",
                                                    own
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-foreground"
                                                )}
                                            >
                                                {renderMessageContent(message)}
                                            </div>

                                            {/* Action buttons beside bubble - show for all messages */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 hover:bg-accent/50"
                                                    onClick={() => onReplyToMessage?.(message)}
                                                    title="Trả lời tin nhắn"
                                                >
                                                    <Reply className="h-3 w-3" />
                                                </Button>
                                                {own && (
                                                    <>
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-accent/50">
                                                            <Heart className="h-3 w-3" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-accent/50">
                                                            <MoreHorizontal className="h-3 w-3" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Timestamp below */}
                                        {message.sentAt && (
                                            <div className={cn(
                                                "text-[11px] text-muted-foreground",
                                                own ? "self-end" : "self-start"
                                            )}>
                                                {formatMessageTime(message.sentAt)}
                                            </div>
                                        )}

                                        {/* Message reactions - only show if there are reactions */}
                                        {message.reactions && message.reactions.length > 0 && (
                                            <div className={cn("flex gap-1", own ? "self-end" : "self-start")}>
                                                {message.reactions.map((reaction) => (
                                                    <span
                                                        key={`reaction-${reaction.id}-${reaction.userId}`}
                                                        className="text-xs bg-muted px-2 py-1 rounded-full"
                                                    >
                                                        {reaction.emoji}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
