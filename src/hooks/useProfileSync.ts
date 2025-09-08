"use client";

import { useEffect, useRef } from "react";
import { useProfile } from "@/components/providers/ProfileProvider";

/**
 * Hook để đồng bộ dữ liệu profile giữa các component
 * Tự động refresh khi có thay đổi
 */
export function useProfileSync() {
    const { userProfile, refreshProfile, isRefreshing } = useProfile();
    const lastUpdateTime = useRef<number>(0);

    // Disabled auto-refresh to prevent unwanted page reloads
    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         const now = Date.now();
    //         if (now - lastUpdateTime.current > 30000) { // 30 seconds
    //             refreshProfile();
    //             lastUpdateTime.current = now;
    //         }
    //     }, 30000);

    //     return () => clearInterval(interval);
    // }, [refreshProfile]);

    // Cập nhật thời gian khi profile thay đổi
    useEffect(() => {
        if (userProfile) {
            lastUpdateTime.current = Date.now();
        }
    }, [userProfile]);

    return {
        userProfile,
        refreshProfile,
        isRefreshing,
        lastUpdateTime: lastUpdateTime.current
    };
}

