"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ScrollProgressBarProps {
    className?: string;
    scrollContainer?: string;
    height?: number;
}

export function ScrollProgressBar({
    className,
    scrollContainer = ".profile-scrollbar",
    height = 3
}: ScrollProgressBarProps) {
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const container = document.querySelector(scrollContainer);
        if (!container) return;

        const handleScroll = () => {
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;

            const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
            setScrollProgress(Math.min(100, Math.max(0, progress)));
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [scrollContainer]);

    return (
        <div
            className={cn(
                "fixed top-0 left-0 w-full z-50 transition-all duration-300",
                className
            )}
            style={{ height: `${height}px` }}
        >
            <div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 transition-all duration-300 ease-out"
                style={{
                    width: `${scrollProgress}%`,
                    boxShadow: scrollProgress > 0 ? '0 0 10px rgba(139, 92, 246, 0.5)' : 'none'
                }}
            />
        </div>
    );
}

