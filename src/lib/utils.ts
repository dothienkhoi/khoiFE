import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utility function to handle API errors consistently
 */
export function handleApiError(error: any, title: string = "Đã xảy ra lỗi") {
  console.error(`[API Error] ${title}:`, error);

  let errorMessage = "Đã xảy ra lỗi không xác định";

  if (error?.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error?.response?.data?.errors?.[0]?.message) {
    errorMessage = error.response.data.errors[0].message;
  } else if (error?.message) {
    errorMessage = error.message;
  }

  return {
    success: false,
    message: errorMessage,
    error: error
  };
}

/**
 * Utility function to validate group data
 */
export function validateGroupData(group: any): boolean {
  return group &&
    typeof group === 'object' &&
    group.groupId &&
    group.groupName &&
    typeof group.groupName === 'string';
}

/**
 * Utility function to safely get string value and call toLowerCase
 */
export function safeToLowerCase(value: any): string {
  if (typeof value === 'string') {
    return value.toLowerCase();
  }
  return '';
}

// Format file size utility function
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${size} ${sizes[i]}`;
}
