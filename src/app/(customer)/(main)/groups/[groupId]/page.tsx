"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCustomerStore } from "@/store/customerStore";
import { GroupChatInterface } from "@/components/features/groups/GroupChatInterface";
import { ChatGroup } from "@/types/customer.types";

export default function GroupChatPage() {
    const params = useParams();
    const router = useRouter();
    const { myGroups, setActiveNavItem } = useCustomerStore();
    const [currentGroup, setCurrentGroup] = useState<ChatGroup | null>(null);

    const groupId = params.groupId as string;

    useEffect(() => {
        setActiveNavItem('groups');

        console.log("Current groupId from params:", groupId);
        console.log("Available groups:", myGroups);

        // Find the group from myGroups
        const group = myGroups.find(g => g.id === groupId);
        console.log("Found group:", group);

        if (group) {
            setCurrentGroup(group);
        } else {
            // If group not found, redirect back to groups list
            console.warn("Group not found, redirecting to groups list");
            router.push('/groups');
        }
    }, [groupId, myGroups, setActiveNavItem, router]);

    // Show loading if group not found yet
    if (!currentGroup) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Đang tải nhóm...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full">
            <GroupChatInterface
                groupId={currentGroup.id}
                groupName={currentGroup.name}
                groupDescription={currentGroup.description}
                groupAvatar={currentGroup.avatarUrl}
                memberCount={currentGroup.memberCount}
            />
        </div>
    );
}


