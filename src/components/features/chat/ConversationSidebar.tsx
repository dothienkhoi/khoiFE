"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Search,
    Plus,
    User
} from "lucide-react";
import { useCustomerStore } from "@/store/customerStore";
import { Conversation } from "@/types/customer.types";
import { cn } from "@/lib/utils";
import { UserSearchPopup } from "@/components/providers/UserSearchPopup";

export function ConversationSidebar() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);

    const {
        conversations,
        activeChatId,
        activeChatType,
        setActiveChat,
        refreshConversations,
        markConversationAsRead
    } = useCustomerStore();

    // Load conversations on mount
    useEffect(() => {
        refreshConversations();
    }, [refreshConversations]);

    // Listen for refresh conversations event
    useEffect(() => {
        const handleRefreshConversations = async (event: CustomEvent) => {
            if (event.detail?.selectConversationId) {
                // Refresh conversations list
                await refreshConversations();

                // Select the new conversation
                setActiveChat(event.detail.selectConversationId.toString(), 'direct');
            }
        };

        window.addEventListener('refreshConversations', handleRefreshConversations as unknown as EventListener);

        return () => {
            window.removeEventListener('refreshConversations', handleRefreshConversations as unknown as EventListener);
        };
    }, [refreshConversations, setActiveChat]);

    // Filter conversations based on search
    const filteredConversations = conversations.filter(conversation =>
        (conversation.displayName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleConversationClick = async (conversation: Conversation) => {
        setActiveChat(conversation.conversationId.toString(), 'direct');

        // Mark conversation as read if it has unread messages
        if (conversation.unreadCount > 0) {
            await markConversationAsRead(conversation.conversationId);
        }
    };

    const formatLastSeen = (lastSeen?: string) => {
        if (!lastSeen) return '';
        const date = new Date(lastSeen);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Vừa xong';
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
        return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-[#ad46ff]/10 to-[#1447e6]/10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Trò chuyện cá nhân</h2>
                </div>

                {/* Search Input with Action Button */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />

                    {/* Action Button Inside Search */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsUserSearchOpen(true)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-lg bg-gradient-to-r from-[#ad46ff]/10 to-[#1447e6]/10 hover:from-[#ad46ff]/20 hover:to-[#1447e6]/20 text-[#ad46ff] hover:text-[#ad46ff]/80 shadow-sm transition-all duration-300"
                        title="Tìm người nhắn tin"
                    >
                        <Plus className="h-3 w-3" />
                    </Button>

                    <Input
                        placeholder="Tìm kiếm..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-12 h-10 border-gray-200 dark:border-gray-700 focus:border-[#ad46ff] focus:ring-[#ad46ff]/20 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredConversations.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <User className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-base font-medium">Không có cuộc trò chuyện nào</p>
                        <p className="text-sm text-gray-400 mt-2">Tìm kiếm người để bắt đầu trò chuyện</p>
                    </div>
                ) : (
                    filteredConversations.map((conversation) => (
                        <div
                            key={conversation.conversationId}
                            className={cn(
                                "group flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-md border border-transparent hover:border-gray-200 dark:hover:border-gray-700",
                                activeChatId === conversation.conversationId.toString() && activeChatType === 'direct' && "bg-[#ad46ff]/10 border-[#ad46ff]/20 shadow-lg"
                            )}
                            onClick={() => handleConversationClick(conversation)}
                        >
                            <Avatar className="h-12 w-12 ring-2 ring-gray-200 dark:ring-gray-700">
                                <AvatarImage src={conversation.avatarUrl} />
                                <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white font-bold text-lg">
                                    {(conversation.displayName || 'Unknown').split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-bold text-gray-900 dark:text-white text-base">
                                        {conversation.displayName || 'Unknown User'}
                                    </p>
                                    {conversation.lastMessageTimestamp && (
                                        <span className="text-xs text-gray-500 font-medium">
                                            {formatLastSeen(conversation.lastMessageTimestamp)}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                        {conversation.lastMessagePreview ? (
                                            conversation.lastMessagePreview
                                        ) : (
                                            'Chưa có tin nhắn nào'
                                        )}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        {conversation.unreadCount > 0 && (
                                            <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* User Search Popup */}
            <UserSearchPopup
                isOpen={isUserSearchOpen}
                onClose={() => setIsUserSearchOpen(false)}
                onStartChat={() => { }}
            />
        </div>
    );
}
