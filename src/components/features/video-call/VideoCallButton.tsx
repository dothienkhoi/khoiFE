"use client";

import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { useVideoCallContext } from "@/contexts/VideoCallContext";
import { useAuthStore } from "@/store/authStore";

interface VideoCallButtonProps {
    recipientName: string;
    recipientAvatar?: string;
    conversationId: number;
    className?: string;
}

export function VideoCallButton({
    recipientName,
    recipientAvatar,
    conversationId,
    className
}: VideoCallButtonProps) {
    const { startOutgoingCall } = useVideoCallContext();
    const { user } = useAuthStore();

    const handleStartVideoCall = () => {
        if (!user) {
            console.error("User not authenticated");
            return;
        }

        // Start outgoing video call
        startOutgoingCall(recipientName, conversationId, recipientAvatar);
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className={className}
            onClick={handleStartVideoCall}
            title="Bắt đầu cuộc gọi video"
        >
            <Video className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </Button>
    );
}
