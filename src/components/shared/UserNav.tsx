// components/shared/UserNav.tsx
"use client";

import { useAuthStore } from "@/store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { logoutUser } from "@/lib/api-client";
import { LogOut } from "lucide-react";

export function UserNav() {
  const { isAuthenticated, user } = useAuthStore();

  // Logout mutation logic
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const logoutFromStore = useAuthStore((state) => state.logout);

  const { mutate: handleLogout, isPending } = useMutation({
    mutationFn: async () => {
      if (!refreshToken) {
        // If no refresh token, no need to call API
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

  if (!isAuthenticated || !user) {
    // Nếu chưa đăng nhập, hiển thị nút Login/Register
    return (
      <div className="flex items-center justify-center h-10 w-10">
        <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-lg bg-transparent hover:bg-transparent">
          <Link href="/auth/login" className="text-[#ad46ff] hover:text-[#ad46ff]/80">
            <span className="text-base">ĐN</span>
          </Link>
        </Button>
      </div>
    );
  }

  // Nếu đã đăng nhập
  return (
    <div className="flex items-center gap-4">
      {/* Thêm các icon khác nếu cần, ví dụ chuông thông báo */}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-lg bg-transparent hover:bg-transparent">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatarUrl || ""} alt={user.fullName} />
              <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white font-semibold text-base">
                {user.firstName?.charAt(0).toUpperCase()}
                {user.lastName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.fullName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>

          {/* Logout with Confirmation Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận đăng xuất</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn đăng xuất không?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleLogout()}
                  disabled={isPending}
                >
                  {isPending ? "Đang đăng xuất..." : "Tiếp tục"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
