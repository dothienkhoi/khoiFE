"use client";

import { useEffect } from "react";
import { useCustomerStore } from "@/store/customerStore";
import { ChatInterface } from "@/components/features/chat/ChatInterface";
import { ConversationSidebar } from "@/components/features/chat/ConversationSidebar";

export default function ChatPage() {
    const {
        setActiveNavItem
    } = useCustomerStore();

    useEffect(() => {
        setActiveNavItem('chats');
    }, [setActiveNavItem]);

    return (
        <div className="flex h-full chat-page-layout">
            {/* Cột trái: Danh sách trò chuyện cá nhân */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                <ConversationSidebar />
            </div>

            {/* Cột phải: Khung chat chính */}
            <div className="flex-1">
                <ChatInterface />
            </div>
        </div>
    );
}
