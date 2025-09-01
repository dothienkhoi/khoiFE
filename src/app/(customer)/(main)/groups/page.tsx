"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCustomerStore } from "@/store/customerStore";
import { Send, Loader2 } from "lucide-react";
import { GroupChatInterface } from "@/components/features/groups/GroupChatInterface";

export default function GroupsPage() {
    const { setActiveNavItem, setActiveChat } = useCustomerStore();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    useEffect(() => {
        setActiveNavItem('groups');
    }, [setActiveNavItem]);

    useEffect(() => {
        const groupId = searchParams.get('groupId');
        const groupName = searchParams.get('groupName');

        if (groupId && groupName) {
            setIsLoading(true);
            setSelectedGroupId(groupId);

            // Set active chat in store
            setActiveChat(groupId, 'group');

            // Simulate loading time for better UX
            const timer = setTimeout(() => {
                setIsLoading(false);
                // Turn off page transition loading
                useCustomerStore.getState().setPageTransitioning(false);
            }, 1000);

            return () => clearTimeout(timer);
        } else {
            setSelectedGroupId(null);
            setIsLoading(false);
        }
    }, [searchParams, setActiveChat]);

    // If loading, show loading state
    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-muted/50">
                <div className="text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Đang tải nhóm...</h3>
                    <p className="text-muted-foreground">
                        Vui lòng đợi trong giây lát
                    </p>
                </div>
            </div>
        );
    }

    // If group is selected, show group chat interface
    if (selectedGroupId) {
        const groupName = searchParams.get('groupName') || 'Unknown Group';
        return <GroupChatInterface
            groupId={selectedGroupId}
            groupName={groupName}
        />;
    }

    // Default state - no group selected
    return (
        <div className="h-full flex items-center justify-center bg-muted/50">
            <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Chọn một cuộc trò chuyện</h3>
                <p className="text-muted-foreground">
                    Bắt đầu nhắn tin với bạn bè của bạn
                </p>
            </div>
        </div>
    );
}
