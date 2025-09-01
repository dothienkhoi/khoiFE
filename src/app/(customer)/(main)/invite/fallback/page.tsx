"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function InviteFallbackPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-xl text-red-600 dark:text-red-400">
                        Link mời không hợp lệ
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Link mời này không tồn tại hoặc đã hết hạn
                    </p>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Có thể link mời đã bị xóa hoặc hết hạn.
                            Vui lòng liên hệ với người gửi lời mời để nhận link mới.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => router.push('/groups')}
                            className="w-full"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại trang nhóm
                        </Button>

                        <Button
                            onClick={() => router.push('/discover')}
                            variant="outline"
                            className="w-full"
                        >
                            Khám phá nhóm khác
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
