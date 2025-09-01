"use client";

import { useState, useEffect } from "react";
import { useCustomerStore } from "@/store/customerStore";
import { CreateGroupDialog } from "@/components/features/groups/CreateGroupDialog";
import { CommunitiesHeader, CommunitiesContent } from "@/components/features/groups/Communities";


export default function CommunitiesPage() {
    const {
        setActiveNavItem
    } = useCustomerStore();

    useEffect(() => {
        setActiveNavItem('communities');
    }, [setActiveNavItem]);

    return (
        <div className="flex h-full bg-gray-50 dark:bg-gray-900 communities-page-layout">
            {/* Header */}
            <CommunitiesHeader />

            {/* Content */}
            <CommunitiesContent />

            {/* Create Group Dialog */}
            <CreateGroupDialog />
        </div>
    );
}
