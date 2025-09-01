"use client";

import { cn } from "@/lib/utils";

interface LoadingAnimationProps {
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function LoadingAnimation({ className, size = "md" }: LoadingAnimationProps) {
    const sizeClasses = {
        sm: "w-6 h-6",
        md: "w-8 h-8",
        lg: "w-12 h-12"
    };

    return (
        <div className={cn("flex items-center justify-center", className)}>
            <div className={cn("relative", sizeClasses[size])}>
                {/* Chicken Body */}
                <div className="absolute inset-0 bg-yellow-400 rounded-full animate-bounce">
                    {/* Chicken Head */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-300 rounded-full animate-pulse"></div>

                    {/* Beak */}
                    <div className="absolute -top-0.5 left-1 w-1 h-1 bg-orange-500 rounded-sm transform rotate-45"></div>

                    {/* Eyes */}
                    <div className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-black rounded-full animate-ping"></div>

                    {/* Wings */}
                    <div className="absolute -left-1 top-1 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
                    <div className="absolute -right-1 top-1 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>

                    {/* Feet */}
                    <div className="absolute -bottom-1 left-1 w-1 h-1 bg-orange-600 rounded-sm"></div>
                    <div className="absolute -bottom-1 right-1 w-1 h-1 bg-orange-600 rounded-sm"></div>
                </div>

                {/* Loading Dots */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-1">
                    <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );
}

// Alternative: More detailed chicken animation
export function ChickenLoadingAnimation({ className, size = "md" }: LoadingAnimationProps) {
    const sizeClasses = {
        sm: "w-10 h-10",
        md: "w-14 h-14",
        lg: "w-18 h-18"
    };

    return (
        <div className={cn("flex items-center justify-center", className)}>
            <div className={cn("relative", sizeClasses[size])}>
                {/* Chicken Body */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full animate-bounce">
                    {/* Chicken Head */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full animate-pulse">
                        {/* Beak */}
                        <div className="absolute -top-0.5 left-1.5 w-1 h-0.5 bg-orange-500 rounded-sm transform rotate-45"></div>

                        {/* Eyes */}
                        <div className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-black rounded-full animate-ping"></div>

                        {/* Comb */}
                        <div className="absolute -top-0.5 left-0.5 w-1.5 h-0.5 bg-red-500 rounded-full animate-pulse"></div>
                    </div>

                    {/* Wings */}
                    <div className="absolute -left-0.5 top-1 w-2 h-2 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full animate-pulse"></div>
                    <div className="absolute -right-0.5 top-1 w-2 h-2 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full animate-pulse"></div>

                    {/* Feet */}
                    <div className="absolute -bottom-0.5 left-1 w-1 h-0.5 bg-orange-600 rounded-sm transform rotate-45"></div>
                    <div className="absolute -bottom-0.5 right-1 w-1 h-0.5 bg-orange-600 rounded-sm transform -rotate-45"></div>
                </div>

                {/* Loading Text */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-purple-600 font-medium animate-pulse">
                    Đang tải...
                </div>
            </div>
        </div>
    );
}

// Simple bouncing dots for minimal design
export function BouncingDots({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center justify-center space-x-1", className)}>
            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
    );
}
