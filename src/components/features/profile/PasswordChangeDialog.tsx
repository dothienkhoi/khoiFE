"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Lock, Eye, EyeOff, Save, X } from "lucide-react";
import { customerApiClient } from "@/lib/customer-api-client";
import { toast } from "sonner";

interface PasswordChangeDialogProps {
    onPasswordChanged: () => void;
}

interface PasswordFormData {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

export function PasswordChangeDialog({ onPasswordChanged }: PasswordChangeDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
    });
    const [errors, setErrors] = useState<Partial<Record<keyof PasswordFormData, string>>>({});

    const validate = (field?: keyof PasswordFormData): boolean => {
        const newErrors: Partial<Record<keyof PasswordFormData, string>> = { ...errors };

        const check = (f: keyof PasswordFormData, condition: boolean, message: string) => {
            if (condition) newErrors[f] = message; else delete newErrors[f];
        };

        // Rules
        if (!field || field === 'currentPassword') {
            check('currentPassword', passwordForm.currentPassword.trim().length === 0, 'Vui lòng nhập mật khẩu hiện tại');
        }
        if (!field || field === 'newPassword') {
            check('newPassword', passwordForm.newPassword.trim().length < 6, 'Mật khẩu mới phải có ít nhất 6 ký tự');
            check('newPassword', passwordForm.newPassword === passwordForm.currentPassword && passwordForm.newPassword.length > 0, 'Mật khẩu mới phải khác mật khẩu hiện tại');
        }
        if (!field || field === 'confirmNewPassword') {
            check('confirmNewPassword', passwordForm.confirmNewPassword.trim().length === 0, 'Vui lòng xác nhận mật khẩu mới');
            check('confirmNewPassword', passwordForm.confirmNewPassword !== passwordForm.newPassword && passwordForm.confirmNewPassword.length > 0, 'Mật khẩu xác nhận không khớp');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);

        try {
            const response = await customerApiClient.put("/me/password", {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
                confirmNewPassword: passwordForm.confirmNewPassword
            });

            if (response.data && typeof response.data === 'object' && 'success' in response.data && response.data.success) {
                toast.success("Đổi mật khẩu thành công");
                setIsOpen(false);
                setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
                onPasswordChanged();
            }
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Đổi mật khẩu thất bại';
            // Map common API errors to inline field messages when possible
            if (message.toLowerCase().includes('current')) {
                setErrors(prev => ({ ...prev, currentPassword: message }));
            }
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen} modal={true}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/20">
                    <Lock className="h-4 w-4 mr-2" />
                    Đổi mật khẩu
                </Button>
            </DialogTrigger>
            <DialogContent
                className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto"
                style={{
                    zIndex: 9999,
                    position: 'fixed',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                }}
            >
                <DialogHeader>
                    <DialogTitle className="text-purple-700 dark:text-purple-300">
                        Đổi mật khẩu
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                        <div className="relative">
                            <Input
                                id="currentPassword"
                                type={showPassword ? "text" : "password"}
                                value={passwordForm.currentPassword}
                                onChange={(e) => { setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value })); }}
                                onBlur={() => validate('currentPassword')}
                                placeholder="Nhập mật khẩu hiện tại"
                                required
                                className={errors.currentPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        {errors.currentPassword && (
                            <p className="text-sm text-red-600 mt-1">{errors.currentPassword}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Mật khẩu mới</Label>
                        <Input
                            id="newPassword"
                            type={showPassword ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) => { setPasswordForm(prev => ({ ...prev, newPassword: e.target.value })); }}
                            onBlur={() => validate('newPassword')}
                            placeholder="Nhập mật khẩu mới"
                            required
                            className={errors.newPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}
                        />
                        {errors.newPassword && (
                            <p className="text-sm text-red-600 mt-1">{errors.newPassword}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                        <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            value={passwordForm.confirmNewPassword}
                            onChange={(e) => { setPasswordForm(prev => ({ ...prev, confirmNewPassword: e.target.value })); }}
                            onBlur={() => validate('confirmNewPassword')}
                            placeholder="Nhập lại mật khẩu mới"
                            required
                            className={errors.confirmNewPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}
                        />
                        {errors.confirmNewPassword && (
                            <p className="text-sm text-red-600 mt-1">{errors.confirmNewPassword}</p>
                        )}
                    </div>
                    <div className="flex gap-2 pt-4 justify-end">
                        <Button type="button" variant="outline" onClick={handleCancel} className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                            <X className="h-4 w-4 mr-2" />
                            Hủy
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Đổi mật khẩu
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

