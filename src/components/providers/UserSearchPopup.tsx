// components/features/chat/UserSearchPopup.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Search,
    X,
    UserPlus,
    MessageCircle
} from "lucide-react";
import { searchUsers, findOrCreateConversation } from "@/lib/customer-api-client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UserSearchResult {
    userId: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
}

interface UserSearchPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onStartChat: (userId: string, displayName: string) => void;
}

export function UserSearchPopup({ isOpen, onClose, onStartChat }: UserSearchPopupProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [allUsers, setAllUsers] = useState<UserSearchResult[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load all users when popup opens
    useEffect(() => {
        if (isOpen && !isInitialized) {
            loadAllUsers();
        }
    }, [isOpen, isInitialized]);

    // Debounced search
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchQuery.trim().length >= 2) {
            searchTimeoutRef.current = setTimeout(() => {
                performSearch();
            }, 300); // Giảm delay xuống 300ms vì không cần gọi API
        } else {
            setSearchResults([]);
            setHasSearched(false);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

    const loadAllUsers = async () => {
        try {
            const response = await searchUsers({
                query: "",
                pageNumber: 1,
                pageSize: 100
            });

            if (response.success) {
                setAllUsers(response.data.items);
                setIsInitialized(true);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const performSearch = () => {
        if (!searchQuery.trim() || !isInitialized) return;

        setIsLoading(true);
        setHasSearched(true);

        try {
            // Lọc từ cache allUsers
            const filteredUsers = allUsers.filter(user =>
                user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase())
            );

            setSearchResults(filteredUsers);
        } catch (error) {
            console.error('Error filtering users:', error);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartChat = async (user: UserSearchResult) => {
        try {
            // Import store to avoid circular dependency
            const { useCustomerStore } = await import('@/store/customerStore');
            const { startDirectChat } = useCustomerStore.getState();

            const result = await startDirectChat(user.userId);

            if (result.success) {
                // Call the parent callback
                onStartChat(user.userId, user.displayName);
                onClose();
                setSearchQuery("");
                setSearchResults([]);
                setHasSearched(false);
            } else {
                toast.error(result.message || "Không thể tạo cuộc trò chuyện. Vui lòng thử lại.");
            }
        } catch (error: any) {
            // Handle specific error cases with Vietnamese messages
            if (error.message?.includes('Network error')) {
                toast.error("Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.");
            } else if (error.message?.includes('Request timeout')) {
                toast.error("Yêu cầu bị timeout. Máy chủ có thể đang quá tải, vui lòng thử lại sau.");
            } else if (error.message?.includes('server is running')) {
                toast.error("Không thể kết nối đến máy chủ. Vui lòng kiểm tra xem máy chủ có đang chạy không.");
            } else if (error.message?.includes('Authentication failed')) {
                toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            } else if (error.message?.includes('User not found')) {
                toast.error("Không tìm thấy người dùng này hoặc endpoint không khả dụng.");
            } else if (error.message?.includes('Server error')) {
                toast.error("Lỗi máy chủ. Vui lòng thử lại sau.");
            } else if (error.response?.status === 400) {
                toast.error("Yêu cầu không hợp lệ. Vui lòng kiểm tra thông tin và thử lại.");
            } else if (error.response?.status === 401) {
                toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại");
            } else if (error.response?.status === 403) {
                toast.error("Bạn không có quyền tạo cuộc trò chuyện với người dùng này");
            } else if (error.response?.status === 404) {
                toast.error("Không tìm thấy người dùng hoặc endpoint không khả dụng");
            } else if (error.response?.status >= 500) {
                toast.error("Lỗi máy chủ. Vui lòng thử lại sau");
            } else {
                toast.error("Có lỗi xảy ra. Vui lòng thử lại sau");
            }
        }
    };

    const handleClose = () => {
        onClose();
        setSearchQuery("");
        setSearchResults([]);
        setHasSearched(false);
        // Không reset allUsers và isInitialized để cache lại cho lần sau
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Tìm kiếm người dùng
                    </DialogTitle>
                    <DialogDescription>
                        Nhập tên hoặc email để tìm kiếm người dùng khác.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm theo tên hoặc email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                            autoFocus
                        />
                    </div>

                    {/* Search Results */}
                    <div className="max-h-80">
                        {isLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : hasSearched ? (
                            searchResults.length > 0 ? (
                                <ScrollArea className="h-80">
                                    <div className="space-y-2">
                                        {searchResults.map((user) => (
                                            <div
                                                key={user.userId}
                                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                            >
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={user.avatarUrl || undefined} />
                                                    <AvatarFallback>
                                                        {user.displayName.split(' ').map(n => n[0]).join('')}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{user.displayName}</p>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {user.email}
                                                    </p>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStartChat(user);
                                                    }}
                                                    className="shrink-0"
                                                >
                                                    <MessageCircle className="h-4 w-4 mr-1" />
                                                    Nhắn tin
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>Không tìm thấy người dùng nào</p>
                                    <p className="text-sm">Thử tìm kiếm với từ khóa khác</p>
                                </div>
                            )
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Nhập tên hoặc email để tìm kiếm</p>
                                <p className="text-sm">Tối thiểu 2 ký tự</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
