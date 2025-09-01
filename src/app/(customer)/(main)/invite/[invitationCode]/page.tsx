"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Shield, Calendar, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { getGroupPreviewByInviteCode, acceptGroupInvitation } from "@/lib/customer-api-client";
import { useCustomerStore } from "@/store/customerStore";
import { toast } from "sonner";

interface GroupPreview {
    groupId: string;
    groupName: string;
    groupAvatarUrl: string;
    memberCount: number;
}

export default function GroupInvitePage() {
    const params = useParams();
    const router = useRouter();
    const { setActiveNavItem } = useCustomerStore();
    const [groupPreview, setGroupPreview] = useState<GroupPreview | null>(null);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const invitationCode = params.invitationCode as string;

    useEffect(() => {
        if (invitationCode) {
            loadGroupPreview();
        }
    }, [invitationCode]);

    const loadGroupPreview = async () => {
        setError(null);

        try {
            const response = await getGroupPreviewByInviteCode(invitationCode);

            if (response.success) {
                setGroupPreview(response.data);
            } else {
                setError(response.message || "Không thể tải thông tin nhóm");
            }
        } catch (error: any) {
            console.error("Failed to load group preview:", error);
            if (error.response?.status === 404) {
                setError("Mã mời không hợp lệ hoặc đã hết hạn");
            } else {
                setError("Có lỗi xảy ra khi tải thông tin nhóm");
            }
        }
    };

    const handleJoinGroup = async () => {
        if (!invitationCode) return;

        // Check if user is authenticated
        const authToken = document.cookie.includes('auth_token');
        if (!authToken) {
            // Redirect to login with return URL
            const returnUrl = encodeURIComponent(window.location.href);
            router.push(`/login?returnUrl=${returnUrl}`);
            return;
        }

        setIsJoining(true);
        try {
            const response = await acceptGroupInvitation(invitationCode);

            if (response.success) {
                toast.success("Đã tham gia nhóm thành công!");

                // Refresh groups list
                const refreshEvent = new CustomEvent('refreshGroups');
                window.dispatchEvent(refreshEvent);

                // Navigate to the chat page
                router.push('/chat');
            } else {
                toast.error(response.message || "Không thể tham gia nhóm");
            }
        } catch (error: any) {
            console.error("Failed to join group:", error);
            if (error.response?.status === 401) {
                toast.error("Vui lòng đăng nhập để tham gia nhóm");
                const returnUrl = encodeURIComponent(window.location.href);
                router.push(`/login?returnUrl=${returnUrl}`);
            } else if (error.response?.status === 404) {
                toast.error("Mã mời không hợp lệ hoặc đã hết hạn");
            } else {
                toast.error("Có lỗi xảy ra khi tham gia nhóm");
            }
        } finally {
            setIsJoining(false);
        }
    };



    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">
                        Không thể tải thông tin nhóm
                    </h2>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <Button onClick={() => router.push('/chat')} variant="outline">
                        Quay lại trang chat
                    </Button>
                </div>
            </div>
        );
    }

    if (!groupPreview) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-xl">Lời mời tham gia nhóm</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Bạn đã được mời tham gia nhóm này
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Group Info */}
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={groupPreview.groupAvatarUrl} />
                            <AvatarFallback className="text-lg font-semibold">
                                {groupPreview.groupName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg">{groupPreview.groupName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {groupPreview.memberCount} thành viên
                                </span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Group Details */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Loại nhóm</span>
                            <Badge variant="secondary" className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                Công khai
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Ngày tạo</span>
                            <span className="text-sm">Gần đây</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="space-y-3">
                        <Button
                            onClick={handleJoinGroup}
                            disabled={isJoining}
                            className="w-full"
                            size="lg"
                        >
                            {isJoining ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Đang tham gia...
                                </>
                            ) : (
                                <>
                                    <Users className="h-4 w-4 mr-2" />
                                    Tham gia nhóm
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={() => router.push('/chat')}
                            variant="outline"
                            className="w-full"
                        >
                            Hủy bỏ
                        </Button>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                            Bằng cách tham gia, bạn đồng ý với các quy tắc của nhóm
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
