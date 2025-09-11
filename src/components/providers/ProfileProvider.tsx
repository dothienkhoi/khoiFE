"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { UserProfile } from "@/types/customer.types";
import { customerApiClient } from "@/lib/customer-api-client";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

interface ProfileContextType {
    userProfile: UserProfile | null;
    isLoading: boolean;
    error: string | null;
    refreshProfile: () => Promise<void>;
    forceRefreshProfile: () => Promise<void>;
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
    isRefreshing: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasTriedInitial = useRef(false);
    const accessToken = useAuthStore((s) => s.accessToken);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    const loadProfile = async (retryCount: number = 0) => {
        try {
            setIsLoading(true);
            setError(null);

            // Kiểm tra authentication trước khi gọi API (cookie hoặc store)
            const cookieToken = document.cookie.split('; ').find(row => row.startsWith('auth_token='));
            const storeToken = useAuthStore.getState().accessToken;
            if (!cookieToken && !storeToken) {
                console.warn("[ProfileProvider] No auth token found, skipping profile load");
                // Không set error, chỉ skip load để tránh hiện màn hình lỗi
                return;
            }

            console.log("[ProfileProvider] Loading profile from:", `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7007"}/api/v1/me/profile`);

            // Sử dụng API /me/profile để lấy thông tin người dùng hiện tại
            const response = await customerApiClient.get("/me/profile");

            console.log("[ProfileProvider] Raw API response:", response);
            console.log("[ProfileProvider] Response status:", response.status);
            console.log("[ProfileProvider] Response headers:", response.headers);
            console.log("[ProfileProvider] Response data type:", typeof response.data);
            console.log("[ProfileProvider] Response data keys:", response.data ? Object.keys(response.data) : 'No data');

            console.log("[ProfileProvider] Raw API response:", response);
            console.log("[ProfileProvider] Response data:", response.data);

            // Kiểm tra response format
            if (response.data && typeof response.data === 'object') {
                // Kiểm tra success field
                if ('success' in response.data && response.data.success) {
                    const data = response.data as any;
                    if (data.data) {
                        const profileData = data.data;
                        console.log("[ProfileProvider] Raw profile data from API:", profileData);

                        // Handle field mapping cho cả API response và SQL field names
                        const mappedProfileData = {
                            ...profileData,
                            // Map từ SQL field names (nếu có)
                            firstName: profileData.firstName || profileData.FisrtName || profileData.FirstName || "",
                            lastName: profileData.lastName || profileData.LastName || "",
                            dateOfBirth: profileData.dateOfBirth || profileData.DateOfBirth || "",
                            bio: profileData.bio || profileData.Bio || "",
                            fullName: profileData.fullName || profileData.FullName || "",
                            // Ensure 2FA flag is captured regardless of casing/naming
                            twoFactorEnabled: (
                                profileData.twoFactorEnabled ??
                                profileData.TwoFactorEnabled ??
                                profileData.isTwoFactorEnabled ??
                                profileData.IsTwoFactorEnabled ??
                                false
                            )
                        };

                        console.log("[ProfileProvider] Original API fields:", {
                            firstName: profileData.firstName,
                            lastName: profileData.lastName,
                            dateOfBirth: profileData.dateOfBirth,
                            bio: profileData.bio,
                            fullName: profileData.fullName
                        });

                        console.log("[ProfileProvider] Mapped profile fields:", {
                            firstName: mappedProfileData.firstName,
                            lastName: mappedProfileData.lastName,
                            dateOfBirth: mappedProfileData.dateOfBirth,
                            bio: mappedProfileData.bio,
                            fullName: mappedProfileData.fullName
                        });

                        setUserProfile(prev => ({ ...(prev || {}), ...mappedProfileData }));
                        console.log("[ProfileProvider] Profile loaded successfully:", mappedProfileData);
                        console.log("[ProfileProvider] Final userProfile state:", mappedProfileData);
                    } else {
                        throw new Error("No profile data in response");
                    }
                } else if ('message' in response.data && typeof response.data.message === 'string') {
                    // API trả về error message
                    throw new Error(response.data.message);
                } else {
                    // Response không có success field, có thể là data trực tiếp
                    // Kiểm tra xem có phải UserProfile không
                    if (response.data && typeof response.data === 'object' && 'id' in response.data) {
                        const directData = response.data as any;
                        const mappedDirectData = {
                            ...directData,
                            // Map từ SQL field names (nếu có)
                            firstName: directData.firstName || directData.FisrtName || directData.FirstName || "",
                            lastName: directData.lastName || directData.LastName || "",
                            dateOfBirth: directData.dateOfBirth || directData.DateOfBirth || "",
                            bio: directData.bio || directData.Bio || "",
                            fullName: directData.fullName || directData.FullName || "",
                            twoFactorEnabled: (
                                directData.twoFactorEnabled ??
                                directData.TwoFactorEnabled ??
                                directData.isTwoFactorEnabled ??
                                directData.IsTwoFactorEnabled ??
                                false
                            )
                        };

                        console.log("[ProfileProvider] Direct response data:", directData);
                        console.log("[ProfileProvider] Mapped direct data:", mappedDirectData);

                        setUserProfile(prev => ({ ...(prev || {}), ...mappedDirectData }));
                        console.log("[ProfileProvider] Profile loaded directly:", mappedDirectData);
                    } else {
                        throw new Error("Invalid profile data format");
                    }
                }
            } else {
                throw new Error("Invalid response format");
            }
        } catch (error: any) {
            console.error("[ProfileProvider] Error loading user profile:", error);

            let errorMessage = "Không thể tải thông tin hồ sơ";

            if (error.response) {
                // HTTP error response
                const status = error.response.status;
                const data = error.response.data;

                console.log("[ProfileProvider] HTTP Error Status:", status);
                console.log("[ProfileProvider] HTTP Error Data:", data);

                if (status === 401) {
                    errorMessage = "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại";
                } else if (status === 403) {
                    errorMessage = "Bạn không có quyền truy cập thông tin này";
                } else if (status === 404) {
                    errorMessage = "API endpoint không tồn tại";
                } else if (status >= 500) {
                    errorMessage = "Lỗi server, vui lòng thử lại sau";
                } else if (data && data.message) {
                    errorMessage = data.message;
                } else {
                    errorMessage = `Lỗi ${status}: Không thể tải thông tin hồ sơ`;
                }
            } else if (error.request) {
                // Network error
                errorMessage = "Lỗi kết nối mạng, vui lòng kiểm tra kết nối internet";
            } else if (error.message) {
                // Other errors
                errorMessage = error.message;
            }

            // Chỉ set error message, không hiển thị toast để tránh spam
            setError(errorMessage);
            console.warn("[ProfileProvider] Profile loading failed:", errorMessage);

            // Retry logic cho network errors
            if (retryCount < 2 && (error.request || error.message?.includes('timeout'))) {
                console.log(`[ProfileProvider] Retrying profile load (${retryCount + 1}/3)...`);
                setTimeout(() => {
                    loadProfile(retryCount + 1);
                }, 1000 * (retryCount + 1)); // 1s, 2s delays
            }
        } finally {
            setIsLoading(false);
        }
    };

