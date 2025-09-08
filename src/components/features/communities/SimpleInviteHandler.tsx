"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { getGroupPreviewByInviteCode, acceptGroupInvitation } from "@/lib/customer-api-client";
import { InvitationLinkInfo } from "@/types/customer.types";
import { toast } from "sonner";
import { handleApiError } from "@/lib/utils";

export function SimpleInviteHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [invitationInfo, setInvitationInfo] = useState<InvitationLinkInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAccepting, setIsAccepting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const invitationCode = searchParams.get('code');

    useEffect(() => {
        if (invitationCode) {
            loadInvitationInfo();
        } else {
            setError("Mã mời không hợp lệ");
            setIsLoading(false);
        }
    }, [invitationCode]);

    const loadInvitationInfo = async () => {
        if (!invitationCode) return;

        setIsLoading(true);
        setError(null);

        try {
            console.log("Loading invitation info for code:", invitationCode);
            const response = await getGroupPreviewByInviteCode(invitationCode);
            console.log("Invitation info response:", response);

            if (response.success && response.data) {
                setInvitationInfo(response.data);
            } else {
                setError(response.message || "Không thể tải thông tin lời mời");
            }
        } catch (error) {
            console.error("Error loading invitation info:", error);
            setError("Không thể tải thông tin lời mời");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcceptInvitation = async () => {
        if (!invitationCode || !invitationInfo) return;

        setIsAccepting(true);

        try {
            console.log("Accepting invitation for code:", invitationCode);
            const response = await acceptGroupInvitation(invitationCode);
            console.log("Accept invitation response:", response);

            if (response.success && response.data) {
                toast.success("Đã tham gia nhóm thành công!");
                // Điều hướng trực tiếp sang trang Nhóm, mở đúng cuộc trò chuyện của nhóm
                const conversationId = response.data.defaultConversationId;
                router.push(`/groups?conversationId=${conversationId}`);
            } else {
                throw new Error(response.message || "Không thể tham gia nhóm");
            }
        } catch (error) {
            console.error("Error accepting invitation:", error);
            handleApiError(error, "Không thể tham gia nhóm");
        } finally {
            setIsAccepting(false);
        }
    };

    const handleDecline = () => {
        router.push("/communities");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                            <XCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <CardTitle className="text-red-600">Lỗi</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push("/communities")} className="w-full">
                            Quay lại cộng đồng
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!invitationInfo) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <Users className="h-8 w-8 text-green-500" />
                    </div>
                    <CardTitle>Lời mời tham gia nhóm</CardTitle>
                    <CardDescription>
                        Bạn được mời tham gia một nhóm cộng đồng
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Group Info */}
                    <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={invitationInfo.groupAvatarUrl} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                {invitationInfo.groupName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">{invitationInfo.groupName}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {invitationInfo.memberCount} thành viên
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                        <Button
                            onClick={handleAcceptInvitation}
                            disabled={isAccepting}
                            className="flex-1"
                        >
                            {isAccepting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Đang tham gia...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Tham gia
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleDecline}
                            disabled={isAccepting}
                            className="flex-1"
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Từ chối
                        </Button>
                    </div>

                    {/* Info */}
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                            Bằng cách tham gia, bạn đồng ý với các quy tắc và điều khoản của nhóm
                        </p>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
