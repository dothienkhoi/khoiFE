"use client";

import * as React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, Settings } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getAdminSettings, updateAdminSettings } from "@/lib/api-client";
import { AdminSettingsDto, UpdateSettingsRequest } from "@/types/api.types";
import { PushNotificationSettings } from "@/components/shared/PushNotificationSettings";

// Form data type with parsed values
interface SettingsFormData {
  // General Settings
  SiteName: string;
  MaintenanceMode: boolean;
  
  // User Management
  AllowNewRegistrations: boolean;
  RequireEmailConfirmation: boolean;
  DefaultRoleForNewUsers: string;
  
  // Content & Moderation
  ForbiddenKeywords: string;
  AutoLockAccountThreshold: number;
  
  // File Uploads
  MaxFileSizeMb: number;
  MaxAvatarSizeMb: number;
  AllowedFileTypes: string;
}

// Form field component for consistent layout
interface FormFieldProps {
  label: string;
  description: string;
  children: React.ReactNode;
}

function FormField({ label, description, children }: FormFieldProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-b border-border last:border-0">
      <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="md:col-span-2 flex items-center">
        {children}
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: settingsData, isLoading, error } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const response = await getAdminSettings();
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch settings");
      }
      return response.data;
    },
    retry: 2,
  });

  // Form setup
  const form = useForm<SettingsFormData>({
    defaultValues: {
      SiteName: "",
      MaintenanceMode: false,
      AllowNewRegistrations: true,
      RequireEmailConfirmation: false,
      DefaultRoleForNewUsers: "Member",
      ForbiddenKeywords: "",
      AutoLockAccountThreshold: 5,
      MaxFileSizeMb: 10,
      MaxAvatarSizeMb: 2,
      AllowedFileTypes: "",
    },
  });

  const { register, handleSubmit, formState, reset, watch, setValue } = form;

  // Parse API data and populate form when data is loaded
  React.useEffect(() => {
    if (settingsData) {
      const parsedData: SettingsFormData = {
        SiteName: settingsData.SiteName || "",
        MaintenanceMode: settingsData.MaintenanceMode === "true",
        AllowNewRegistrations: settingsData.AllowNewRegistrations === "true",
        RequireEmailConfirmation: settingsData.RequireEmailConfirmation === "true",
        DefaultRoleForNewUsers: settingsData.DefaultRoleForNewUsers || "Member",
        ForbiddenKeywords: settingsData.ForbiddenKeywords || "",
        AutoLockAccountThreshold: parseInt(settingsData.AutoLockAccountThreshold || "5", 10),
        MaxFileSizeMb: parseInt(settingsData.MaxFileSizeMb || "10", 10),
        MaxAvatarSizeMb: parseInt(settingsData.MaxAvatarSizeMb || "2", 10),
        AllowedFileTypes: settingsData.AllowedFileTypes || "",
      };
      reset(parsedData);
    }
  }, [settingsData, reset]);

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: updateAdminSettings,
    onSuccess: () => {
      // Invalidate and refetch settings
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("Cài đặt đã được lưu thành công!", {
        description: "Tất cả thay đổi đã được áp dụng.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error.message || "Không thể cập nhật cài đặt";
      toast.error("Lưu cài đặt thất bại", {
        description: errorMessage,
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: SettingsFormData) => {
    // Only include dirty fields in the request
    const dirtyFields = formState.dirtyFields;
    const changedSettings: Partial<AdminSettingsDto> = {};

    // Convert form data back to string format for API
    Object.keys(dirtyFields).forEach((key) => {
      const fieldKey = key as keyof SettingsFormData;
      const value = data[fieldKey];
      
      if (typeof value === "boolean") {
        changedSettings[fieldKey as keyof AdminSettingsDto] = value.toString();
      } else if (typeof value === "number") {
        changedSettings[fieldKey as keyof AdminSettingsDto] = value.toString();
      } else {
        changedSettings[fieldKey as keyof AdminSettingsDto] = value as string;
      }
    });

    if (Object.keys(changedSettings).length === 0) {
      toast.info("Không có thay đổi để lưu", {
        description: "Vui lòng chỉnh sửa ít nhất một cài đặt trước khi lưu.",
      });
      return;
    }

    const request: UpdateSettingsRequest = {
      settings: changedSettings,
    };

    updateMutation.mutate(request);
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Cài đặt</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang tải cài đặt...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Cài đặt</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <p className="text-destructive">Không thể tải cài đặt</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt</h1>
      </div>

      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Cấu hình Hệ thống
              </CardTitle>
              <CardDescription>
                Quản lý cài đặt toàn hệ thống. Chỉ những cài đặt đã thay đổi sẽ được lưu.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">Cài đặt Chung</TabsTrigger>
                  <TabsTrigger value="users">Quản lý Người dùng</TabsTrigger>
                  <TabsTrigger value="moderation">Nội dung & Kiểm duyệt</TabsTrigger>
                  <TabsTrigger value="files">Cấu hình Tải file</TabsTrigger>
                </TabsList>

              {/* General Settings Tab */}
              <TabsContent value="general" className="space-y-0">
                <div className="space-y-0">
                  <FormField
                    label="Tên Ứng dụng"
                    description="Tên hiển thị trên tiêu đề trang, email..."
                  >
                    <Input
                      {...register("SiteName")}
                      placeholder="Nhập tên ứng dụng"
                      className="w-full"
                    />
                  </FormField>

                  <FormField
                    label="Chế độ Bảo trì"
                    description="Bật/tắt toàn bộ trang web đối với người dùng thường"
                  >
                    <Switch
                      checked={watch("MaintenanceMode")}
                      onCheckedChange={(checked) => setValue("MaintenanceMode", checked, { shouldDirty: true })}
                    />
                  </FormField>
                </div>
              </TabsContent>

              {/* User Management Tab */}
              <TabsContent value="users" className="space-y-0">
                <div className="space-y-0">
                  <FormField
                    label="Cho phép Đăng ký mới"
                    description="Cho phép người dùng tự đăng ký tài khoản"
                  >
                    <Switch
                      checked={watch("AllowNewRegistrations")}
                      onCheckedChange={(checked) => setValue("AllowNewRegistrations", checked, { shouldDirty: true })}
                    />
                  </FormField>

                  <FormField
                    label="Yêu cầu Xác thực Email"
                    description="Bắt buộc người dùng phải kích hoạt tài khoản qua email"
                  >
                    <Switch
                      checked={watch("RequireEmailConfirmation")}
                      onCheckedChange={(checked) => setValue("RequireEmailConfirmation", checked, { shouldDirty: true })}
                    />
                  </FormField>

                  <FormField
                    label="Vai trò Mặc định"
                    description="Vai trò mặc định được gán cho người dùng mới"
                  >
                    <Select
                      value={watch("DefaultRoleForNewUsers")}
                      onValueChange={(value) => setValue("DefaultRoleForNewUsers", value, { shouldDirty: true })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIP">Khách hàng VIP</SelectItem>
                        <SelectItem value="Customer">Khách hàng</SelectItem>
                        <SelectItem value="Admin">ADMIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
              </TabsContent>

              {/* Content & Moderation Tab */}
              <TabsContent value="moderation" className="space-y-0">
                <div className="space-y-0">
                  <FormField
                    label="Từ khóa Bị cấm"
                    description="Danh sách các từ bị cấm, cách nhau bởi dấu phẩy"
                  >
                    <Textarea
                      {...register("ForbiddenKeywords")}
                      placeholder="spam, không phù hợp, từ xấu"
                      className="w-full"
                      rows={3}
                    />
                  </FormField>

                  <FormField
                    label="Ngưỡng Tự động Khóa"
                    description="Tự động khóa tài khoản sau X báo cáo. (0 = tắt)"
                  >
                    <Input
                      {...register("AutoLockAccountThreshold", { 
                        valueAsNumber: true,
                        min: 0,
                        max: 20
                      })}
                      type="number"
                      min="0"
                      max="20"
                      className="w-full"
                    />
                  </FormField>
                </div>
              </TabsContent>

              {/* File Uploads Tab */}
              <TabsContent value="files" className="space-y-0">
                <div className="space-y-0">
                  <FormField
                    label="Kích thước File Tối đa (MB)"
                    description="Giới hạn kích thước cho các file đính kèm"
                  >
                    <Input
                      {...register("MaxFileSizeMb", { 
                        valueAsNumber: true,
                        min: 1,
                        max: 100
                      })}
                      type="number"
                      min="1"
                      max="100"
                      className="w-full"
                    />
                  </FormField>

                  <FormField
                    label="Kích thước Avatar Tối đa (MB)"
                    description="Giới hạn kích thước riêng cho ảnh đại diện"
                  >
                    <Input
                      {...register("MaxAvatarSizeMb", { 
                        valueAsNumber: true,
                        min: 1,
                        max: 10
                      })}
                      type="number"
                      min="1"
                      max="10"
                      className="w-full"
                    />
                  </FormField>

                  <FormField
                    label="Các loại File được phép"
                    description="Danh sách đuôi file cho phép, cách nhau bởi dấu phẩy"
                  >
                    <Input
                      {...register("AllowedFileTypes")}
                      placeholder="jpg, png, gif, pdf, doc, docx"
                      className="w-full"
                    />
                  </FormField>
                </div>
              </TabsContent>

            </Tabs>
          </CardContent>

          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              disabled={!formState.isDirty || updateMutation.isPending}
              className="flex items-center gap-2"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>

    {/* Push Notification Settings - Separate Card */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Cài đặt Thông báo Đẩy
        </CardTitle>
        <CardDescription>
          Quản lý cấu hình thông báo đẩy cho ứng dụng. Các thay đổi sẽ được áp dụng ngay lập tức.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PushNotificationSettings />
      </CardContent>
    </Card>
  </div>
  );
}
