"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
    Video,
    Search,
    User,
    Phone,
    PhoneOff,
    X,
    ArrowUp,
    ArrowDown
} from "lucide-react";
import { Conversation, Message } from "@/types/customer.types";
import { cn } from "@/lib/utils";
import { useCustomerStore } from "@/store/customerStore";
import UserProfileDialog from "./UserProfileDialog";

interface DirectChatHeaderProps {
    conversation: Conversation;
    onVideoCall?: () => void;
    onSearchMessages?: () => void;
    onShowUserProfile?: () => void;
    isVideoCallActive?: boolean;
}

export function DirectChatHeader({
    conversation,
    onVideoCall,
    onSearchMessages,
    onShowUserProfile,
    isVideoCallActive = false
}: DirectChatHeaderProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Message[]>([]);
    const [currentResultIndex, setCurrentResultIndex] = useState(-1);
    const [isSearching, setIsSearching] = useState(false);
    const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

    const { messages } = useCustomerStore();

    // Lấy tin nhắn của conversation hiện tại
    const conversationMessages = useMemo(() => {
        return messages[conversation.conversationId] || [];
    }, [messages, conversation.conversationId]);

    // Lấy tên người dùng
    const userName = conversation.displayName || "Người dùng không tên";

    // Lấy avatar người dùng
    const userAvatar = conversation.avatarUrl;

    // Tạo initials từ tên người dùng
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Handle search toggle
    const handleSearchToggle = () => {
        setIsSearchOpen(!isSearchOpen);
        if (isSearchOpen) {
            setSearchQuery("");
            setSearchResults([]);
            setCurrentResultIndex(-1);
        }
    };

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.trim()) {
            performSearch(query);
        } else {
            setSearchResults([]);
            setCurrentResultIndex(-1);
        }
    };

    // Perform search in messages
    const performSearch = (query: string) => {
        if (!query.trim() || conversationMessages.length === 0) {
            setSearchResults([]);
            setCurrentResultIndex(-1);
            return;
        }

        setIsSearching(true);

        // Tìm kiếm trong tin nhắn
        const results = conversationMessages.filter(message => {
            if (message.content) {
                return message.content.toLowerCase().includes(query.toLowerCase());
            }
            return false;
        });

        setSearchResults(results);
        setCurrentResultIndex(results.length > 0 ? 0 : -1);
        setIsSearching(false);

        // Auto-scroll to first result if found
        if (results.length > 0) {
            setTimeout(() => {
                const messageId = results[0].id;
                window.dispatchEvent(new CustomEvent('scrollToMessage', {
                    detail: { messageId }
                }));
            }, 100);
        }
    };

    // Navigate through search results
    const navigateResults = (direction: 'next' | 'prev') => {
        if (searchResults.length === 0) return;

        let newIndex: number;
        if (direction === 'next') {
            newIndex = currentResultIndex < searchResults.length - 1 ? currentResultIndex + 1 : 0;
        } else {
            newIndex = currentResultIndex > 0 ? currentResultIndex - 1 : searchResults.length - 1;
        }

        setCurrentResultIndex(newIndex);

        // Scroll to the new selected message
        if (searchResults[newIndex]) {
            const messageId = searchResults[newIndex].id;
            window.dispatchEvent(new CustomEvent('scrollToMessage', {
                detail: { messageId }
            }));
        }
    };

    // Handle search submit
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            performSearch(searchQuery);
        }
    };

    // Scroll to message when result is selected
    useEffect(() => {
        if (currentResultIndex >= 0 && searchResults[currentResultIndex]) {
            const messageId = searchResults[currentResultIndex].id;
            // Emit event để scroll đến message
            window.dispatchEvent(new CustomEvent('scrollToMessage', {
                detail: { messageId }
            }));
        }
    }, [currentResultIndex, searchResults]);

    // Auto-search when search query changes
    useEffect(() => {
        if (searchQuery.trim()) {
            performSearch(searchQuery);
        }
    }, [searchQuery]);

    // Handle user profile toggle
    const handleUserProfileToggle = () => {
        setIsUserProfileOpen(!isUserProfileOpen);
    };

    return (
        <>
            <div
                className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="flex items-center justify-between">
                    {/* Thông tin người dùng bên trái */}
                    <div className="flex items-center gap-4">
                        {/* Avatar người dùng */}
                        <Avatar className="h-12 w-12 ring-2 ring-gray-200 dark:ring-gray-700">
                            <AvatarImage src={userAvatar} />
                            <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white font-bold text-lg">
                                {getInitials(userName)}
                            </AvatarFallback>
                        </Avatar>

                        {/* Tên và trạng thái người dùng */}
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                {userName}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                <span>Trò chuyện cá nhân</span>
                            </div>
                        </div>
                    </div>

                    {/* Các icon chức năng bên phải */}
                    <div className="flex items-center gap-2">
                        {/* Tìm kiếm tin nhắn - Toggle between button and search bar */}
                        <div className="relative">
                            {isSearchOpen ? (
                                <div className="flex flex-col items-end">
                                    <form onSubmit={handleSearchSubmit} className="flex items-center">
                                        <div className={cn(
                                            "flex items-center bg-gray-100 dark:bg-gray-800 rounded-full transition-all duration-300 ease-in-out shadow-sm border border-gray-200 dark:border-gray-700",
                                            "animate-in slide-in-from-right-2"
                                        )}>
                                            <Search className="h-4 w-4 text-gray-500 ml-3 flex-shrink-0" />
                                            <Input
                                                type="text"
                                                placeholder="Tìm kiếm tin nhắn..."
                                                value={searchQuery}
                                                onChange={handleSearchChange}
                                                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-8 w-48 px-2 text-sm placeholder:text-gray-400"
                                                autoFocus
                                            />

                                            {/* Search Results Navigation */}
                                            {searchResults.length > 0 && (
                                                <div className="flex items-center gap-1 mr-1">
                                                    <span className="text-xs text-gray-500 px-1">
                                                        {currentResultIndex + 1}/{searchResults.length}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigateResults('prev')}
                                                        className="h-6 w-6 p-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                                        title="Kết quả trước"
                                                    >
                                                        <ArrowUp className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigateResults('next')}
                                                        className="h-6 w-6 p-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                                        title="Kết quả tiếp theo"
                                                    >
                                                        <ArrowDown className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )}

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleSearchToggle}
                                                className="h-8 w-8 p-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-1 flex-shrink-0"
                                                title="Đóng tìm kiếm"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </form>

                                    {/* Search Results Summary */}
                                    {searchResults.length > 0 && (
                                        <div className="mt-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                                            Tìm thấy {searchResults.length} tin nhắn
                                            {currentResultIndex >= 0 && (
                                                <span className="ml-2 font-medium">
                                                    • Đang xem: {currentResultIndex + 1}/{searchResults.length}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* No Results */}
                                    {searchQuery.trim() && searchResults.length === 0 && !isSearching && (
                                        <div className="mt-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-500 dark:text-gray-400">
                                            Không tìm thấy tin nhắn nào
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSearchToggle}
                                    disabled={!onSearchMessages}
                                    className={cn(
                                        "h-10 w-10 p-0 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800",
                                        !onSearchMessages && "opacity-50 cursor-not-allowed"
                                    )}
                                    title="Tìm kiếm tin nhắn"
                                >
                                    <Search className="h-5 w-5" />
                                </Button>
                            )}
                        </div>

                        {/* Video call button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onVideoCall}
                            disabled={!onVideoCall}
                            className={cn(
                                "h-10 w-10 p-0 rounded-full transition-all duration-200",
                                isVideoCallActive
                                    ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-800",
                                !onVideoCall && "opacity-50 cursor-not-allowed"
                            )}
                            title={isVideoCallActive ? "Kết thúc cuộc gọi" : "Bắt đầu cuộc gọi video"}
                        >
                            {isVideoCallActive ? (
                                <PhoneOff className="h-5 w-5" />
                            ) : (
                                <Video className="h-5 w-5" />
                            )}
                        </Button>

                        {/* Thông tin người dùng button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleUserProfileToggle}
                            className="h-10 w-10 p-0 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Thông tin người dùng"
                        >
                            <User className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* User Profile Dialog */}
            <UserProfileDialog
                isOpen={isUserProfileOpen}
                onClose={() => setIsUserProfileOpen(false)}
                user={{
                    id: conversation.conversationId.toString(),
                    displayName: userName,
                    avatar: userAvatar,
                    isOnline: false
                }}
            />
        </>
    );
}
