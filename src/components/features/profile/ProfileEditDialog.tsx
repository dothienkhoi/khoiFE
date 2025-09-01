"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Save, X } from "lucide-react";
import { UserProfile } from "@/types/customer.types";
import { useProfile } from "@/components/providers/ProfileProvider";
import { toast } from "sonner";
import { customerApiClient } from "@/lib/customer-api-client";

interface ProfileEditDialogProps {
    userProfile: UserProfile;
    onProfileUpdated: () => void;
}

interface ProfileFormData {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    bio: string;
}

export function ProfileEditDialog({ userProfile, onProfileUpdated }: ProfileEditDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [profileForm, setProfileForm] = useState<ProfileFormData>({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        bio: ""
    });
    const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; dateOfBirth?: string }>({});

    const { updateProfile } = useProfile();

    useEffect(() => {
        if (userProfile) {
            console.log("[ProfileEditDialog] useEffect triggered with userProfile:", userProfile);
            const newFormData = {
                firstName: userProfile.firstName || "",
                lastName: userProfile.lastName || "",
                dateOfBirth: userProfile.dateOfBirth ? userProfile.dateOfBirth.split('T')[0] : "",
                bio: userProfile.bio || ""
            };
            console.log("[ProfileEditDialog] Setting form data:", newFormData);
            setProfileForm(newFormData);
        }
    }, [userProfile]);

    const todayYmd = () => {
        const d = new Date();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${mm}-${dd}`;
    };

    const validateDob = (value: string) => {
        // Accept empty (optional), otherwise must be <= today and >= 1900-01-01
        if (!value) {
            setErrors(prev => ({ ...prev, dateOfBirth: undefined }));
            return true;
        }
        // value in yyyy-MM-dd
        const picked = new Date(value + 'T00:00:00');
        const today = new Date(todayYmd() + 'T00:00:00');
        const min = new Date('1900-01-01T00:00:00');
        if (isNaN(picked.getTime())) {
            setErrors(prev => ({ ...prev, dateOfBirth: 'Ngày sinh không hợp lệ' }));
            return false;
        }
        if (picked > today) {
            setErrors(prev => ({ ...prev, dateOfBirth: 'Ngày sinh không được vượt quá ngày hiện tại' }));
            return false;
        }
        if (picked < min) {
            setErrors(prev => ({ ...prev, dateOfBirth: 'Ngày sinh quá nhỏ (trước 1900)' }));
            return false;
        }
        setErrors(prev => ({ ...prev, dateOfBirth: undefined }));
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            console.log("[ProfileEditDialog] Submitting form data:", profileForm);
            console.log("[ProfileEditDialog] Current userProfile:", userProfile);

            // Validate date before submit (no UI change, only rules)
            if (!validateDob(profileForm.dateOfBirth)) {
                setIsLoading(false);
                return;
            }

            // Sử dụng updateProfile từ ProfileProvider
            await updateProfile(profileForm);

            // Nếu thành công, đóng dialog và thông báo
            toast.success("Cập nhật thông tin thành công!");
            setIsOpen(false);

            // Gọi callback để refresh data
            onProfileUpdated();

        } catch (error: any) {
            console.error("[ProfileEditDialog] Error updating profile:", error);
            // Error đã được xử lý trong updateProfile
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        // Reset form to original values
        if (userProfile) {
            setProfileForm({
                firstName: userProfile.firstName || "",
                lastName: userProfile.lastName || "",
                dateOfBirth: userProfile.dateOfBirth ? userProfile.dateOfBirth.split('T')[0] : "",
                bio: userProfile.bio || ""
            });
        }
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen} modal={true}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/20">
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                </Button>
            </DialogTrigger>
            <DialogContent
                className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
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
                        Chỉnh sửa thông tin cá nhân
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Tên</Label>
                            <Input
                                id="firstName"
                                value={profileForm.firstName}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                                placeholder="Nhập tên của bạn"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Họ</Label>
                            <Input
                                id="lastName"
                                value={profileForm.lastName}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                                placeholder="Nhập họ của bạn"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                        <Input
                            id="dateOfBirth"
                            type="date"
                            value={profileForm.dateOfBirth}
                            onChange={(e) => { const v = e.target.value; setProfileForm(prev => ({ ...prev, dateOfBirth: v })); validateDob(v); }}
                            max={todayYmd()}
                            min="1900-01-01"
                        />
                        {errors.dateOfBirth && (
                            <p className="text-sm text-red-600">{errors.dateOfBirth}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bio">Giới thiệu</Label>
                        <Textarea
                            id="bio"
                            value={profileForm.bio}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                            placeholder="Viết gì đó về bản thân..."
                            rows={3}
                        />
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
                            Lưu thay đổi
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
