"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { toast } from "sonner";

import {
  loginUser,
  resendConfirmationEmail,
  verifyTwoFactor,
  sendTwoFactorCode,
} from "@/lib/api-client";
import {
  loginSchema,
  verify2faSchema,
  type LoginFormData,
  type Verify2faFormData,
} from "@/lib/schemas/auth.schema";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { ApiResponse } from "@/types/api.types";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export function LoginForm() {
  const router = useRouter();
  const loginToStore = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [userEmail, setUserEmail] = useState("");
  const [userRememberMe, setUserRememberMe] = useState(false);

  // Get returnUrl from query params
  const getReturnUrl = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('returnUrl');
    }
    return null;
  };

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  // 2FA OTP Form
  const otpForm = useForm<Verify2faFormData>({
    resolver: zodResolver(verify2faSchema),
    defaultValues: { email: "", code: "", rememberMe: false },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: loginUser,
    onSuccess: (response) => {
      if (response.success && response.data) {
        // Check if 2FA is required
        if (response.data.requiresTwoFactor) {
          toast.success("Đăng nhập thành công!", {
            description: "Vui lòng nhập mã 2FA để tiếp tục.",
          });
          setUserEmail(form.getValues("email"));
          setUserRememberMe(form.getValues("rememberMe"));
          otpForm.reset({
            email: form.getValues("email"),
            code: "",
            rememberMe: form.getValues("rememberMe"),
          });
          setStep("otp");
          return;
        }

        // Normal login flow (no 2FA)
        toast.success("Đăng nhập thành công!");

        Cookies.set("auth_token", response.data.accessToken, {
          expires: form.getValues("rememberMe") ? 7 : undefined,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });

        loginToStore(
          response.data.user,
          response.data.accessToken,
          response.data.refreshToken
        );

        // Redirect to returnUrl if available, otherwise to default page
        const returnUrl = getReturnUrl();
        if (returnUrl) {
          router.push(decodeURIComponent(returnUrl));
        } else {
          router.push("/");
        }
      } else {
        toast.error("Đăng nhập thất bại", {
          description: response.errors?.[0]?.message || response.message,
        });
      }
    },
    onError: (error: any) => {
      if (error?.response?.data) {
        const errorData: ApiResponse<null> = error.response.data;
        const errorCode = errorData.errors?.[0]?.errorCode || "UNKNOWN_ERROR";
        if (errorCode === "EMAIL_NOT_CONFIRMED") {
          setShowResendEmail(true); // Hiển thị thông báo gửi lại email
          return; // Dừng lại ở đây
        }
        const errorMessage =
          errorData.errors?.[0]?.message || errorData.message;
        toast.error("Đăng nhập thất bại", {
          description: errorMessage || "Email hoặc mật khẩu không chính xác.",
        });
      } else {
        toast.error("Đã có lỗi xảy ra", {
          description: "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
        });
      }
    },
  });

  // 2FA OTP Verification Mutation
  const verifyOtpMutation = useMutation({
    mutationFn: verifyTwoFactor,
    onSuccess: (response) => {
      if (response.success && response.data) {
        toast.success("Xác thực 2FA thành công!");

        Cookies.set("auth_token", response.data.accessToken, {
          expires: userRememberMe ? 7 : undefined,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });

        loginToStore(
          response.data.user,
          response.data.accessToken,
          response.data.refreshToken
        );

        // Redirect to returnUrl if available, otherwise to default page
        const returnUrl = getReturnUrl();
        if (returnUrl) {
          router.push(decodeURIComponent(returnUrl));
        } else {
          router.push("/");
        }
      } else {
        toast.error("Mã 2FA không chính xác", {
          description: response.errors?.[0]?.message || response.message,
        });
      }
    },
    onError: (error: any) => {
      if (error?.response?.data) {
        const errorData: ApiResponse<null> = error.response.data;
        const errorMessage =
          errorData.errors?.[0]?.message || errorData.message;
        toast.error("Mã 2FA không chính xác", {
          description: errorMessage || "Vui lòng kiểm tra lại mã 2FA.",
        });
      } else {
        toast.error("Đã có lỗi xảy ra", {
          description: "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
        });
      }
    },
  });

  // Resend 2FA Code Mutation
  const resendTwoFactorMutation = useMutation({
    mutationFn: sendTwoFactorCode,
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Gửi lại mã 2FA thành công!", {
          description: "Vui lòng kiểm tra ứng dụng xác thực của bạn.",
        });
      } else {
        toast.error("Gửi lại mã 2FA thất bại", {
          description: response.message,
        });
      }
    },
    onError: () => {
      toast.error("Lỗi", {
        description: "Không thể gửi lại mã 2FA. Vui lòng thử lại sau.",
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendConfirmationEmail,
    onSuccess: (response: ApiResponse<string>) => {
      if (response.success) {
        toast.success("Gửi lại email thành công!", {
          description: "Vui lòng kiểm tra hộp thư của bạn.",
        });
        setShowResendEmail(false);
      } else {
        toast.error("Gửi lại email thất bại", {
          description: response.message,
        });
      }
    },
    onError: () => {
      toast.error("Lỗi", {
        description: "Không thể gửi lại email. Vui lòng thử lại sau.",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setShowResendEmail(false);
    mutate(data);
  };

  const onOtpSubmit = (data: Verify2faFormData) => {
    verifyOtpMutation.mutate({
      email: userEmail,
      code: data.code,
      rememberMe: userRememberMe,
    });
  };

  // Handle resend email confirmation
  const handleResendEmail = () => {
    const email = form.getValues("email");
    if (!email) {
      toast.warning("Vui lòng nhập email của bạn vào ô bên trên.");
      return;
    }
    resendMutation.mutate(email);
  };

  // Handle resend 2FA code
  const handleResend2FA = () => {
    resendTwoFactorMutation.mutate(userEmail);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-100 dark:from-gray-900 dark:via-black dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-500 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageCircle className="h-7 w-7 text-purple-600 dark:text-cyan-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              FastBite Group
            </span>
          </div>
          <CardTitle className="text-2xl text-gray-900 dark:text-white">
            {step === "credentials" ? "Chào mừng trở lại!" : "Xác thực 2FA"}
          </CardTitle>
          <CardDescription className="dark:text-gray-300">
            {step === "credentials"
              ? "Đăng nhập để tiếp tục"
              : "Nhập mã 6 ký tự từ ứng dụng xác thực của bạn"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "credentials" && showResendEmail && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200">
              <p className="font-semibold">
                Tài khoản của bạn chưa được xác thực.
              </p>
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={resendMutation.isPending}
                className="text-yellow-900 dark:text-yellow-200 font-bold underline disabled:opacity-50"
              >
                {resendMutation.isPending
                  ? "Đang gửi..."
                  : "Gửi lại email xác nhận"}
              </button>
            </div>
          )}

          {step === "credentials" ? (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-gray-900 dark:text-white"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  autoComplete="email"
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-gray-900 dark:text-white"
                  >
                    Mật khẩu
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-purple-600 hover:underline dark:text-cyan-400 dark:hover:text-cyan-300"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    )}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="rememberMe" {...form.register("rememberMe")} />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm font-normal cursor-pointer text-gray-900 dark:text-white"
                >
                  Ghi nhớ đăng nhập
                </Label>
              </div>
              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                disabled={isPending}
              >
                {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={otpForm.handleSubmit(onOtpSubmit)}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="email-display"
                  className="text-gray-900 dark:text-white"
                >
                  Email
                </Label>
                <Input
                  id="email-display"
                  type="email"
                  value={userEmail}
                  disabled
                  readOnly
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-gray-900 dark:text-white">
                  Mã xác thực 2FA
                </Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpForm.watch("code") || ""}
                    onChange={(value) => otpForm.setValue("code", value)}
                    className="gap-2"
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot
                        index={0}
                        className="w-12 h-12 text-lg font-semibold border-2 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-purple-500 dark:focus:border-cyan-400"
                      />
                      <InputOTPSlot
                        index={1}
                        className="w-12 h-12 text-lg font-semibold border-2 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-purple-500 dark:focus:border-cyan-400"
                      />
                      <InputOTPSlot
                        index={2}
                        className="w-12 h-12 text-lg font-semibold border-2 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-purple-500 dark:focus:border-cyan-400"
                      />
                      <InputOTPSlot
                        index={3}
                        className="w-12 h-12 text-lg font-semibold border-2 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-purple-500 dark:focus:border-cyan-400"
                      />
                      <InputOTPSlot
                        index={4}
                        className="w-12 h-12 text-lg font-semibold border-2 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-purple-500 dark:focus:border-cyan-400"
                      />
                      <InputOTPSlot
                        index={5}
                        className="w-12 h-12 text-lg font-semibold border-2 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-purple-500 dark:focus:border-cyan-400"
                      />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {otpForm.formState.errors.code && (
                  <p className="text-sm text-red-600 dark:text-red-400 text-center">
                    {otpForm.formState.errors.code.message}
                  </p>
                )}
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleResend2FA}
                  disabled={resendTwoFactorMutation.isPending}
                  className="text-sm text-purple-600 hover:text-purple-700 dark:text-cyan-400 dark:hover:text-cyan-300 underline disabled:opacity-50"
                >
                  {resendTwoFactorMutation.isPending
                    ? "Đang gửi..."
                    : "Gửi lại mã"}
                </button>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 dark:border-gray-600 dark:text-gray-300"
                  onClick={() => setStep("credentials")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                  disabled={verifyOtpMutation.isPending}
                >
                  {verifyOtpMutation.isPending
                    ? "Đang xác thực..."
                    : "Xác thực"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 items-center">
          <Link
            href="/"
            className="text-sm font-medium text-purple-600 hover:underline dark:text-cyan-400 dark:hover:text-cyan-300"
          >
            Quay về trang chủ
          </Link>
          {step === "credentials" && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Chưa có tài khoản?{" "}
              <Link
                href="/register"
                className="text-sm font-medium text-purple-600 hover:underline dark:text-cyan-400 dark:hover:text-cyan-300"
              >
                Tạo tài khoản
              </Link>
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
