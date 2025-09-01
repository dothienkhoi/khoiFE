"use client";

import { useEffect } from "react";
import { useCustomerStore } from "@/store/customerStore";
import { ChatInterface } from "@/components/features/chat/ChatInterface";
import { ChatSidebar } from "@/components/features/chat/ChatSidebar";

export default function ChatPage() {
    const {
        setActiveNavItem
    } = useCustomerStore();

    useEffect(() => {
        setActiveNavItem('chats');
    }, [setActiveNavItem]);

    return (
        <div className="flex h-full chat-page-layout">
            {/* Cột trái: Danh sách chat với tab Cá nhân/Nhóm */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                <ChatSidebar />
            </div>

            {/* Cột phải: Khung chat chính */}
            <div className="flex-1">
                <ChatInterface />
            </div>
        </div>
    );
}
