"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface IncomingCallDialogProps {
    isOpen: boolean;
    onClose: () => void;
    callerName: string;
    callerAvatar?: string;
    sessionId: string;
    onAccept?: () => void;
    onReject?: () => void;
}

export function IncomingCallDialog({
    isOpen,
    onClose,
    callerName,
    callerAvatar,
    sessionId,
    onAccept,
    onReject
}: IncomingCallDialogProps) {
    const [isRinging, setIsRinging] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callStatus, setCallStatus] = useState<'ringing' | 'connecting' | 'connected' | 'ended'>('ringing');

    // Auto-reject after 30 seconds if not answered
    useEffect(() => {
        if (isOpen && callStatus === 'ringing') {
            const timeout = setTimeout(() => {
                handleReject();
            }, 30000); // 30 seconds

            return () => clearTimeout(timeout);
        }
    }, [isOpen, callStatus]);

    const handleAccept = () => {
        setCallStatus('connecting');
        setIsRinging(false);
        onAccept?.();
        // Simulate connection delay
        setTimeout(() => {
            setCallStatus('connected');
        }, 2000);
    };

    const handleReject = () => {
        setCallStatus('ended');
        setIsRinging(false);
        onReject?.();
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
                    {/* Caller Info */}
                    <div className="text-center">
                        <Avatar className="h-24 w-24 mb-4 ring-4 ring-green-500/20">
                            <AvatarImage src={callerAvatar} />
                            <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-600 text-white text-2xl font-bold">
                                {callerName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>

                        <h3 className="text-xl font-semibold text-white mb-2">
                            {callerName}
                        </h3>

                        <div className="flex items-center justify-center space-x-2">
                            {isRinging && (
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            )}

                            <span className="text-gray-300 text-sm">
                                {callStatus === 'ringing' && 'Cuộc gọi đến'}
                                {callStatus === 'connecting' && 'Đang kết nối...'}
                                {callStatus === 'connected' && 'Đã kết nối'}
                                {callStatus === 'ended' && 'Cuộc gọi kết thúc'}
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

                        {/* Accept Call Button */}
                        <Button
                            variant="default"
                            size="icon"
                            className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600"
                            onClick={handleAccept}
                            disabled={callStatus !== 'ringing'}
                        >
                            <Phone className="h-6 w-6" />
                        </Button>

                        {/* Reject Call Button */}
                        <Button
                            variant="destructive"
                            size="icon"
                            className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600"
                            onClick={handleReject}
                            disabled={callStatus !== 'ringing'}
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
                        <div className="text-center space-y-2">
                            <p className="text-gray-400 text-sm">
                                Cuộc gọi video từ {callerName}
                            </p>
                            <p className="text-gray-500 text-xs">
                                Tự động từ chối sau 30 giây
                            </p>
                        </div>
                    )}

                    {callStatus === 'connecting' && (
                        <p className="text-gray-400 text-sm text-center">
                            Đang thiết lập cuộc gọi...
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
