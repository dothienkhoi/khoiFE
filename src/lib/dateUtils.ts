import { format } from "date-fns";
import { vi } from "date-fns/locale";

/**
 * Format message timestamp like Zalo app
 * @param timestamp - ISO string timestamp
 * @returns Formatted time string
 */
export const formatMessageTime = (timestamp: string): string => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

    // Same day - show specific time
    if (messageDay.getTime() === today.getTime()) {
        return format(messageDate, 'HH:mm', { locale: vi });
    }

    // Yesterday - show "Hôm qua"
    if (messageDay.getTime() === yesterday.getTime()) {
        return `Hôm qua`;
    }

    // Older - show day of week and date
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dayOfWeek = dayNames[messageDate.getDay()];
    return `${dayOfWeek} ${format(messageDate, 'dd/MM/yyyy', { locale: vi })}`;
};

/**
 * Format last seen time for conversation list
 * @param timestamp - ISO string timestamp
 * @returns Formatted time string
 */
export const formatLastSeen = (timestamp: string): string => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

    // Same day - show specific time
    if (messageDay.getTime() === today.getTime()) {
        return format(messageDate, 'HH:mm', { locale: vi });
    }

    // Yesterday - show "Hôm qua"
    if (messageDay.getTime() === yesterday.getTime()) {
        return `Hôm qua`;
    }

    // Older - show day of week and date
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dayOfWeek = dayNames[messageDate.getDay()];
    return `${dayOfWeek} ${format(messageDate, 'dd/MM/yyyy', { locale: vi })}`;
};
