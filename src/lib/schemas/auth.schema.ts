import { z } from "zod";
// dùng đẻ xác thực dữ liệu đầu vào cho form
// Schema cho form Đăng ký
export const registerSchema = z
  .object({
    firstName: z.string().min(1, "Vui lòng nhập Tên."),
    lastName: z.string().min(1, "Vui lòng nhập Họ."),
    dateOfBirth: z.date(),
    email: z.email({ message: "Email không hợp lệ." }),
    password: z
      .string()
      .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không trùng khớp.",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// Schema cho form Đăng nhập
export const loginSchema = z.object({
  email: z.email({ message: "Email không hợp lệ." }),
  password: z.string().min(1, { message: "Vui lòng nhập mật khẩu." }),
  rememberMe: z.boolean(), // Explicit default value
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Schema cho Forgot Password - Step 1: Nhập email
export const forgotPasswordSchema = z.object({
  email: z.email({ message: "Email không hợp lệ." }),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Schema cho Forgot Password - Step 2: Xác thực OTP
export const verifyOtpSchema = z.object({
  email: z.email({ message: "Email không hợp lệ." }),
  otp: z.string().min(1, { message: "Vui lòng nhập mã OTP." }),
});

export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;

// Schema cho Forgot Password - Step 3: Đặt lại mật khẩu
export const resetPasswordSchema = z
  .object({
    email: z.email({ message: "Email không hợp lệ." }),
    resetToken: z.string().min(1, { message: "Reset token is required." }),
    newPassword: z
      .string()
      .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu không trùng khớp.",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Schema cho Two-Factor Authentication (2FA) - Xác thực OTP
export const verify2faSchema = z.object({
  email: z.email({ message: "Email không hợp lệ." }),
  code: z.string().length(6, { message: "Mã OTP phải có đúng 6 ký tự." }),
  rememberMe: z.boolean(),
});

export type Verify2faFormData = z.infer<typeof verify2faSchema>;

//
