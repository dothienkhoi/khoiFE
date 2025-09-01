"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Calendar, Mail, Users, FileText, Heart,
    Shield, Clock, Globe, User, Check, AlertCircle
} from "lucide-react";
import { customerApiClient } from "@/lib/customer-api-client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ProfileEditDialog } from "./ProfileEditDialog";
import { PasswordChangeDialog } from "./PasswordChangeDialog";
import { AvatarUpload } from "./AvatarUpload";
import { useProfile } from "@/components/providers/ProfileProvider";

import { useProfileSync } from "@/hooks/useProfileSync";
import { ProfileStats } from "./ProfileStats";
import { ProfileGroups } from "./ProfileGroups";
import { ProfileInfo } from "./ProfileInfo";
import { useAuthStatus } from "@/hooks/useAuthStatus";


import { TwoFactorSettings } from "./TwoFactorSettings";

interface LoginHistoryItem {
    id: string;
    loginTime: string; // ISO timestamp
    ipAddress: string;
    userAgent: string;
    location?: string;
    success: boolean;
    deviceName?: string;
}

export function ProfileView() {
    const { userProfile, refreshProfile, isRefreshing } = useProfileSync();
    const { isLoading, error } = useProfile();
    const { isAuthenticated, authError, handleAuthError } = useAuthStatus();
    const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('overview');

    // Auto-load profile when component mounts
    useEffect(() => {
        if (!userProfile && !isLoading) {
            console.log("[ProfileView] Auto-loading profile...");
            refreshProfile();
        }
    }, [userProfile, isLoading, refreshProfile]);

    // Persist active tab to avoid resets on re-render/refreshes
    useEffect(() => {
        const saved = typeof window !== 'undefined' ? window.localStorage.getItem('profile_active_tab') : null;
        if (saved) setActiveTab(saved);
    }, []);
    const handleTabChange = (val: string) => {
        setActiveTab(val);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('profile_active_tab', val);
        }
    };

    // If session expired, silently redirect to login instead of showing an overlay in Profile
    if (typeof window !== 'undefined') {
        if (authError === 'AUTH_EXPIRED') {
            const returnUrl = encodeURIComponent(window.location.pathname);
            window.location.href = `/login?returnUrl=${returnUrl}`;
        }
    }

    // Show loading state only if we don't have any profile data yet
    if (isLoading && !userProfile) {
        return (
            <div className="max-w-6xl mx-auto w-full min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Đang tải thông tin hồ sơ...</h3>
                    <p className="text-muted-foreground">Vui lòng đợi trong giây lát</p>
                </div>
            </div>
        );
    }

    // Show error state only for critical errors, not for auth issues
    if (error && !error.includes('đăng nhập')) {
        return (
            <div className="max-w-6xl mx-auto w-full min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-red-600">Không thể tải thông tin hồ sơ</h3>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Button onClick={refreshProfile} disabled={isRefreshing}>
                        {isRefreshing ? 'Đang tải...' : 'Thử lại'}
                    </Button>
                </div>
            </div>
        );
    }

    // Debug logging
    console.log("[ProfileView] Rendering with profile:", userProfile);
    console.log("[ProfileView] Profile details:", {
        firstName: userProfile?.firstName,
        lastName: userProfile?.lastName,
        dateOfBirth: userProfile?.dateOfBirth,
        bio: userProfile?.bio,
        fullName: userProfile?.fullName
    });
    console.log("[ProfileView] Is refreshing:", isRefreshing);

    // Show fallback UI if no profile data available
    if (!userProfile) {
        return (
            <div className="max-w-6xl mx-auto w-full min-h-screen" data-profile-page data-profile-content>
                <div className="pr-2">
                    <div className="space-y-6 p-4">
                        {/* Fallback Profile Header */}
                        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
                            <div className="h-48 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 relative">
                            </div>
                            <div className="relative px-6 pb-6">
                                <div className="flex flex-col items-center -mt-12">
                                    <div className="relative">
                                        <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
                                            <AvatarFallback className="text-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                                U
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="mt-4 text-center">
                                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                            Hồ sơ người dùng
                                        </h1>
                                        <p className="text-muted-foreground text-lg">Đang tải thông tin...</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Fallback Tabs */}
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6 profile-content-area">
                            <TabsList className="grid w-full grid-cols-5 bg-gray-100 dark:bg-gray-800 p-1 sticky top-0 z-10">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">Tổng quan</TabsTrigger>
                                <TabsTrigger value="personal" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">Thông tin cá nhân</TabsTrigger>
                                <TabsTrigger value="chats" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">Trò chuyện</TabsTrigger>
                                <TabsTrigger value="security" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">Bảo mật</TabsTrigger>
                                <TabsTrigger value="activity" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">Hoạt động</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-6 profile-tab-content">
                                <Card className="border-0 shadow-md profile-card">
                                    <CardContent className="p-6 text-center">
                                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                        <p className="text-muted-foreground">Đang tải thông tin hồ sơ...</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="chats" className="space-y-6 profile-tab-content">
                                <Card className="border-0 shadow-md profile-card">
                                    <CardContent className="p-6 text-center">
                                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                        <p className="text-muted-foreground">Đang tải thông tin trò chuyện...</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        );
    }

    const loadLoginHistory = async () => {
        try {
            setIsLoadingHistory(true);
            const response = await customerApiClient.get("/me/login-history");
            if (response.data && typeof response.data === 'object' && 'success' in response.data && response.data.success) {
                const data = response.data as any;
                const items: LoginHistoryItem[] = (data.data || []).map((row: any, index: number) => ({
                    id: `${index}-${row.loginTimestamp}`,
                    loginTime: row.loginTimestamp,
                    ipAddress: row.ipAddress,
                    userAgent: row.userAgent,
                    location: row.location || 'Không xác định',
                    success: !!row.wasSuccessful,
                    deviceName: row.deviceName || row.userAgent,
                }));
                setLoginHistory(items);
            }
        } catch (error) {
            console.error("Error loading login history:", error);
            toast.error("Không thể tải lịch sử đăng nhập");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleProfileUpdated = async () => {
        try {
            console.log("[ProfileView] Profile updated, refreshing data...");

            // Refresh profile data
            await refreshProfile();
            console.log("[ProfileView] Profile data refreshed successfully");

            // Force re-render bằng cách trigger state update
            setTimeout(() => {
                console.log("[ProfileView] Forcing re-render...");
                refreshProfile();
            }, 100);

        } catch (error) {
            console.error("[ProfileView] Error refreshing profile:", error);
            toast.error("Không thể cập nhật dữ liệu profile");
        }
    };

    const handlePasswordChanged = () => {
        toast.success("Mật khẩu đã được thay đổi");
    };

    // Show loading state while profile is being loaded or refreshed
    if (isLoading || isRefreshing) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-500 border-t-transparent mx-auto"></div>
                    <p className="text-muted-foreground">
                        {isRefreshing ? "Đang cập nhật thông tin..." : "Đang tải thông tin hồ sơ..."}
                    </p>
                </div>
            </div>
        );
    }

    // Show error state only if profile loading failed and no retry is in progress
    if ((error || !userProfile) && authError !== 'AUTH_EXPIRED' && !isLoading) {
        // Nếu có lỗi nhỏ, vẫn hiển thị profile với thông báo lỗi nhỏ
        if (error && !error.includes('401') && !error.includes('403') && !error.includes('404')) {
            console.warn("[ProfileView] Non-critical error, showing profile anyway:", error);
        } else {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-4">
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full mx-auto w-16 h-16 flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                                {"Không thể tải thông tin hồ sơ"}
                            </h2>
                            <p className="text-sm text-muted-foreground mb-4">
                                {error || "Vui lòng thử lại sau hoặc liên hệ hỗ trợ"}
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <Button
                                onClick={() => refreshProfile()}
                                variant="outline"
                                className="border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/20"
                            >
                                Thử lại
                            </Button>
                            {authError !== "AUTH_EXPIRED" && (
                                <Button
                                    onClick={() => window.location.reload()}
                                    variant="outline"
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                                >
                                    Tải lại trang
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="max-w-6xl mx-auto w-full min-h-screen" data-profile-page data-profile-content>
            {/* Use page scroll; remove inner scrollbar */}
            <div className="pr-2">
                <div className="space-y-6 p-4">
                    {/* Cover Photo & Avatar */}
                    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
                        <div className="h-48 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 relative">
                            {userProfile?.coverPhoto && (
                                <img src={userProfile.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="relative px-6 pb-6">
                            <div className="flex flex-col items-center -mt-12">
                                <div className="relative">
                                    <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
                                        <AvatarImage src={userProfile?.avatarUrl} />
                                        <AvatarFallback className="text-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                            {userProfile?.firstName && userProfile?.lastName
                                                ? `${userProfile.firstName[0]}${userProfile.lastName[0]}`
                                                : userProfile?.fullName
                                                    ? userProfile.fullName.split(' ').map(n => n[0]).join('')
                                                    : 'U'
                                            }
                                        </AvatarFallback>
                                    </Avatar>
                                    <AvatarUpload
                                        onAvatarUpdated={handleProfileUpdated}
                                        className="absolute -bottom-2 -right-2"
                                    />
                                </div>
                                <div className="mt-4 text-center">
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {userProfile?.firstName && userProfile?.lastName
                                            ? `${userProfile.firstName} ${userProfile.lastName}`
                                            : userProfile?.fullName || 'Chưa cập nhật'
                                        }
                                    </h1>
                                    <p className="text-muted-foreground text-lg">{userProfile?.email}</p>
                                    {userProfile?.bio && (
                                        <p className="text-sm mt-2 text-gray-600 dark:text-gray-300 max-w-xl mx-auto">{userProfile.bio}</p>
                                    )}
                                    {userProfile?.dateOfBirth && (
                                        <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
                                            Ngày sinh: {new Date(userProfile.dateOfBirth).toLocaleDateString('vi-VN')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Main Content Tabs */}
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6 profile-content-area">
                        <TabsList className="grid w-full grid-cols-5 bg-gray-100 dark:bg-gray-800 p-1 sticky top-0 z-10">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">Tổng quan</TabsTrigger>
                            <TabsTrigger value="personal" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">Thông tin cá nhân</TabsTrigger>
                            <TabsTrigger value="chats" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">Trò chuyện</TabsTrigger>
                            <TabsTrigger value="security" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">Bảo mật</TabsTrigger>
                            <TabsTrigger value="activity" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">Hoạt động</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-6 profile-tab-content">
                            {/* Quick Info */}
                            <ProfileInfo />

                            {/* My Groups */}
                            <ProfileGroups />
                        </TabsContent>

                        {/* Personal Info Tab */}
                        <TabsContent value="personal" className="space-y-6 profile-tab-content">
                            <Card className="border-0 shadow-md profile-card">
                                <CardHeader>
                                    <CardTitle className="text-purple-700 dark:text-purple-300">Thông tin cá nhân</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Tên</p>
                                            <p className="text-sm">{(userProfile?.firstName && userProfile.firstName.trim()) || (userProfile?.fullName ? userProfile.fullName.split(' ').slice(-1)[0] : '') || 'Chưa cập nhật'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Họ</p>
                                            <p className="text-sm">{(userProfile?.lastName && userProfile.lastName.trim()) || (userProfile?.fullName ? userProfile.fullName.split(' ').slice(0, -1).join(' ') : '') || 'Chưa cập nhật'}</p>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Ngày sinh</p>
                                        <p className="text-sm">
                                            {(() => {
                                                const dob = (userProfile as any)?.dateOfBirth || (userProfile as any)?.dateOfBirthUtc || (userProfile as any)?.dob;
                                                return dob ? new Date(dob).toLocaleDateString('vi-VN') : 'Chưa cập nhật';
                                            })()}
                                        </p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Giới thiệu</p>
                                        <p className="text-sm">{userProfile?.bio || 'Chưa cập nhật'}</p>
                                    </div>
                                    <div className="pt-4">
                                        <ProfileEditDialog userProfile={userProfile} onProfileUpdated={handleProfileUpdated} />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Chats Tab */}
                        <TabsContent value="chats" className="space-y-6 profile-tab-content">
                            <Card className="border-0 shadow-md profile-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                                        <Users className="h-5 w-5" />
                                        Trò chuyện cá nhân và nhóm
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Direct Chats */}
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Trò chuyện cá nhân</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                                                        <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Cuộc trò chuyện trực tiếp</p>
                                                        <p className="text-sm text-muted-foreground">Nhắn tin riêng với bạn bè</p>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                                    Hoạt động
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Group Chats */}
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Trò chuyện nhóm</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Nhóm chat</p>
                                                        <p className="text-sm text-muted-foreground">Tham gia các cuộc trò chuyện nhóm</p>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                    Hoạt động
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Communities */}
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Cộng đồng</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                                                        <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Cộng đồng</p>
                                                        <p className="text-sm text-muted-foreground">Tham gia các cộng đồng và chia sẻ</p>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                                    Hoạt động
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Hành động nhanh</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <Button variant="outline" className="justify-start" onClick={() => window.location.href = '/chat'}>
                                                <User className="h-4 w-4 mr-2" />
                                                Tìm bạn bè
                                            </Button>
                                            <Button variant="outline" className="justify-start" onClick={() => window.location.href = '/groups'}>
                                                <Users className="h-4 w-4 mr-2" />
                                                Tạo nhóm mới
                                            </Button>
                                            <Button variant="outline" className="justify-start" onClick={() => window.location.href = '/communities'}>
                                                <Globe className="h-4 w-4 mr-2" />
                                                Khám phá cộng đồng
                                            </Button>
                                            <Button variant="outline" className="justify-start" onClick={() => window.location.href = '/notifications'}>
                                                <Heart className="h-4 w-4 mr-2" />
                                                Xem thông báo
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Security Tab */}
                        <TabsContent value="security" className="space-y-6 profile-tab-content">
                            <Card className="border-0 shadow-md profile-card">
                                <CardHeader>
                                    <CardTitle className="text-purple-700 dark:text-purple-300">Bảo mật tài khoản</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div>
                                            <p className="font-medium">Mật khẩu</p>
                                            <p className="text-sm text-muted-foreground">Cập nhật mật khẩu để bảo vệ tài khoản</p>
                                        </div>
                                        <PasswordChangeDialog onPasswordChanged={handlePasswordChanged} />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div>
                                            <p className="font-medium">Xác thực 2 yếu tố</p>
                                            <p className="text-sm text-muted-foreground">Bật xác thực 2 yếu tố để tăng cường bảo mật</p>
                                        </div>
                                        <Badge
                                            variant={userProfile.twoFactorEnabled ? "default" : "secondary"}
                                            className={cn(
                                                userProfile.twoFactorEnabled
                                                    ? "bg-green-500 hover:bg-green-600"
                                                    : "bg-gray-100 text-purple-700 border border-purple-200 dark:bg-gray-900/30 dark:text-purple-300 dark:border-purple-700"
                                            )}
                                        >
                                            {userProfile.twoFactorEnabled ? 'Đã bật' : 'Chưa bật'}
                                        </Badge>
                                    </div>
                                    <TwoFactorSettings />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Activity Tab */}
                        <TabsContent value="activity" className="space-y-6 profile-tab-content">
                            <Card className="border-0 shadow-md profile-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                                        <Clock className="h-5 w-5" />
                                        Lịch sử đăng nhập
                                    </CardTitle>
                                    <Button onClick={loadLoginHistory} disabled={isLoadingHistory} className="bg-purple-600 hover:bg-purple-700">
                                        {isLoadingHistory ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                        ) : (
                                            <Clock className="h-4 w-4 mr-2" />
                                        )}
                                        Tải lịch sử
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    {loginHistory.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>Chưa có lịch sử đăng nhập</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {loginHistory.map((item, index) => (
                                                <div key={item.id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("p-2 rounded-full", item.success ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30")}>
                                                            {item.success ? <Check className="h-4 w-4 text-green-600 dark:text-green-400" /> : <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">{new Date(item.loginTime).toLocaleString('vi-VN')}</p>
                                                            <p className="text-xs text-muted-foreground">{item.ipAddress} • {item.location || 'Không xác định'}</p>
                                                            {item.deviceName && (
                                                                <p className="text-xs text-muted-foreground truncate max-w-[320px]">{item.deviceName}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Badge variant={item.success ? "default" : "destructive"} className={cn(item.success ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600")}>
                                                        {item.success ? 'Thành công' : 'Thất bại'}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

        </div>
    );
}


