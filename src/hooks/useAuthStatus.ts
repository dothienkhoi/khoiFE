"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/components/providers/ProfileProvider";

/**
 * Hook để kiểm tra trạng thái authentication và tự động xử lý
 */
export function useAuthStatus() {
    const { userProfile, error, refreshProfile } = useProfile();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        if (userProfile) {
            setIsAuthenticated(true);
            setAuthError(null);
        } else if (error) {
            setIsAuthenticated(false);

            // Kiểm tra các lỗi authentication cụ thể
            if (error.includes("401") || error.includes("Phiên đăng nhập đã hết hạn")) {
                setAuthError("AUTH_EXPIRED");
            } else if (error.includes("403") || error.includes("không có quyền")) {
                setAuthError("AUTH_FORBIDDEN");
            } else if (error.includes("404") || error.includes("không tồn tại")) {
                setAuthError("API_NOT_FOUND");
            } else {
                setAuthError("OTHER_ERROR");
            }
        } else {
            setIsAuthenticated(false);
            setAuthError(null);
        }
    }, [userProfile, error]);

    const handleAuthError = async () => {
        if (authError === "AUTH_EXPIRED") {
            // Thử refresh profile một lần nữa
            try {
                await refreshProfile();
            } catch (refreshError) {
                // Nếu vẫn lỗi, có thể cần redirect đến login
                console.error("[useAuthStatus] Refresh failed:", refreshError);
            }
        }
    };

    return {
        isAuthenticated,
        authError,
        userProfile,
        handleAuthError,
        refreshProfile
    };
}

