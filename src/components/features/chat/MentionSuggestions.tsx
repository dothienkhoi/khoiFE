"use client";

import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getMentionSuggestions } from "@/lib/customer-api-client";

interface MentionUser {
    userId: string;
    fullName: string;
    avatarUrl?: string | null;
    presenceStatus?: string;
}

interface MentionSuggestionsProps {
    groupId: string;
    searchTerm: string;
    onSelectUser: (user: MentionUser) => void;
    onClose: () => void;
    position: { top: number; left: number };
}

export function MentionSuggestions({
    groupId,
    searchTerm,
    onSelectUser,
    onClose,
    position
}: MentionSuggestionsProps) {
    const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch suggestions when searchTerm changes
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!groupId) {
                setSuggestions([]);
                return;
            }

            setLoading(true);
            try {
                const response = await getMentionSuggestions(groupId, searchTerm);

                if (response.success && response.data) {
                    setSuggestions(response.data);
                    setSelectedIndex(0);
                } else {
                    setSuggestions([]);
                }
            } catch (error) {
                console.error("Failed to fetch mention suggestions:", error);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 200); // Debounce
        return () => clearTimeout(timeoutId);
    }, [groupId, searchTerm]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (suggestions.length === 0) return;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev < suggestions.length - 1 ? prev + 1 : 0
                    );
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev > 0 ? prev - 1 : suggestions.length - 1
                    );
                    break;
                case "Enter":
                    e.preventDefault();
                    if (suggestions[selectedIndex]) {
                        onSelectUser(suggestions[selectedIndex]);
                    }
                    break;
                case "Escape":
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [suggestions, selectedIndex, onSelectUser, onClose]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    // Always show the component if we have groupId, even with empty suggestions
    if (!groupId) {
        return null;
    }

    const getPresenceColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case "online": return "bg-green-500";
            case "away": return "bg-yellow-500";
            case "busy": return "bg-red-500";
            case "offline": return "bg-gray-400";
            default: return "bg-gray-400";
        }
    };

    const getPresenceText = (status?: string) => {
        switch (status?.toLowerCase()) {
            case "online": return "Trực tuyến";
            case "away": return "Tạm vắng";
            case "busy": return "Bận";
            case "offline": return "Ngoại tuyến";
            default: return "Không xác định";
        }
    };

    // Fallback position if position is invalid
    const finalPosition = {
        top: position.top > 0 ? position.top : 100,
        left: position.left > 0 ? position.left : 100,
    };

    return (
        <div
            ref={containerRef}
            className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto min-w-64"
            style={{
                top: finalPosition.top,
                left: finalPosition.left,
            }}
        >
            {loading ? (
                <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    Đang tải...
                </div>
            ) : suggestions.length > 0 ? (
                <div className="py-1">
                    {suggestions.map((user, index) => (
                        <div
                            key={user.userId}
                            className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${index === selectedIndex
                                ? "bg-[#ad46ff]/10 dark:bg-[#ad46ff]/20"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                            onClick={() => onSelectUser(user)}
                        >
                            <div className="relative">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatarUrl || undefined} />
                                    <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white text-sm">
                                        {user.fullName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div
                                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getPresenceColor(user.presenceStatus)}`}
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {user.fullName}
                                    </span>
                                    <Badge
                                        variant="secondary"
                                        className={`text-xs px-1.5 py-0.5 ${user.presenceStatus?.toLowerCase() === "online"
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                            }`}
                                    >
                                        {getPresenceText(user.presenceStatus)}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    {loading ? "Đang tải..." : "Không tìm thấy thành viên nào"}
                </div>
            )}
        </div>
    );
}
