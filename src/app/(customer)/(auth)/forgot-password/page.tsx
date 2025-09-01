"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from "@/lib/api-client";
import {
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  type ForgotPasswordFormData,
  type VerifyOtpFormData,
  type ResetPasswordFormData,
} from "@/lib/schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { ApiResponse } from "@/types/api.types";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 1: Request Password Reset OTP
  const emailForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (response) => {
      if (response.success) {
        toast.success("OTP đã được gửi!", {
          description:
            "Vui lòng kiểm tra email của bạn và nhập mã OTP để tiếp tục.",
        });
        setEmail(emailForm.getValues("email"));
        setStep(2);
      } else {
        toast.error("Gửi OTP thất bại", {
          description: response.errors?.[0]?.message || response.message,
        });
      }
    },
    onError: (error: unknown) => {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response: { data: ApiResponse<null> } };
        const errorData = axiosError.response.data;
        const errorMessage =
          errorData.errors?.[0]?.message || errorData.message;
        toast.error("Gửi OTP thất bại", {
          description: errorMessage || "Có lỗi xảy ra, vui lòng thử lại.",
        });
      } else {
        toast.error("Có lỗi xảy ra", {
          description: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
        });
      }
    },
  });

  const onEmailSubmit = (data: ForgotPasswordFormData) => {
    forgotPasswordMutation.mutate(data.email);
  };

  // Step 2: Verify OTP
  const otpForm = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email: "", otp: "" },
  });

  // Update OTP form when email changes
  useEffect(() => {
    if (email && step === 2) {
      otpForm.reset({ email, otp: "" });
    }
  }, [email, step, otpForm]);

  const verifyOtpMutation = useMutation({
    mutationFn: verifyResetOtp,
    onSuccess: (response) => {
      if (response.success && response.data) {
        toast.success("OTP xác thực thành công!", {
          description: "Bây giờ bạn có thể đặt lại mật khẩu mới.",
        });
        setResetToken(response.data.resetToken);
        setStep(3);
      } else {
        toast.error("OTP không chính xác", {
          description: response.errors?.[0]?.message || response.message,
        });
      }
    },
    onError: (error: unknown) => {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response: { data: ApiResponse<null> } };
        const errorData = axiosError.response.data;
        const errorMessage =
          errorData.errors?.[0]?.message || errorData.message;
        toast.error("OTP không chính xác", {
          description: errorMessage || "Vui lòng kiểm tra lại mã OTP.",
        });
      } else {
        toast.error("Có lỗi xảy ra", {
          description: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
        });
      }
    },
  });

  const onOtpSubmit = (data: VerifyOtpFormData) => {
    verifyOtpMutation.mutate({ email, otp: data.otp });
  };

  // Step 3: Reset Password
  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      resetToken: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update reset form when email and resetToken change
  useEffect(() => {
    if (email && resetToken && step === 3) {
      resetForm.reset({
        email,
        resetToken,
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [email, resetToken, step, resetForm]);

  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Đặt lại mật khẩu thành công!", {
          description: "Bạn sẽ được chuyển đến trang đăng nhập trong giây lát.",
        });
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        toast.error("Đặt lại mật khẩu thất bại", {
          description: response.errors?.[0]?.message || response.message,
        });
      }
    },
    onError: (error: unknown) => {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response: { data: ApiResponse<null> } };
        const errorData = axiosError.response.data;
        const errorMessage =
          errorData.errors?.[0]?.message || errorData.message;
        toast.error("Đặt lại mật khẩu thất bại", {
          description: errorMessage || "Có lỗi xảy ra, vui lòng thử lại.",
        });
      } else {
        toast.error("Có lỗi xảy ra", {
          description: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
        });
      }
    },
  });

  const onResetSubmit = (data: ResetPasswordFormData) => {
    resetPasswordMutation.mutate({
      email,
      resetToken,
      newPassword: data.newPassword,
    });
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <form
            onSubmit={emailForm.handleSubmit(onEmailSubmit)}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-900 dark:text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                autoComplete="email"
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                {...emailForm.register("email")}
              />
              {emailForm.formState.errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-cyan-600 dark:hover:bg-cyan-700"
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending ? "Đang gửi..." : "Gửi mã OTP"}
            </Button>
          </form>
        );

      case 2:
        return (
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
                key={`email-display-${step}`}
                id="email-display"
                type="email"
                value={email || ""}
                disabled
                readOnly
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 bg-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-gray-900 dark:text-white">
                Mã OTP
              </Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  {...otpForm.register("otp")}
                  onChange={(value) => otpForm.setValue("otp", value)}
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
              {otpForm.formState.errors.otp && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center">
                  {otpForm.formState.errors.otp.message}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 dark:border-gray-600 dark:text-gray-300"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                disabled={verifyOtpMutation.isPending}
              >
                {verifyOtpMutation.isPending ? "Đang xác thực..." : "Xác thực"}
              </Button>
            </div>
          </form>
        );

      case 3:
        return (
          <form
            onSubmit={resetForm.handleSubmit(onResetSubmit)}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label
                htmlFor="email-final"
                className="text-gray-900 dark:text-white"
              >
                Email
              </Label>
              <Input
                key={`email-final-${step}`}
                id="email-final"
                type="email"
                value={email || ""}
                disabled
                readOnly
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 bg-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="newPassword"
                className="text-gray-900 dark:text-white"
              >
                Mật khẩu mới
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu mới"
                  autoComplete="new-password"
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white pr-10"
                  {...resetForm.register("newPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {resetForm.formState.errors.newPassword && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {resetForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-gray-900 dark:text-white"
              >
                Xác nhận mật khẩu
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white pr-10"
                  {...resetForm.register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {resetForm.formState.errors.confirmPassword && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {resetForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 dark:border-gray-600 dark:text-gray-300"
                onClick={() => setStep(2)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending
                  ? "Đang đặt lại..."
                  : "Đặt lại mật khẩu"}
              </Button>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Quên mật khẩu?";
      case 2:
        return "Xác thực OTP";
      case 3:
        return "Đặt lại mật khẩu";
      default:
        return "";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1:
        return "Nhập email của bạn để nhận mã OTP đặt lại mật khẩu";
      case 2:
        return "Nhập mã OTP đã được gửi đến email của bạn";
      case 3:
        return "Tạo mật khẩu mới cho tài khoản của bạn";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6a11cb] to-[#2575fc] dark:from-gray-900 dark:via-black dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-500 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 shadow-xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageCircle className="h-7 w-7 text-purple-600 dark:text-cyan-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              FastBite Group
            </span>
          </div>
          <CardTitle className="text-2xl text-gray-900 dark:text-white">
            {getStepTitle()}
          </CardTitle>
          <CardDescription className="dark:text-gray-300">
            {getStepDescription()}
          </CardDescription>
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map((stepNum) => (
              <div
                key={stepNum}
                className={`h-2 w-8 rounded-full transition-colors ${
                  stepNum === step
                    ? "bg-purple-600 dark:bg-cyan-400"
                    : stepNum < step
                    ? "bg-purple-300 dark:bg-cyan-300"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nhớ mật khẩu?{" "}
            <Link
              href="/login"
              className="text-purple-600 hover:text-purple-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-medium underline"
            >
              Đăng nhập
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