    const refreshProfile = async () => {
        try {
            setIsRefreshing(true);
            setError(null); // Clear any previous errors
            console.log("[ProfileProvider] Force refreshing profile...");
            await loadProfile();
        } finally {
            setIsRefreshing(false);
        }
    };

    const forceRefreshProfile = async () => {
        try {
            setIsRefreshing(true);
            setError(null);
            setUserProfile(null); // Clear current profile to force fresh load
            console.log("[ProfileProvider] Force clearing and refreshing profile...");
            await loadProfile();
        } finally {
            setIsRefreshing(false);
        }
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
        try {
            console.log("[ProfileProvider] Updating profile with:", updates);

            // Sử dụng API /me/profile để cập nhật thông tin người dùng
            const body: any = { ...updates };

            // API /api/v1/me/profile mong đợi field names: firstName, lastName, dateOfBirth, bio
            // Không cần field mapping vì API đã sử dụng đúng field names
            console.log("[ProfileProvider] Original updates:", updates);
            console.log("[ProfileProvider] Final request body:", body);

            // Chuẩn hóa dateOfBirth thành ISO string nếu là yyyy-MM-dd
            if (body.dateOfBirth && typeof body.dateOfBirth === 'string' && body.dateOfBirth.length === 10) {
                const iso = new Date(body.dateOfBirth + 'T00:00:00Z').toISOString();
                body.dateOfBirth = iso;
                console.log("[ProfileProvider] Converted dateOfBirth to ISO:", iso);
            }
            console.log("[ProfileProvider] Sending request to /me/profile with body:", body);
            const response = await customerApiClient.put("/me/profile", body);
            console.log("[ProfileProvider] Raw API response:", response);
            console.log("[ProfileProvider] Response data:", response.data);

            // Kiểm tra response format
            if (response.data && typeof response.data === 'object') {
                if ('success' in response.data && response.data.success) {
                    const data = response.data as any;
                    if (data.data) {
                        console.log("[ProfileProvider] Setting new profile data:", data.data);

                        // Cập nhật state với dữ liệu mới từ API response
                        setUserProfile(prevProfile => {
                            if (prevProfile) {
                                // Merge dữ liệu cũ với dữ liệu mới từ API
                                const updatedProfile = { ...prevProfile, ...data.data } as UserProfile;

                                // Đảm bảo 2FA được cập nhật ngay cả khi API không trả về field này
                                if (typeof (updates as any)?.twoFactorEnabled === 'boolean') {
                                    (updatedProfile as any).twoFactorEnabled = (updates as any).twoFactorEnabled;
                                }

                                console.log("[ProfileProvider] Previous profile:", prevProfile);
                                console.log("[ProfileProvider] API response data:", data.data);
                                console.log("[ProfileProvider] Updated profile state:", updatedProfile);

                                // Force re-render bằng cách tạo object mới hoàn toàn
                                return { ...updatedProfile };
                            }
                            const baseProfile = { ...(data.data as any) } as UserProfile;
                            if (typeof (updates as any)?.twoFactorEnabled === 'boolean') {
                                (baseProfile as any).twoFactorEnabled = (updates as any).twoFactorEnabled;
                            }
                            return baseProfile;
                        });

                        console.log("[ProfileProvider] Profile updated successfully");
                        toast.success("Cập nhật thông tin thành công");

                        // Force refresh profile để đảm bảo dữ liệu đồng bộ
                        setTimeout(() => {
                            console.log("[ProfileProvider] Force refreshing profile after update...");
                            loadProfile();
                        }, 100); // Giảm delay để refresh nhanh hơn

                        return data.data;
                    } else {
                        console.error("[ProfileProvider] No profile data in response");
                        throw new Error("No updated profile data in response");
                    }
                } else if ('message' in response.data && typeof response.data.message === 'string') {
                    console.error("[ProfileProvider] API returned error message:", response.data.message);
                    throw new Error(response.data.message);
                } else {
                    console.error("[ProfileProvider] Invalid response format from update API");
                    throw new Error("Invalid response format from update API");
                }
            } else {
                console.error("[ProfileProvider] Response is not an object:", response.data);
                throw new Error("Invalid response format");
            }
        } catch (error: any) {
            console.error("[ProfileProvider] Error updating profile:", error);
            console.error("[ProfileProvider] Error details:", {
                message: error.message,
                response: error.response,
                request: error.request
            });

            let errorMessage = "Cập nhật thông tin thất bại";

            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;

                console.log("[ProfileProvider] HTTP Error Status:", status);
                console.log("[ProfileProvider] HTTP Error Data:", data);

                if (status === 400) {
                    errorMessage = "Dữ liệu không hợp lệ, vui lòng kiểm tra lại";
                } else if (status === 401) {
                    errorMessage = "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại";
                } else if (status === 403) {
                    errorMessage = "Bạn không có quyền cập nhật thông tin này";
                } else if (status === 422) {
                    errorMessage = "Dữ liệu không đúng định dạng yêu cầu";
                } else if (status >= 500) {
                    errorMessage = "Lỗi server, vui lòng thử lại sau";
                } else if (data && data.message) {
                    errorMessage = data.message;
                } else {
                    errorMessage = `Lỗi ${status}: Cập nhật thông tin thất bại`;
                }
            } else if (error.request) {
                console.log("[ProfileProvider] Network error - no response received");
                errorMessage = "Lỗi kết nối mạng, vui lòng kiểm tra kết nối internet";
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
            throw error;
        }
    };

    useEffect(() => {
        console.log("[ProfileProvider] userProfile changed:", userProfile);
        console.log("[ProfileProvider] userProfile details:", {
            firstName: userProfile?.firstName,
            lastName: userProfile?.lastName,
            dateOfBirth: userProfile?.dateOfBirth,
            bio: userProfile?.bio,
            twoFactorEnabled: userProfile?.twoFactorEnabled
        });
    }, [userProfile]);

    useEffect(() => {
        // Load once when provider mounts (if token is already available)
        if (!hasTriedInitial.current) {
            hasTriedInitial.current = true;
            loadProfile();
        }
    }, []);

    useEffect(() => {
        // Sau khi đăng nhập (token thay đổi từ null -> có), tải hồ sơ ngay
        if (isAuthenticated && accessToken && !userProfile && !isLoading) {
            loadProfile();
        }
    }, [isAuthenticated, accessToken]);

    const value: ProfileContextType = {
        userProfile,
        isLoading,
        error,
        refreshProfile,
        forceRefreshProfile,
        updateProfile,
        isRefreshing,
    };

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfile() {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error("useProfile must be used within a ProfileProvider");
    }
    return context;
}
