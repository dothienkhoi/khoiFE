"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Copy, ArrowLeft, Search, UserPlus, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { searchUsersForInvite, inviteUserToGroup, createGroupInviteLink } from "@/lib/customer-api-client";
import { debounce } from "lodash-es";

interface InviteMembersDialogProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: string;
    groupName: string;
    onBackToGroupDetails?: () => void;
}

interface User {
    userId: string;
    fullName: string;
    avatarUrl?: string;
    isInvited?: boolean;
    lastInvitedAt?: number; // Timestamp of last invitation
    canReinvite?: boolean; // Whether user can be reinvited
}

export function InviteMembersDialog({
    isOpen,
    onClose,
    groupId,
    groupName,
    onBackToGroupDetails
}: InviteMembersDialogProps) {
    const [inviteLink, setInviteLink] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isInviting, setIsInviting] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [cooldownUsers, setCooldownUsers] = useState<Record<string, number>>({}); // userId -> timestamp
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);

    // Generate invite link khi dialog mở
    useEffect(() => {
        if (groupId && isOpen) {
            generateInviteLink();
        }
    }, [groupId, isOpen]);

    const generateInviteLink = async () => {
        if (!groupId) return;

        setIsGeneratingLink(true);
        try {
            const response = await createGroupInviteLink(groupId, {
                expiresInHours: 24, // Link hết hạn sau 24 giờ
                maxUses: 10 // Tối đa 10 lần sử dụng
            });

            if (response.success) {
                // Tạo URL frontend với invitationCode
                const inviteUrl = `${window.location.origin}/invite/${response.data.invitationCode}`;
                setInviteLink(inviteUrl);
            } else {
                // Fallback nếu API không thành công
                const basicLink = `${window.location.origin}/invite/fallback`;
                setInviteLink(basicLink);
                console.warn("Không thể tạo invite link từ API, sử dụng fallback");
            }
        } catch (error) {
            console.error("Failed to generate invite link:", error);
            // Fallback nếu có lỗi
            const basicLink = `${window.location.origin}/invite/fallback`;
            setInviteLink(basicLink);
            toast.error("Không thể tạo link mời, sử dụng link cơ bản");
        } finally {
            setIsGeneratingLink(false);
        }
    };

    // Debounced search - chỉ gọi API khi có search query
    const debouncedSearch = useCallback(
        debounce(async (query: string) => {
            if (query.trim()) {
                setIsLoadingUsers(true);
                try {
                    const response = await searchUsersForInvite(groupId, query);
                    setUsers(response.data || []);
                } catch (error) {
                    console.error("Failed to search users:", error);
                    toast.error("Không thể tìm kiếm người dùng");
                    setUsers([]);
                } finally {
                    setIsLoadingUsers(false);
                }
            } else {
                // Xóa danh sách khi không có search query
                setUsers([]);
                setIsLoadingUsers(false);
            }
        }, 500),
        [groupId]
    );

    // Trigger search when query changes
    useEffect(() => {
        if (isOpen) {
            debouncedSearch(searchQuery);
        }
    }, [searchQuery, isOpen, debouncedSearch]);

    // Reset users khi đóng dialog
    useEffect(() => {
        if (!isOpen) {
            setUsers([]);
            setSearchQuery("");
        }
    }, [isOpen]);

    const handleCopyInviteLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            toast.success("Đã sao chép link mời");
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error("Không thể sao chép link");
        }
    };

    const handleInviteUser = async (userId: string) => {
        // Check cooldown
        const now = Date.now();
        const lastInvited = cooldownUsers[userId];
        const cooldownTime = 20 * 1000; // 20 seconds in milliseconds

        if (lastInvited && (now - lastInvited) < cooldownTime) {
            const remainingTime = Math.ceil((cooldownTime - (now - lastInvited)) / 1000);
            toast.error(`Vui lòng đợi ${remainingTime} giây trước khi gửi lại lời mời`);
            return;
        }

        setIsInviting(userId);
        try {
            await inviteUserToGroup(groupId, [userId]);

            // Update local state
            setUsers(prev => prev.map(user =>
                user.userId === userId
                    ? { ...user, isInvited: true, lastInvitedAt: now }
                    : user
            ));

            // Set cooldown
            setCooldownUsers(prev => ({
                ...prev,
                [userId]: now
            }));

            toast.success("Đã gửi lời mời");
        } catch (error) {
            console.error("Failed to invite user:", error);
            toast.error("Không thể gửi lời mời");
        } finally {
            setIsInviting(null);
        }
    };

    const handleBackToGroupDetails = () => {
        if (onBackToGroupDetails) {
            onBackToGroupDetails();
        }
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="sm:max-w-[600px] max-h-[80vh] flex flex-col"
                aria-describedby="invite-members-description"
            >
                <DialogHeader className="flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {onBackToGroupDetails && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleBackToGroupDetails}
                                className="h-8 w-8"
                                aria-label="Quay lại trang chi tiết nhóm"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <div className="flex-1">
                            <DialogTitle className="text-xl font-semibold">
                                Mời thành viên
                            </DialogTitle>
                            <DialogDescription
                                id="invite-members-description"
                                className="text-sm text-muted-foreground mt-1"
                            >
                                Mời người khác tham gia nhóm "{groupName}"
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 space-y-6 overflow-hidden">
                    {/* Invite Link Section */}
                    <div className="space-y-3 flex-shrink-0">
                        <Label className="text-sm font-medium">Link mời nhóm</Label>
                        <div className="flex gap-2">
                            <Input
                                value={inviteLink}
                                readOnly
                                className="bg-muted/50 font-mono text-sm"
                                placeholder={isGeneratingLink ? "Đang tạo link..." : "Link mời nhóm"}
                            />
                            <Button
                                size="sm"
                                onClick={handleCopyInviteLink}
                                variant={copied ? "default" : "outline"}
                                disabled={isGeneratingLink || !inviteLink}
                                className={cn(
                                    "transition-all duration-200",
                                    copied && "bg-green-600 hover:bg-green-700"
                                )}
                            >
                                {isGeneratingLink ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : copied ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isGeneratingLink
                                ? "Đang tạo link mời..."
                                : "Chia sẻ link này để mời người khác tham gia nhóm"
                            }
                        </p>
                    </div>

                    <Separator />

                    {/* Search and Invite Friends Section */}
                    <div className="space-y-3 flex-1 flex flex-col min-h-0">
                        <Label className="text-sm font-medium">Mời bạn bè</Label>

                        {/* Search Input */}
                        <div className="relative flex-shrink-0">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm bạn bè..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Users List */}
                        <ScrollArea className="flex-1 min-h-0">
                            {isLoadingUsers ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    <span className="ml-2 text-sm text-muted-foreground">
                                        Đang tìm kiếm...
                                    </span>
                                </div>
                            ) : searchQuery && users.length > 0 ? (
                                <div className="space-y-2">
                                    {users.map((user) => (
                                        <div
                                            key={user.userId}
                                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={user.avatarUrl} />
                                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                                        {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">
                                                        {user.fullName}
                                                    </span>
                                                </div>
                                            </div>

                                            {(() => {
                                                const now = Date.now();
                                                const lastInvited = cooldownUsers[user.userId];
                                                const cooldownTime = 20 * 1000; // 20 seconds
                                                const isInCooldown = lastInvited && (now - lastInvited) < cooldownTime;
                                                const remainingTime = isInCooldown ? Math.ceil((cooldownTime - (now - lastInvited)) / 1000) : 0;

                                                if (isInCooldown) {
                                                    return (
                                                        <Badge variant="outline" className="text-xs text-muted-foreground">
                                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                            {remainingTime}s
                                                        </Badge>
                                                    );
                                                } else if (user.isInvited) {
                                                    return (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleInviteUser(user.userId)}
                                                            disabled={isInviting === user.userId}
                                                            className="shrink-0"
                                                        >
                                                            {isInviting === user.userId ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <UserPlus className="h-3 w-3 mr-1" />
                                                            )}
                                                            Gửi lại
                                                        </Button>
                                                    );
                                                } else {
                                                    return (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleInviteUser(user.userId)}
                                                            disabled={isInviting === user.userId}
                                                            className="shrink-0"
                                                        >
                                                            {isInviting === user.userId ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <UserPlus className="h-3 w-3 mr-1" />
                                                            )}
                                                            Mời
                                                        </Button>
                                                    );
                                                }
                                            })()}
                                        </div>
                                    ))}
                                </div>
                            ) : searchQuery && users.length === 0 && !isLoadingUsers ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <Search className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-medium mb-2">
                                        Không tìm thấy người dùng
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Không có kết quả cho "{searchQuery}"<br />
                                        Thử tìm kiếm với từ khóa khác
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <Search className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-medium mb-2">
                                        Tìm kiếm người dùng
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Nhập tên người dùng để tìm kiếm và mời vào nhóm
                                    </p>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
                    <Button variant="outline" onClick={onClose}>
                        Đóng
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
