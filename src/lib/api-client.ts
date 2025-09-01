// lib/api-client.ts
import axios from "axios";
import Cookies from "js-cookie";
import { LoginFormData, RegisterFormData } from "./schemas/auth.schema";
import {
  ApiResponse,
  VerifyResetOtpResponse,
  DashboardSummaryDto,
  AdminNotificationDto,
  PagedResult,
  AdminSettingsDto,
  UpdateSettingsRequest,
} from "@/types/api.types";
import { AuthData } from "@/types/api.types";
import { useAuthStore } from "@/store/authStore";

// Disable SSL certificate validation for development
// if (process.env.NODE_ENV === "development") {
//   process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// }

const apiClient = axios.create({
  baseURL: "https://localhost:7007/api/v1",
});

// Request Interceptor: Tự động gắn AccessToken vào mỗi request
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && config.headers) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Xử lý khi AccessToken hết hạn
apiClient.interceptors.response.use(
  (response) => response, // Trả về response nếu không có lỗi
  async (error: Error | any) => {
    const originalRequest = error.config;
    const authStore = useAuthStore.getState();

    // Chỉ xử lý lỗi 401 và khi request đó chưa phải là request thử lại
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._isRetry
    ) {
      originalRequest._isRetry = true; // Đánh dấu là đã thử lại

      try {
        const refreshToken = authStore.refreshToken;
        if (!refreshToken) {
          authStore.logout();
          return Promise.reject(error);
        }

        // Gọi API để làm mới token
        const response = await axios.post<ApiResponse<AuthData>>(
          "https://localhost:7007/api/v1/Auth/refresh-token",
          { token: refreshToken }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data.data;

        // Cập nhật token mới vào store và cookie
        authStore.login(
          response.data.data.user,
          newAccessToken,
          newRefreshToken
        );
        Cookies.set("auth_token", newAccessToken);

        // Cập nhật header của request gốc và thực hiện lại nó
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Nếu refresh token thất bại, đăng xuất người dùng
        authStore.logout();
        window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// ... hàm loginUser ...
export const loginUser = async (
  data: LoginFormData
): Promise<ApiResponse<AuthData>> => {
  const response = await apiClient.post<ApiResponse<AuthData>>(
    "/Auth/login",
    data
  );
  return response.data; // BE
};

// Hàm Đăng ký
export const registerUser = async (data: RegisterFormData) => {
  const response = await apiClient.post<ApiResponse<string>>("/Auth/register", {
    ...data,
    dateOfBirth: data.dateOfBirth.toISOString(),
  });
  return response.data;
};
// link Confirm Email
export const confirmEmail = async ({
  userId,
  token,
}: {
  userId: string;
  token: string;
}) => {
  const response = await apiClient.get<ApiResponse<string>>(
    `/Auth/confirm-email?userId=${userId}&token=${token}`
  );
  return response.data;
};
// link Resend Email
export const resendConfirmationEmail = async (email: string) => {
  // Dữ liệu gửi đi dưới dạng raw string, cần bọc trong JSON.stringify
  const response = await apiClient.post<ApiResponse<string>>(
    "/Auth/resend-confirmation",
    JSON.stringify(email),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};
// hàm logout
export const logoutUser = async (refreshToken: string) => {
  const response = await apiClient.post<ApiResponse<object>>("/Auth/logout", {
    refreshToken,
  });
  return response.data;
};

// ===============================
// FORGOT PASSWORD API FUNCTIONS
// ===============================

// Step 1: Request Password Reset OTP
export const forgotPassword = async (email: string) => {
  const response = await apiClient.post<ApiResponse<object>>(
    "/Auth/forgot-password",
    { email }
  );
  return response.data;
};

// Step 2: Verify OTP
export const verifyResetOtp = async (data: { email: string; otp: string }) => {
  const response = await apiClient.post<ApiResponse<VerifyResetOtpResponse>>(
    "/Auth/verify-reset-otp",
    data
  );
  return response.data;
};

// Step 3: Reset Password
export const resetPassword = async (data: {
  email: string;
  resetToken: string;
  newPassword: string;
}) => {
  const response = await apiClient.post<ApiResponse<object>>(
    "/Auth/reset-password",
    data
  );
  return response.data;
};

// ===============================
// TWO-FACTOR AUTHENTICATION (2FA) API FUNCTIONS
// ===============================

// Verify 2FA OTP
export const verifyTwoFactor = async (data: {
  email: string;
  code: string;
  rememberMe: boolean;
}) => {
  const response = await apiClient.post<ApiResponse<AuthData>>(
    "/Auth/verify-2fa",
    data
  );
  return response.data;
};

// Send 2FA Code (Resend)
export const sendTwoFactorCode = async (email: string) => {
  const response = await apiClient.post<ApiResponse<object>>(
    "/Auth/send-2fa-code",
    { email }
  );
  return response.data;
};

// ===============================
// ADMIN DASHBOARD API FUNCTIONS
// ===============================

// Get Dashboard Summary
export const getDashboardSummary = async () => {
  const response = await apiClient.get<ApiResponse<DashboardSummaryDto>>(
    "/admin/dashboard/summary"
  );
  return response.data;
};

// ===============================
// ADMIN NOTIFICATIONS API FUNCTIONS
// ===============================

// Get Recent Notifications
export const getRecentNotifications = async (
  pageNumber: number = 1, 
  pageSize: number = 10,
  typeFilter?: string,
  statusFilter?: 'all' | 'unread'
) => {
  const params = new URLSearchParams({
    pageNumber: pageNumber.toString(),
    pageSize: pageSize.toString(),
  });
  
  if (typeFilter && typeFilter !== "all") {
    params.append("notificationType", typeFilter);
  }

  // Add the status filter to the params sent to the backend
  if (statusFilter === "unread") {
    params.append("isRead", "false");
  }
  
  const response = await apiClient.get<ApiResponse<PagedResult<AdminNotificationDto>>>(
    `/admin/notification?${params.toString()}`
  );
  return response.data;
};

// Mark a Notification as Read
export const markNotificationAsRead = async (notificationId: number) => {
  const response = await apiClient.post<ApiResponse<object>>(
    `/admin/notification/${notificationId}/mark-as-read`
  );
  return response.data;
};

// Mark All Notifications as Read
export const markAllNotificationsAsRead = async () => {
  const response = await apiClient.post<ApiResponse<object>>(
    "/admin/notification/mark-all-as-read"
  );
  return response.data;
};

// ===============================
// ADMIN SETTINGS API FUNCTIONS
// ===============================

// Get All Admin Settings
export const getAdminSettings = async () => {
  const response = await apiClient.get<ApiResponse<AdminSettingsDto>>(
    "/admin/settings"
  );
  return response.data;
};

// Update Admin Settings
export const updateAdminSettings = async (request: UpdateSettingsRequest) => {
  const response = await apiClient.put<ApiResponse<boolean>>(
    "/admin/settings",
    request
  );
  return response.data;
};
