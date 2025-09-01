"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Shield, AlertTriangle, CheckCircle, XCircle, Lock, Unlock } from "lucide-react";
import { useProfile } from "@/components/providers/ProfileProvider";
import { toast } from "sonner";

export function TwoFactorSettings() {
    const { userProfile, updateProfile } = useProfile();
    const [isLoading, setIsLoading] = useState(false);
    const [isEnabled, setIsEnabled] = useState(userProfile?.twoFactorEnabled || false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingAction, setPendingAction] = useState<boolean | null>(null);

    const handleToggle2FA = async (enabled: boolean) => {
        // Hiển thị dialog xác nhận trước
        setPendingAction(enabled);
        setShowConfirmDialog(true);
    };

    const confirmToggle2FA = async () => {
        if (pendingAction === null) return;

        setIsLoading(true);
        setShowConfirmDialog(false);

        try {
            console.log("[TwoFactorSettings] Toggling 2FA to:", pendingAction);

            // Cập nhật 2FA setting
            await updateProfile({ twoFactorEnabled: pendingAction });

            // Cập nhật local state
            setIsEnabled(pendingAction);

            toast.success(
                pendingAction
                    ? "Đã bật xác thực 2 yếu tố"
                    : "Đã tắt xác thực 2 yếu tố"
            );

        } catch (error) {
            console.error("[TwoFactorSettings] Error toggling 2FA:", error);
            // Revert local state on error
            setIsEnabled(!pendingAction);
            toast.error("Không thể thay đổi cài đặt 2FA", {
                description: "Vui lòng thử lại sau"
            });
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
            <Card className="border-0 shadow-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                        <Shield className="h-5 w-5" />
                        Xác thực 2 yếu tố (2FA)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
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

                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-medium mb-1">Lưu ý về xác thực 2 yếu tố:</p>
                                <ul className="space-y-1 text-xs">
                                    <li>• Khi bật 2FA, bạn sẽ cần nhập mã xác thực mỗi khi đăng nhập</li>
                                    <li>• Đảm bảo bạn đã cài đặt ứng dụng xác thực (Google Authenticator, Authy)</li>
                                    <li>• Lưu mã backup để khôi phục tài khoản nếu mất thiết bị</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {isEnabled && (
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                                <div className="text-sm text-green-800 dark:text-green-200">
                                    <p className="font-medium mb-1">2FA đang hoạt động:</p>
                                    <p className="text-xs">Tài khoản của bạn đang được bảo vệ bởi xác thực 2 yếu tố. Hãy đảm bảo thiết bị xác thực luôn sẵn sàng.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog xác nhận bật/tắt 2FA */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                            {pendingAction ? (
                                <>
                                    <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    Bật xác thực 2 yếu tố
                                </>
                            ) : (
                                <>
                                    <Unlock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                    Tắt xác thực 2 yếu tố
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400">
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
                                            <li>• Bạn cần cài đặt ứng dụng xác thực (Google Authenticator, Authy)</li>
                                            <li>• Lưu mã backup để khôi phục tài khoản nếu mất thiết bị</li>
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
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={confirmToggle2FA}
                            disabled={isLoading}
                            className={pendingAction
                                ? "bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                                : "bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700"
                            }
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            ) : (
                                pendingAction ? <Lock className="h-4 w-4 mr-2" /> : <Unlock className="h-4 w-4 mr-2" />
                            )}
                            {pendingAction ? "Bật 2FA" : "Tắt 2FA"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

