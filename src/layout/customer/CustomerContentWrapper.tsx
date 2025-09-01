"use client";

import { useCustomerStore } from "@/store/customerStore";
import { GroupChatInterface } from "@/components/features/groups/GroupChatInterface";
import { ChatGroup } from "@/types/customer.types";
import { usePathname } from "next/navigation";

interface CustomerContentWrapperProps {
    children: React.ReactNode;
}

export function CustomerContentWrapper({ children }: CustomerContentWrapperProps) {
    const { activeChatId, activeChatType, myGroups } = useCustomerStore();
    const pathname = usePathname();

    // Don't show group chat interface on discover or profile pages
    if (pathname === '/discover' || pathname === '/profile') {
        return <>{children}</>;
    }

    // If we have an active group chat and we're on the groups page, show the group chat interface
    if (activeChatId && activeChatType === 'group' && pathname === '/groups') {
        const currentGroup = myGroups.find(g => g.id === activeChatId);

        if (currentGroup) {
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
        } else {
            // If group not found, clear the active chat and show children
            useCustomerStore.getState().clearActiveChat();
        }
    }

    // Otherwise, show the normal page content
    return <>{children}</>;
}
