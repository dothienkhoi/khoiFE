"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCustomerStore } from "@/store/customerStore";

export default function CustomerPage() {
    const router = useRouter();
    const {
        setActiveNavItem
    } = useCustomerStore();

    useEffect(() => {
        setActiveNavItem('chats');
        router.push('/chat');
    }, [setActiveNavItem, router]);

    return null;
}
