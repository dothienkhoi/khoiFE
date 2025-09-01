// types/api.types.ts

// =========================/**

// GENERIC API WRAPPER TYPES
// These interfaces describe the standard structure of API responses.
// =================================================================

export interface ApiError {
  errorCode: string;
  message: string;
}

/**
 * Describes the standard wrapper for most API responses.
 * `T` is a generic type representing the specific `data` payload.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: ApiError[] | null;
}

/**
 * Describes the structure for APIs that return paginated lists of data.
 */
export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

// =================================================================
// AUTHENTICATION SPECIFIC TYPES
// These interfaces describe the data models related to authentication.
// =================================================================

/**
 * Describes the detailed user information returned after a successful login.
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl: string | null;
  roles: string[];
}

/**
 * Describes the `data` object within the response of a successful login API call.
 */
export interface AuthData {
  rememberMe: boolean;
  accessToken: string;
  refreshToken: string;
  user: User;
  requiresTwoFactor?: boolean; // Optional flag for 2FA requirement
}

/**
 * Describes the response data from the OTP verification step in forgot password flow.
 */
export interface VerifyResetOtpResponse {
  resetToken: string;
}

// =================================================================
// ADMIN DASHBOARD SPECIFIC TYPES
// These interfaces describe the data models related to admin dashboard.
// =================================================================

/**
 * Describes the key statistics displayed on the admin dashboard.
 */
export interface DashboardKeyStats {
  totalUsers: number;
  newUsersLast7Days: number;
  totalGroups: number;
  totalPosts: number;
}

/**
 * Describes a single data point in the user growth chart.
 */
export interface UserGrowthDataPoint {
  date: string;
  newUserCount: number;
}

/**
 * Describes a recent user entry for the dashboard.
 */
export interface RecentUser {
  userId: string;
  fullName: string;
  createdAt: string;
}

/**
 * Describes a recent group entry for the dashboard.
 */
export interface RecentGroup {
  groupId: string;
  groupName: string;
  createdAt: string;
}

/**
 * Describes the complete dashboard summary data structure.
 */
export interface DashboardSummaryDto {
  keyStats: DashboardKeyStats;
  userGrowthChartData: UserGrowthDataPoint[];
  recentUsers: RecentUser[];
  recentGroups: RecentGroup[];
}

// =================================================================
// ADMIN NOTIFICATIONS SPECIFIC TYPES
// These interfaces describe the data models related to admin notifications.
// =================================================================

/**
 * The official enumeration for notification types.
 */
export type AdminNotificationType = 
  | "NewUserRegistered" 
  | "ContentReported" 
  | "NewGroupCreated"
  | "BackgroundJobFailed"
  | "GeneralAnnouncement";

/**
 * The main Data Transfer Object for a single notification.
 */
export interface AdminNotificationDto {
  id: number;
  notificationType: AdminNotificationType;
  message: string;
  linkTo?: string; // URL to navigate to when the notification is clicked
  isRead: boolean;
  timestamp: string; // ISO 8601 Date string
  triggeredByUserId?: string; // UUID
  triggeredByUserName?: string;
}

/**
 * The payload structure for real-time SignalR notifications.
 */
export interface RealtimeNotificationPayload {
  id: number;
  message: string;
  linkTo?: string;
  timestamp: string; // ISO 8601 Date string
}

// =================================================================
// ADMIN SETTINGS TYPES
// These interfaces describe the data models for admin settings management.
// =================================================================

/**
 * All possible setting keys that can be managed in the admin panel.
 */
export type SettingKey = 
  | "SiteName" 
  | "MaintenanceMode" 
  | "AllowNewRegistrations"
  | "RequireEmailConfirmation" 
  | "DefaultRoleForNewUsers"
  | "ForbiddenKeywords" 
  | "AutoLockAccountThreshold"
  | "MaxFileSizeMb" 
  | "MaxAvatarSizeMb" 
  | "AllowedFileTypes";

/**
 * The DTO for data received from the GET /api/admin/settings endpoint.
 * All values are returned as strings from the API.
 */
export type AdminSettingsDto = Record<SettingKey, string>;

/**
 * The DTO for the PUT /api/admin/settings request body.
 * Only changed settings should be included.
 */
export interface UpdateSettingsRequest {
  settings: Partial<AdminSettingsDto>;
}
