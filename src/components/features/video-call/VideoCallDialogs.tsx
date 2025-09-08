"use client";

import { useVideoCallContext } from "@/contexts/VideoCallContext";
import { OutgoingCallDialog } from "./OutgoingCallDialog";
import { IncomingCallDialog } from "./IncomingCallDialog";

export function VideoCallDialogs() {
    const {
        isOutgoingCallOpen,
        isIncomingCallOpen,
        recipientName,
        recipientAvatar,
        callerName,
        callerAvatar,
        conversationId,
        sessionId,
        isRinging,
        isConnecting,
        error,
        startOutgoingCall,
        startIncomingCall,
        cancelCall,
        acceptCall,
        rejectCall,
        closeModals
    } = useVideoCallContext();

    const handleOutgoingCallAccepted = () => {
        // Handle when outgoing call is accepted
        console.log("Outgoing call accepted");
    };

    const handleOutgoingCallRejected = () => {
        // Handle when outgoing call is rejected
        console.log("Outgoing call rejected");
        cancelCall();
    };

    const handleOutgoingCallEnded = () => {
        // Handle when outgoing call ends
        console.log("Outgoing call ended");
        cancelCall();
    };

    const handleIncomingCallAccepted = () => {
        // Handle when incoming call is accepted
        console.log("Incoming call accepted");
        acceptCall();
    };

    const handleIncomingCallRejected = () => {
        // Handle when incoming call is rejected
        console.log("Incoming call rejected");
        rejectCall();
    };

    return (
        <>
            {/* Outgoing Call Dialog */}
            <OutgoingCallDialog
                isOpen={isOutgoingCallOpen}
                onClose={closeModals}
                recipientName={recipientName}
                recipientAvatar={recipientAvatar}
                conversationId={conversationId || 0}
                isRinging={isRinging}
                isConnecting={isConnecting}
                error={error}
                onCallAccepted={handleOutgoingCallAccepted}
                onCallRejected={handleOutgoingCallRejected}
                onCallEnded={handleOutgoingCallEnded}
            />

            {/* Incoming Call Dialog */}
            <IncomingCallDialog
                isOpen={isIncomingCallOpen}
                onClose={closeModals}
                callerName={callerName}
                callerAvatar={callerAvatar}
                sessionId={sessionId || ""}
                onAccept={handleIncomingCallAccepted}
                onReject={handleIncomingCallRejected}
            />
        </>
    );
}
