"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, Calendar, User, FileText } from "lucide-react";
import { useProfile } from "@/components/providers/ProfileProvider";

export function ProfileInfo() {
    const { userProfile, isRefreshing } = useProfile();

    if (!userProfile) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md profile-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                        <User className="h-5 w-5" />
                        Thông tin cơ bản
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">Email</p>
                            <p className="text-sm text-muted-foreground">
                                {isRefreshing ? "Đang cập nhật..." : userProfile.email}
                            </p>
                        </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">Họ và tên</p>
                            <p className="text-sm text-muted-foreground">
                                {isRefreshing ? "Đang cập nhật..." : (
                                    userProfile.fullName || 'Chưa cập nhật'
                                )}
                            </p>
                        </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">Ngày sinh</p>
                            <p className="text-sm text-muted-foreground">
                                {isRefreshing ? "Đang cập nhật..." : (
                                    userProfile.dateOfBirth ?
                                        new Date(userProfile.dateOfBirth).toLocaleDateString('vi-VN') :
                                        'Chưa cập nhật'
                                )}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-md profile-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                        <FileText className="h-5 w-5" />
                        Giới thiệu
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground">
                                {isRefreshing ? "Đang cập nhật..." : (
                                    userProfile.bio || 'Chưa cập nhật'
                                )}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-md profile-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                        <User className="h-5 w-5" />
                        Trạng thái tài khoản
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Xác thực 2FA</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${userProfile.twoFactorEnabled
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                            }`}>
                            {isRefreshing ? "Đang cập nhật..." : (
                                userProfile.twoFactorEnabled ? 'Đã bật' : 'Chưa bật'
                            )}
                        </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Trạng thái</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-500">
                            {isRefreshing ? "Đang cập nhật..." : "Hoạt động"}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
