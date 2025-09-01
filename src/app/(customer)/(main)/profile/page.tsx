"use client";

import { useEffect } from "react";
import { useCustomerStore } from "@/store/customerStore";
import { ProfileView } from "@/components/features/profile/ProfileView";

export default function ProfilePage() {
    const {
        setActiveNavItem,
        clearActiveChat
    } = useCustomerStore();

    useEffect(() => {
        setActiveNavItem('profile');
        // Clear any active chat when entering profile page
        clearActiveChat();
    }, [setActiveNavItem, clearActiveChat]);

    return (
        <div className="h-full p-6">
            <ProfileView />
        </div>
    );
}
