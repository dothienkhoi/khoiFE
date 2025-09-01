"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";

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

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Đang chuyển hướng...</p>
            </div>
        </div>
    );
}


