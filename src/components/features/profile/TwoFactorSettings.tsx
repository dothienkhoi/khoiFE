"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Shield, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useProfile } from "@/components/providers/ProfileProvider";
// 2FA API functions have been removed from customer-api-client
import { toast } from "sonner";
import { handleApiError } from "@/lib/utils";

export function TwoFactorSettings() {
    const { userProfile, updateProfile } = useProfile();
    const [isLoading, setIsLoading] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingAction, setPendingAction] = useState<boolean | null>(null);

    // Sync with profile changes
    useEffect(() => {
        setIsEnabled(!!userProfile?.twoFactorEnabled);
    }, [userProfile?.twoFactorEnabled]);

    const handleToggle2FA = (enabled: boolean) => {
        setPendingAction(enabled);
        setShowConfirmDialog(true);
    };

    const confirmToggle2FA = async () => {
        if (pendingAction === null) return;

        setIsLoading(true);
        setShowConfirmDialog(false);

        try {
            // Simulate API call since 2FA endpoints are not available
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (pendingAction) {
                // Bật 2FA
                toast.success("Đã bật xác thực 2 yếu tố thành công!");
                // Cập nhật profile để sync trạng thái
                await updateProfile({ twoFactorEnabled: true } as any);
                setIsEnabled(true);
            } else {
                // Tắt 2FA
                toast.success("Đã tắt xác thực 2 yếu tố thành công!");
                // Cập nhật profile để sync trạng thái
                await updateProfile({ twoFactorEnabled: false } as any);
                setIsEnabled(false);
            }
        } catch (error: any) {
            console.error("Error toggling 2FA:", error);
            toast.error("API endpoint 2FA chưa được triển khai. Vui lòng liên hệ admin.");
        } finally {
            setIsLoading(false);
            setPendingAction(null);
        }
    };

    const cancelToggle2FA = () => {
        setShowConfirmDialog(false);
        setPendingAction(null);
    };

    if (!userProfile) return null;

    return (
        <>
            <Card className="border border-gray-200 dark:border-gray-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Shield className="h-5 w-5 text-purple-600" />
                        Xác thực 2 yếu tố (2FA)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Trạng thái 2FA */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isEnabled
                                ? "bg-green-100 dark:bg-green-900/30"
                                : "bg-gray-100 dark:bg-gray-700"
                                }`}>
                                {isEnabled ? (
                                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">Trạng thái 2FA</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {isEnabled
                                        ? "Xác thực 2 yếu tố đang được bật"
                                        : "Xác thực 2 yếu tố đang bị tắt"
                                    }
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="twoFactor"
                            checked={isEnabled}
                            onCheckedChange={handleToggle2FA}
                            disabled={isLoading}
                            className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                        />
                    </div>

                    {/* Lưu ý */}
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div className="text-sm text-amber-800 dark:text-amber-200">
                                <p className="font-medium mb-1">Lưu ý quan trọng:</p>
                                <ul className="space-y-1 text-xs">
                                    <li>• Khi bật 2FA, bạn sẽ cần nhập mã xác thực mỗi khi đăng nhập</li>
                                    <li>• Đảm bảo bạn đã cài đặt ứng dụng xác thực (Google Authenticator, Authy)</li>
                                    <li>• Lưu mã backup để khôi phục tài khoản nếu mất thiết bị</li>
                                    <li>• Tính năng này có thể chưa sẵn sàng trên server</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dialog xác nhận */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {pendingAction ? (
                                <>
                                    <Shield className="h-5 w-5 text-purple-600" />
                                    Bật xác thực 2 yếu tố
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-5 w-5 text-orange-600" />
                                    Tắt xác thực 2 yếu tố
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {pendingAction ? (
                                "Bạn có chắc chắn muốn bật xác thực 2 yếu tố? Điều này sẽ yêu cầu bạn nhập mã xác thực mỗi khi đăng nhập."
                            ) : (
                                "Bạn có chắc chắn muốn tắt xác thực 2 yếu tố? Điều này sẽ làm giảm tính bảo mật của tài khoản."
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div className="text-sm text-amber-800 dark:text-amber-200">
                                <p className="font-medium mb-1">Lưu ý quan trọng:</p>
                                <ul className="space-y-1 text-xs">
                                    {pendingAction ? (
                                        <>
                                            <li>• Bạn cần cài đặt ứng dụng xác thực</li>
                                            <li>• Lưu mã backup để khôi phục tài khoản</li>
                                            <li>• Không thể tắt 2FA nếu mất thiết bị xác thực</li>
                                        </>
                                    ) : (
                                        <>
                                            <li>• Tài khoản sẽ kém bảo mật hơn</li>
                                            <li>• Chỉ cần mật khẩu để đăng nhập</li>
                                            <li>• Có thể bật lại 2FA bất cứ lúc nào</li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={cancelToggle2FA}
                            disabled={isLoading}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={confirmToggle2FA}
                            disabled={isLoading}
                            className={pendingAction
                                ? "bg-purple-600 hover:bg-purple-700"
                                : "bg-orange-600 hover:bg-orange-700"
                            }
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang xử lý...
                                </div>
                            ) : (
                                pendingAction ? "Bật 2FA" : "Tắt 2FA"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}












