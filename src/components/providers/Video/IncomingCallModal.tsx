"use client"

import { Phone, PhoneOff, User, AlertCircle, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface IncomingCallModalProps {
    isOpen: boolean
    onClose: () => void
    callerName: string
    callerAvatar?: string
    onAcceptCall: () => void
    onRejectCall: () => void
    // Thêm props mới để hiển thị trạng thái
    isConnecting?: boolean
    error?: string
    sessionId?: string
}

export default function IncomingCallModal({
    isOpen,
    onClose,
    callerName,
    callerAvatar,
    onAcceptCall,
    onRejectCall,
    isConnecting = false,
    error,
    sessionId
}: IncomingCallModalProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [callDuration, setCallDuration] = useState(0)
    const [isRinging, setIsRinging] = useState(true)

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true)
            setIsRinging(true)
            setCallDuration(0)

            // Auto close after 5 seconds if no one answers
            const autoCloseTimer = setTimeout(() => {
                handleRejectCall()
            }, 5000)

            return () => clearTimeout(autoCloseTimer)
        } else {
            setIsVisible(false)
            setIsRinging(false)
        }
    }, [isOpen])

    useEffect(() => {
        if (isOpen && isRinging) {
            const interval = setInterval(() => {
                setCallDuration(prev => prev + 1)
            }, 1000)

            return () => clearInterval(interval)
        }
    }, [isOpen, isRinging])

    const handleAcceptCall = () => {
        setIsRinging(false)
        onAcceptCall()
        onClose()
    }

    const handleRejectCall = () => {
        setIsRinging(false)
        onRejectCall()
        onClose()
    }

    // Tạo initials từ tên người dùng
    const getInitials = (name: string) => {
        if (!name) return "U"
        return name
            .split(" ")
            .map(word => word.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/80 backdrop-blur-md transition-all duration-500",
                    isVisible ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={cn(
                    "relative w-full max-w-md transform transition-all duration-700",
                    isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                )}
            >
                {/* Main Content */}
                <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-700/50">
                    {/* Ringing Animation */}
                    <div className="absolute inset-0 rounded-3xl overflow-hidden">
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20",
                            isRinging && "animate-pulse"
                        )} />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 text-center">
                        {/* Avatar - Centered */}
                        <div className="relative mx-auto mb-6 flex justify-center">
                            <div className={cn(
                                "w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white/20 shadow-xl",
                                isRinging && "animate-pulse"
                            )}>
                                {callerAvatar ? (
                                    <img
                                        src={callerAvatar}
                                        alt={callerName}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-2xl font-bold">
                                        {getInitials(callerName)}
                                    </span>
                                )}
                            </div>

                            {/* Ringing Indicator */}
                            {isRinging && (
                                <div className="absolute -inset-2 rounded-full border-2 border-green-400/50 animate-ping" />
                            )}
                        </div>

                        {/* Call Status */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Cuộc gọi đến
                            </h2>
                            <p className="text-slate-300 text-lg mb-1">
                                {callerName}
                            </p>
                            <p className="text-slate-400 text-sm">
                                Đang gọi cho bạn...
                            </p>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                                <div className="flex items-center gap-2 text-red-400">
                                    <AlertCircle className="w-5 h-5" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            </div>
                        )}

                        {/* Session ID Display */}
                        {sessionId && (
                            <div className="mb-6 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                                <p className="text-blue-400 text-xs">
                                    Session ID: {sessionId.slice(0, 8)}...
                                </p>
                            </div>
                        )}

                        {/* Call Duration */}
                        <div className="mb-8">
                            <div className="text-slate-400 text-sm">
                                Thời gian: {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center gap-6">
                            {/* Accept Button */}
                            <Button
                                onClick={handleAcceptCall}
                                size="lg"
                                disabled={isConnecting}
                                className="w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isConnecting ? (
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                ) : (
                                    <Phone className="w-8 h-8" />
                                )}
                            </Button>

                            {/* Reject Button */}
                            <Button
                                onClick={handleRejectCall}
                                size="lg"
                                variant="destructive"
                                disabled={isConnecting}
                                className="w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PhoneOff className="w-8 h-8" />
                            </Button>
                        </div>

                        {/* Ringing Text */}
                        {isRinging && !isConnecting && (
                            <div className="mt-6 text-center">
                                <div className="inline-flex items-center gap-2 text-green-400 text-sm">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    <span className="ml-2">Đang đổ chuông...</span>
                                </div>
                            </div>
                        )}

                        {/* Connecting Status */}
                        {isConnecting && (
                            <div className="mt-6 text-center">
                                <div className="inline-flex items-center gap-2 text-green-400 text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Đang kết nối cuộc gọi...</span>
                                </div>
                            </div>
                        )}

                        {/* Auto-reject Warning */}
                        <div className="mt-4 text-center">
                            <p className="text-slate-500 text-xs">
                                Tự động từ chối sau {5 - callDuration} giây
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
