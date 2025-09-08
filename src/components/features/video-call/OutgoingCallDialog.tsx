"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface OutgoingCallDialogProps {
    isOpen: boolean;
    onClose: () => void;
    recipientName: string;
    recipientAvatar?: string;
    conversationId: number;
    isRinging?: boolean;
    isConnecting?: boolean;
    error?: string;
    onCallAccepted?: () => void;
    onCallRejected?: () => void;
    onCallEnded?: () => void;
}

export function OutgoingCallDialog({
    isOpen,
    onClose,
    recipientName,
    recipientAvatar,
    conversationId,
    isRinging: externalIsRinging = true,
    isConnecting: externalIsConnecting = false,
    error: externalError,
    onCallAccepted,
    onCallRejected,
    onCallEnded
}: OutgoingCallDialogProps) {
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    // Determine call status based on external props
    const callStatus = externalError ? 'ended' :
        externalIsConnecting ? 'connecting' :
            externalIsRinging ? 'ringing' : 'connected';

    // Timer for call duration
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (callStatus === 'connected') {
            interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [callStatus]);

    // Format call duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleEndCall = () => {
        onCallEnded?.();
        setTimeout(() => {
            onClose();
        }, 1000);
    };

    const handleCallAccepted = () => {
        onCallAccepted?.();
    };

    const handleCallRejected = () => {
        onCallRejected?.();
        setTimeout(() => {
            onClose();
        }, 1000);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const toggleVideo = () => {
        setIsVideoOff(!isVideoOff);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-gray-900 text-white border-gray-700">
                <div className="flex flex-col items-center space-y-6 p-6">
                    {/* Recipient Info */}
                    <div className="text-center">
                        <Avatar className="h-24 w-24 mb-4 ring-4 ring-purple-500/20">
                            <AvatarImage src={recipientAvatar} />
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-600 text-white text-2xl font-bold">
                                {recipientName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>

                        <h3 className="text-xl font-semibold text-white mb-2">
                            {recipientName}
                        </h3>

                        <div className="flex items-center justify-center space-x-2">
                            {externalIsRinging && (
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            )}

                            <span className="text-gray-300 text-sm">
                                {callStatus === 'ringing' && 'Đang gọi...'}
                                {callStatus === 'connecting' && 'Đang kết nối...'}
                                {callStatus === 'connected' && formatDuration(callDuration)}
                                {callStatus === 'ended' && (externalError || 'Cuộc gọi kết thúc')}
                            </span>
                        </div>
                    </div>

                    {/* Call Controls */}
                    <div className="flex items-center space-x-4">
                        {/* Mute Button */}
                        <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                                "h-12 w-12 rounded-full border-gray-600 hover:bg-gray-800",
                                isMuted && "bg-red-500 border-red-500 hover:bg-red-600"
                            )}
                            onClick={toggleMute}
                        >
                            {isMuted ? (
                                <MicOff className="h-5 w-5 text-white" />
                            ) : (
                                <Mic className="h-5 w-5 text-white" />
                            )}
                        </Button>

                        {/* End Call Button */}
                        <Button
                            variant="destructive"
                            size="icon"
                            className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600"
                            onClick={handleEndCall}
                        >
                            <PhoneOff className="h-6 w-6" />
                        </Button>

                        {/* Video Button */}
                        <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                                "h-12 w-12 rounded-full border-gray-600 hover:bg-gray-800",
                                isVideoOff && "bg-red-500 border-red-500 hover:bg-red-600"
                            )}
                            onClick={toggleVideo}
                        >
                            {isVideoOff ? (
                                <VideoOff className="h-5 w-5 text-white" />
                            ) : (
                                <Video className="h-5 w-5 text-white" />
                            )}
                        </Button>
                    </div>

                    {/* Call Status Messages */}
                    {callStatus === 'ringing' && (
                        <p className="text-gray-400 text-sm text-center">
                            Đang chờ người dùng trả lời...
                        </p>
                    )}

                    {callStatus === 'ended' && (
                        <p className="text-gray-400 text-sm text-center">
                            Cuộc gọi đã kết thúc
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
