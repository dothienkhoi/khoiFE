"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";


export default function CustomerRedirectPage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        // Redirect to main customer page
        router.push("/chat");
    }, [isAuthenticated, router]);

    return null;
}


