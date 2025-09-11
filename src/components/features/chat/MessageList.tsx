"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Message } from "@/types/customer.types";
import { useCustomerStore } from "@/store/customerStore";
import { getMessageHistory } from "@/lib/customer-api-client";
import { useAuthStore } from "@/store/authStore";
import { useChatHub } from "@/components/providers/ChatHubProvider";

import { cn } from "@/lib/utils";
import { formatMessageTime } from "@/lib/dateUtils";
import {
    Image as ImageIcon,
    File,
    MessageCircle,
    Check,
    CheckCheck
} from "lucide-react";
import { PollMessage } from "./PollMessage";
import { ImageGallery } from "./ImageGallery";
import { ChickenLoadingAnimation, BouncingDots } from "@/components/ui/loading-animation";
import { ReplyMessage } from "../boback/ReplyMessage";
import { MessageReplyActions } from "../boback/MessageReplyActions";

interface MessageListProps {
    conversationId: number;
    partnerName: string;
    partnerAvatar?: string;
    onReplyToMessage?: (message: Message) => void;
    chatType?: 'direct' | 'group';
}

export function MessageList({ conversationId, partnerName, partnerAvatar, onReplyToMessage, chatType = 'direct' }: MessageListProps) {
    const { messages, setMessages, markMessagesAsRead: markMessagesAsReadStore } = useCustomerStore();
    const { user: currentUser } = useAuthStore();
    const { joinConversation, leaveConversation, markMessagesAsRead } = useChatHub();
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


    useEffect(() => {
        if (conversationId) {
            joinConversation(conversationId);
        }

        return () => {
            if (conversationId) {
                leaveConversation(conversationId);
            }
        };
    }, [conversationId, joinConversation, leaveConversation]);


    // Mark messages as read when user views the conversation
    useEffect(() => {
        if (conversationId && conversationMessages.length > 0 && currentUser?.id) {
            // Get unread messages from other users
            const unreadMessages = conversationMessages.filter(msg =>
                msg.sender.userId !== currentUser.id && !msg.isRead
            );

            if (unreadMessages.length > 0) {
                const messageIds = unreadMessages.map(msg => msg.id);
                // Mark as read in local store immediately for UI feedback
                markMessagesAsReadStore(conversationId, messageIds);

                // Send to server via SignalR with a small delay to ensure proper timing
                setTimeout(() => {
                    markMessagesAsRead(conversationId, messageIds);
                }, 100);
            }
        }
    }, [conversationId, conversationMessages, currentUser?.id, markMessagesAsRead, markMessagesAsReadStore]);

    // Listen for messages marked as read event from server
    useEffect(() => {
        const handleMessagesMarkedAsRead = (event: CustomEvent) => {
            const { conversationId: eventConversationId, messageIds, readerUserId } = event.detail;
            if (eventConversationId === conversationId) {
                // Update local store to reflect server confirmation
                markMessagesAsReadStore(conversationId, messageIds);
            }
        };

        // Listen for new messages to auto-mark as read if user is viewing
        const handleNewMessage = (event: CustomEvent) => {
            const { conversationId: eventConversationId, message, isFromCurrentUser } = event.detail;

            if (eventConversationId === conversationId && !isFromCurrentUser && currentUser?.id) {
                // Auto-mark new message as read if user is currently viewing this conversation
                setTimeout(() => {
                    markMessagesAsReadStore(conversationId, [message.id]);
                    markMessagesAsRead(conversationId, [message.id]);
                }, 500);
            }
        };

        // Listen for user joining conversation to mark messages as read
        const handleUserJoinedConversation = (event: CustomEvent) => {
            const { conversationId: eventConversationId, userId } = event.detail;

            if (eventConversationId === conversationId && userId !== currentUser?.id) {
                // When someone joins the conversation, mark all unread messages as read
                const unreadMessages = conversationMessages.filter(msg =>
                    msg.sender.userId !== currentUser?.id && !msg.isRead
                );

                if (unreadMessages.length > 0) {
                    const messageIds = unreadMessages.map(msg => msg.id);
                    setTimeout(() => {
                        markMessagesAsReadStore(conversationId, messageIds);
                        markMessagesAsRead(conversationId, messageIds);
                    }, 100);
                }
            }
        };

        window.addEventListener('messagesMarkedAsRead', handleMessagesMarkedAsRead as EventListener);
        window.addEventListener('newMessageReceived', handleNewMessage as EventListener);
        window.addEventListener('userJoinedConversation', handleUserJoinedConversation as EventListener);

        return () => {
            window.removeEventListener('messagesMarkedAsRead', handleMessagesMarkedAsRead as EventListener);
            window.removeEventListener('newMessageReceived', handleNewMessage as EventListener);
            window.removeEventListener('userJoinedConversation', handleUserJoinedConversation as EventListener);
        };
    }, [conversationId, markMessagesAsReadStore, markMessagesAsRead, currentUser?.id]);


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

            // Remove highlight after 1 second
            setTimeout(() => {
                setHighlightedMessageId(null);
            }, 1000);
        }
    }, []);

    // Handle toggle reaction
    const handleToggleReaction = useCallback((message: Message, reactionCode: string) => {
        // TODO: Implement reaction toggle API call
        // console.log('Toggle reaction:', { messageId: message.id, reactionCode });
    }, []);

    const loadMessages = async (beforeMessageId?: string) => {
        if (isLoadingMore) return;

        if (beforeMessageId) {
            setIsLoadingMore(true);
        } else {
            // For initial load, we need to show loading state
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
            setIsLoadingMore(false);
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

    // Render read status indicator for messages
    const renderReadStatus = useCallback((message: Message) => {
        const own = isOwnMessage(message);

        // Show status for both own and other's messages
        return (
            <div className="flex items-center gap-1 mt-1">
                {message.isRead === true ? (
                    <div title="Đã xem">
                        <CheckCheck className="h-3 w-3 text-blue-500" />
                    </div>
                ) : (
                    <div title="Đã gửi">
                        <Check className="h-3 w-3 text-gray-400" />
                    </div>
                )}
            </div>
        );
    }, [isOwnMessage]);

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
                    </div>
                );

            default:
                return (
                    <p className="text-sm text-muted-foreground italic">
                        Loại tin nhắn không được hỗ trợ: {typeof message.messageType === 'number' ?
                            ['Text', 'Image', 'File', 'System', 'Poll'][message.messageType - 1] || 'Unknown' :
                            message.messageType}
                    </p>
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
                className="flex-1 overflow-y-auto p-4 scrollbar-hide min-h-0"
                onScroll={handleScroll}
                style={{
                    scrollbarWidth: 'none', /* Firefox */
                    msOverflowStyle: 'none'  /* Internet Explorer 10+ */
                }}
            >
                <div className="space-y-4">
                    {isLoadingMore && conversationMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ad46ff] mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">Đang tải tin nhắn...</p>
                        </div>
                    ) : conversationMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50 dark:bg-gray-900">
                            <div className="w-32 h-32 bg-gradient-to-r from-[#ad46ff]/10 to-[#1447e6]/10 rounded-full flex items-center justify-center mb-6">
                                <MessageCircle className="w-16 h-16 text-[#ad46ff]" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                Chào mừng đến với FastBite Chat
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-lg mb-6 max-w-md">
                                Hãy Gửi Một Tin Nhắn Để Bắt Đầu Một Cuộc Trò Chuyện.
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <div className="w-2 h-2 bg-[#ad46ff] rounded-full"></div>
                                <span>{chatType === 'group' ? 'Trò chuyện nhóm' : 'Trò chuyện cá nhân'}</span>
                            </div>
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
                                        {/* Reply Container - Wrapped Layout */}
                                        {message.parentMessage ? (
                                            <div className={cn(
                                                "border-2 border-primary/30 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 p-3 shadow-sm relative",
                                                own ? "border-r-0 rounded-r-none" : "border-l-0 rounded-l-none"
                                            )}>
                                                {/* Reply Preview */}
                                                <ReplyMessage
                                                    parentMessage={message.parentMessage}
                                                    isOwnMessage={own}
                                                    onScrollToMessage={scrollToMessage}
                                                    parentMessageId={message.parentMessageId}
                                                />

                                                {/* Current Message Bubble */}
                                                <div className={cn(
                                                    "flex items-end gap-1 mt-2",
                                                    own ? "flex-row-reverse" : "flex-row"
                                                )}>
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

                                                    {/* Action buttons beside bubble */}
                                                    <MessageReplyActions
                                                        message={message}
                                                        isOwnMessage={own}
                                                        onReplyToMessage={onReplyToMessage}
                                                        onToggleReaction={handleToggleReaction}
                                                    />
                                                </div>

                                                {/* Timestamp and read status inside container */}
                                                {message.sentAt && (
                                                    <div className={cn(
                                                        "flex items-center gap-2 text-[11px] text-muted-foreground mt-1",
                                                        own ? "justify-end" : "justify-start"
                                                    )}>
                                                        <span>{formatMessageTime(message.sentAt)}</span>
                                                        {renderReadStatus(message)}
                                                    </div>
                                                )}

                                                {/* Reply Indicator Arrow */}
                                                <div className={cn(
                                                    "absolute w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent",
                                                    own
                                                        ? "right-[-8px] top-1/2 transform -translate-y-1/2 border-l-8 border-l-primary/30"
                                                        : "left-[-8px] top-1/2 transform -translate-y-1/2 border-r-8 border-r-primary/30"
                                                )}></div>
                                            </div>
                                        ) : (
                                            /* Normal message without reply */
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
                                                <MessageReplyActions
                                                    message={message}
                                                    isOwnMessage={own}
                                                    onReplyToMessage={onReplyToMessage}
                                                    onToggleReaction={handleToggleReaction}
                                                />
                                            </div>
                                        )}

                                        {/* Timestamp and read status below for normal messages */}
                                        {!message.parentMessage && message.sentAt && (
                                            <div className={cn(
                                                "flex items-center gap-2 text-[11px] text-muted-foreground",
                                                own ? "self-end" : "self-start"
                                            )}>
                                                <span>{formatMessageTime(message.sentAt)}</span>
                                                {renderReadStatus(message)}
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
