"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Cookies from "js-cookie";

import { useAuthStore } from "@/store/authStore";
import { logoutUser } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  // Lấy refreshToken và action logout từ store
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const logoutFromStore = useAuthStore((state) => state.logout);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!refreshToken) {
        // Nếu không có refresh token, không cần gọi API
        return;
      }
      await logoutUser(refreshToken);
      return;
    },
    onSettled: () => {
      Cookies.remove("auth_token");
      logoutFromStore();
      toast.success("Bạn đã đăng xuất thành công.");
      window.location.href = "/";
    },
  });

  return (
    <Button
      className="flex items-center w-full px-2 py-1.5 text-sm"
      variant="ghost"
      size="icon"
      onClick={() => mutate()}
      disabled={isPending}
    >
      <LogOut className="mr-2 h-4 w-4" />
      <span>Đăng xuất</span>
    </Button>
  );
}
