"use client"

import { Phone, PhoneOff, User, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface OutgoingCallModalProps {
    isOpen: boolean
    onClose: () => void
    recipientName: string
    recipientAvatar?: string
    onCancelCall: () => void
    // Thêm props mới để hiển thị trạng thái
    isConnecting?: boolean
    error?: string
    sessionId?: string
    onRetry?: () => void
}

export default function OutgoingCallModal({
    isOpen,
    onClose,
    recipientName,
    recipientAvatar,
    onCancelCall,
    isConnecting = false,
    error,
    sessionId,
    onRetry
}: OutgoingCallModalProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [callDuration, setCallDuration] = useState(0)
    const [isRinging, setIsRinging] = useState(true)

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true)
            setIsRinging(true)
            setCallDuration(0)

            // Auto close after 5 seconds if no one answers (chỉ khi không có lỗi)
            if (!error) {
                const autoCloseTimer = setTimeout(() => {
                    handleCancelCall()
                }, 5000)

                return () => clearTimeout(autoCloseTimer)
            }
        } else {
            setIsVisible(false)
            setIsRinging(false)
        }
    }, [isOpen, error])

    useEffect(() => {
        if (isOpen && isRinging && !error) {
            const interval = setInterval(() => {
                setCallDuration(prev => prev + 1)
            }, 1000)

            return () => clearInterval(interval)
        }
    }, [isOpen, isRinging, error])

    const handleCancelCall = () => {
        setIsRinging(false)
        onCancelCall()
        onClose()
    }

    const handleRetry = () => {
        if (onRetry) {
            onRetry()
        }
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
                            "absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20",
                            isRinging && !error && "animate-pulse"
                        )} />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 text-center">
                        {/* Avatar - Centered */}
                        <div className="relative mx-auto mb-6 flex justify-center">
                            <div className={cn(
                                "w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white/20 shadow-xl",
                                isRinging && !error && "animate-pulse"
                            )}>
                                {recipientAvatar ? (
                                    <img
                                        src={recipientAvatar}
                                        alt={recipientName}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-2xl font-bold">
                                        {getInitials(recipientName)}
                                    </span>
                                )}
                            </div>

                            {/* Ringing Indicator */}
                            {isRinging && !error && (
                                <div className="absolute -inset-2 rounded-full border-2 border-blue-400/50 animate-ping" />
                            )}
                        </div>

                        {/* Call Status */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                {error ? "Lỗi kết nối" : (isConnecting ? "Đang kết nối..." : "Đang gọi...")}
                            </h2>
                            <p className="text-slate-300 text-lg mb-1">
                                {recipientName}
                            </p>
                            <p className="text-slate-400 text-sm">
                                {error ? "Không thể thiết lập cuộc gọi" : (isConnecting ? "Đang tạo phòng video..." : "Đang kết nối...")}
                            </p>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                                <div className="flex items-center gap-2 text-red-400 mb-3">
                                    <AlertCircle className="w-5 h-5" />
                                    <span className="text-sm font-semibold">Lỗi kết nối</span>
                                </div>
                                <p className="text-red-300 text-sm mb-3">
                                    {error.includes('401') ? 'Vui lòng đăng nhập lại để thực hiện cuộc gọi' : error}
                                </p>

                                {/* Retry Button */}
                                {onRetry && (
                                    <Button
                                        onClick={handleRetry}
                                        size="sm"
                                        variant="outline"
                                        className="w-full bg-red-500/20 border-red-400 text-red-300 hover:bg-red-500/30"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Thử lại
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Session ID Display */}
                        {sessionId && !error && (
                            <div className="mb-6 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                                <p className="text-blue-400 text-xs">
                                    Session ID: {sessionId.slice(0, 8)}...
                                </p>
                            </div>
                        )}

                        {/* Call Duration - chỉ hiển thị khi không có lỗi */}
                        {!error && (
                            <div className="mb-8">
                                <div className="text-slate-400 text-sm">
                                    Thời gian: {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-center">
                            <Button
                                onClick={handleCancelCall}
                                size="lg"
                                variant="destructive"
                                disabled={isConnecting}
                                className="w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isConnecting ? (
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                ) : (
                                    <PhoneOff className="w-8 h-8" />
                                )}
                            </Button>
                        </div>

                        {/* Ringing Text - chỉ hiển thị khi không có lỗi */}
                        {isRinging && !isConnecting && !error && (
                            <div className="mt-6 text-center">
                                <div className="inline-flex items-center gap-2 text-blue-400 text-sm">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    <span className="ml-2">Đang đổ chuông...</span>
                                </div>
                            </div>
                        )}

                        {/* Connecting Status */}
                        {isConnecting && !error && (
                            <div className="mt-6 text-center">
                                <div className="inline-flex items-center gap-2 text-blue-400 text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Đang thiết lập cuộc gọi...</span>
                                </div>
                            </div>
                        )}

                        {/* Error Status */}
                        {error && (
                            <div className="mt-6 text-center">
                                <div className="inline-flex items-center gap-2 text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Cuộc gọi không thể thiết lập</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
