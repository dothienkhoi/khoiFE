"use client"

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface LoadingScreenProps {
    isLoading: boolean
    onLoadingComplete?: () => void
}

export function LoadingScreen({ isLoading, onLoadingComplete }: LoadingScreenProps) {
    const [show, setShow] = useState(false)
    const [fadeOut, setFadeOut] = useState(false)

    useEffect(() => {
        if (isLoading) {
            setShow(true)
            setFadeOut(false)
        } else {
            setFadeOut(true)
            const timer = setTimeout(() => {
                setShow(false)
                onLoadingComplete?.()
            }, 300) // Fade out duration
            return () => clearTimeout(timer)
        }
    }, [isLoading, onLoadingComplete])

    if (!show) return null

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#ad46ff] via-[#8b5cf6] to-[#1447e6] transition-opacity duration-300",
                fadeOut && "opacity-0"
            )}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 text-center">
                {/* Logo */}
                <div className="mb-8">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-white/30 to-white/10 rounded-2xl flex items-center justify-center">
                            <span className="text-2xl">💬</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                        FastBite Chat
                    </h1>
                </div>

                {/* Animated Chicken Family */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {/* Gà trống chính */}
                    <div className="w-12 h-12 flex items-center justify-center animate-bounce">
                        <span className="text-2xl drop-shadow-lg">🐓</span>
                    </div>

                    {/* 5 con gà con */}
                    <div className="flex items-center gap-1">
                        <span className="text-lg drop-shadow-lg animate-bounce" style={{ animationDelay: '0.1s' }}>🐤</span>
                        <span className="text-lg drop-shadow-lg animate-bounce" style={{ animationDelay: '0.2s' }}>🐤</span>
                        <span className="text-lg drop-shadow-lg animate-bounce" style={{ animationDelay: '0.3s' }}>🐤</span>
                        <span className="text-lg drop-shadow-lg animate-bounce" style={{ animationDelay: '0.4s' }}>🐤</span>
                        <span className="text-lg drop-shadow-lg animate-bounce" style={{ animationDelay: '0.5s' }}>🐤</span>
                    </div>
                </div>

                {/* Loading Text */}
                <div className="space-y-2">
                    <p className="text-white/90 text-lg font-medium">Đang tải...</p>
                    <div className="flex items-center justify-center gap-1">
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-8 w-64 mx-auto">
                    <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-white/60 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-20 left-20 w-4 h-4 bg-white/20 rounded-full animate-ping"></div>
            <div className="absolute top-32 right-32 w-3 h-3 bg-white/30 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute bottom-32 left-32 w-2 h-2 bg-white/40 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-20 right-20 w-3 h-3 bg-white/25 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
        </div>
    )
}


