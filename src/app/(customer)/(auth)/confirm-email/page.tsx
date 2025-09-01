// app/(customer)/(auth)/confirm-email/page.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { confirmEmail } from "@/lib/api-client"; // Import hàm API
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CircleCheck,
  CircleX,
  LoaderCircle,
  AlertTriangle,
} from "lucide-react";

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Đọc userId và token từ URL
  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  // Dùng useMutation để quản lý trạng thái gọi API
  const { mutate, isPending, isSuccess, isError, data, error } = useMutation({
    mutationFn: confirmEmail,
  });

  // Tự động gọi API một lần khi component được tải và có đủ tham số
  useEffect(() => {
    if (userId && token) {
      mutate({ userId, token });
    }
  }, [userId, token, mutate]);

  // Hàm render nội dung dựa trên trạng thái
  const renderContent = () => {
    // Trường hợp URL không chứa đủ thông tin
    if (!userId || !token) {
      return (
        <div className="flex flex-col items-center text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-yellow-500" />
          <h3 className="text-lg font-semibold">Đường dẫn không hợp lệ</h3>
          <p className="text-sm text-muted-foreground">
            Không tìm thấy thông tin xác thực cần thiết. Vui lòng kiểm tra lại
            đường link trong email của bạn.
          </p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Quay về trang chủ
          </Button>
        </div>
      );
    }

    // Trạng thái đang xử lý
    if (isPending) {
      return (
        <div className="flex flex-col items-center text-center space-y-4">
          <LoaderCircle className="h-12 w-12 animate-spin text-purple-600" />
          <h3 className="text-lg font-semibold">Đang xác thực email...</h3>
          <p className="text-sm text-muted-foreground">
            Vui lòng chờ trong giây lát.
          </p>
        </div>
      );
    }

    // Trạng thái thành công
    if (isSuccess && data?.success) {
      return (
        <div className="flex flex-col items-center text-center space-y-4">
          <CircleCheck className="h-12 w-12 text-green-500" />
          <h3 className="text-lg font-semibold">Xác thực thành công!</h3>
          <p className="text-sm text-muted-foreground">{data.message}</p>
          <Button onClick={() => router.push("/auth/login")} className="mt-2">
            Đi đến trang đăng nhập
          </Button>
        </div>
      );
    }

    // Trạng thái thất bại (từ API hoặc lỗi mạng)
    if (isError || (data && !data.success)) {
      const errorMessage =
        data?.errors?.[0]?.message ||
        error?.message ||
        "Đã có lỗi xảy ra. Vui lòng thử lại.";
      return (
        <div className="flex flex-col items-center text-center space-y-4">
          <CircleX className="h-12 w-12 text-red-500" />
          <h3 className="text-lg font-semibold">Xác thực thất bại</h3>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <Button
            variant="outline"
            onClick={() => router.push("/auth/login")}
            className="mt-2"
          >
            Quay lại trang đăng nhập
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6a11cb] to-[#2575fc] flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Xác thực tài khoản
          </CardTitle>
          <CardDescription className="text-center">
            Hoàn tất bước cuối cùng để kích hoạt tài khoản của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
