"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
    MessageCircle,
    Users,
    Check,
    CheckCheck
} from "lucide-react";
import { useCustomerStore } from "@/store/customerStore";
import { getConversations } from "@/lib/customer-api-client";
import { Conversation } from "@/types/customer.types";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ConversationsListProps {
    activeConversationId?: number;
}

export function ConversationsList({ activeConversationId }: ConversationsListProps) {
    const {
        conversations,
        setConversations,
        isLoadingContacts,
        setLoadingContacts,
        setActiveChat
    } = useCustomerStore();

    const [isLoading, setIsLoading] = useState(false);
    const [pendingSelectId, setPendingSelectId] = useState<number | null>(null);

    // Load conversations on component mount
    useEffect(() => {
        loadConversations();

        const handleRefresh = (e: Event) => {
            const custom = e as CustomEvent<{ selectConversationId?: number }>;
            const selectId = custom.detail?.selectConversationId ?? null;
            if (selectId) setPendingSelectId(selectId);
            loadConversations();
        };

        window.addEventListener('refreshConversations', handleRefresh);
        return () => {
            window.removeEventListener('refreshConversations', handleRefresh);
        };
    }, []);

    // Load conversations from API
    const loadConversations = useCallback(async () => {
        if (isLoading) return;

        setIsLoading(true);
        setLoadingContacts(true);

        try {
            const response = await getConversations('direct');

            if (response.success) {
                setConversations(response.data);

                // Handle pending selection after loading
                if (pendingSelectId) {
                    const found = response.data.find(c => c.conversationId === pendingSelectId);
                    if (found) {
                        setActiveChat(found.conversationId.toString(), 'direct');
                    }
                    setPendingSelectId(null);
                }
            } else {
                // Set empty conversations to avoid UI errors
                setConversations([]);
            }
        } catch (error: any) {

            // Handle specific error types
            if (error.response) {
                const status = error.response.status;
                if (status === 500) {
                    // Set empty conversations to avoid UI errors
                    setConversations([]);
                } else if (status === 401) {
                    setConversations([]);
                } else if (status === 404) {
                    setConversations([]);
                } else {
                    setConversations([]);
                }
            } else if (error.request) {
                setConversations([]);
            } else {
                setConversations([]);
            }

            // Don't show error to user since this is expected when backend is not ready
        } finally {
            setIsLoading(false);
            setLoadingContacts(false);
        }
    }, [isLoading, pendingSelectId, setConversations, setActiveChat, setLoadingContacts]);

    // Get message status icon based on type and read status
    const getMessageStatusIcon = useCallback((messageType: string, isRead?: boolean) => {
        switch (messageType) {
            case 'Text':
                return isRead ?
                    <CheckCheck className="h-3 w-3 text-blue-500" /> :
                    <Check className="h-3 w-3 text-muted-foreground" />;
            case 'Image':
            case 'File':
            default:
                return <MessageCircle className="h-3 w-3 text-muted-foreground" />;
        }
    }, []);

    // Get conversation icon based on type
    const getConversationIcon = useCallback((conversationType: string) => {
        switch (conversationType) {
            case 'Direct':
                return <MessageCircle className="h-4 w-4" />;
            case 'Group':
                return <Users className="h-4 w-4" />;
            default:
                return <MessageCircle className="h-4 w-4" />;
        }
    }, []);

    // Handle conversation selection
    const handleConversationSelect = useCallback((conversation: Conversation) => {
        setActiveChat(conversation.conversationId.toString(), 'direct');
    }, [setActiveChat]);

    // Handle start new conversation
    const handleStartConversation = useCallback(() => {
        const event = new CustomEvent('openUserSearch');
        window.dispatchEvent(event);
    }, []);

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="flex items-center gap-3 p-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-3 w-16" />
                    </div>
                ))}
            </div>
        );
    }

    // Empty state
    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <MessageCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Không có cuộc trò chuyện nào</h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartConversation}
                >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Bắt đầu trò chuyện
                </Button>
            </div>
        );
    }

    // Conversations list
    return (
        <ScrollArea className="h-full scrollbar-hide">
            <div className="space-y-1 p-2">
                {conversations.map((conversation) => (
                    <div
                        key={`conversation-${conversation.conversationId}`}
                        className={cn(
                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50",
                            activeConversationId === conversation.conversationId && "bg-muted/70"
                        )}
                        onClick={() => handleConversationSelect(conversation)}
                    >
                        {/* Avatar with unread indicator */}
                        <div className="relative">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={conversation.avatarUrl} />
                                <AvatarFallback className="text-sm">
                                    {conversation.displayName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            {conversation.unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-background" />
                            )}
                        </div>

                        {/* Conversation details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium truncate">
                                    {conversation.displayName}
                                </h4>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    {getMessageStatusIcon(conversation.lastMessageType, conversation.unreadCount === 0)}
                                    <span>
                                        {formatDistanceToNow(new Date(conversation.lastMessageTimestamp), {
                                            addSuffix: true,
                                            locale: vi
                                        })}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground truncate flex-1">
                                    {conversation.lastMessagePreview || "Không có tin nhắn nào"}
                                </p>
                                {conversation.unreadCount > 0 && (
                                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
