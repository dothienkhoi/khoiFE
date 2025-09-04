"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Heart, FileText } from "lucide-react";
import { useProfile } from "@/components/providers/ProfileProvider";

export function ProfileStats() {
    const { userProfile, isRefreshing } = useProfile();

    if (!userProfile) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                            {isRefreshing ? "..." : (userProfile.followersCount || 0)}
                        </span>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Người theo dõi</p>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20">
                <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-full">
                            <Heart className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                        </div>
                        <span className="text-3xl font-bold text-pink-700 dark:text-pink-300">
                            {isRefreshing ? "..." : (userProfile.followingCount || 0)}
                        </span>
                    </div>
                    <p className="text-sm text-pink-600 dark:text-pink-400 font-medium">Đang theo dõi</p>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-3xl font-bold text-green-700 dark:text-green-300">
                            {isRefreshing ? "..." : (userProfile.postsCount || 0)}
                        </span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Bài đăng</p>
                </CardContent>
            </Card>
        </div>
    );
}
