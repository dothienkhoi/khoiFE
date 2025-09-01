"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScrollIndicatorProps {
    className?: string;
    scrollContainer?: string;
    showPercentage?: boolean;
}

export function ScrollIndicator({
    className,
    scrollContainer = ".profile-scrollbar",
    showPercentage = true
}: ScrollIndicatorProps) {
    const [scrollInfo, setScrollInfo] = useState({
        scrollTop: 0,
        scrollHeight: 0,
        clientHeight: 0
    });

    useEffect(() => {
        const container = document.querySelector(scrollContainer);
        if (!container) return;

        const handleScroll = () => {
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;

            setScrollInfo({ scrollTop, scrollHeight, clientHeight });
        };

        container.addEventListener('scroll', handleScroll);
        // Initial call
        handleScroll();

        return () => container.removeEventListener('scroll', handleScroll);
    }, [scrollContainer]);

    const progress = scrollInfo.scrollHeight > scrollInfo.clientHeight
        ? (scrollInfo.scrollTop / (scrollInfo.scrollHeight - scrollInfo.clientHeight)) * 100
        : 0;

    if (scrollInfo.scrollHeight <= scrollInfo.clientHeight) return null;

    return (
        <div className={cn(
            "fixed bottom-6 left-6 z-40 transition-all duration-300",
            "animate-in slide-in-from-bottom-2",
            className
        )}>
            <Badge
                variant="secondary"
                className={cn(
                    "px-3 py-2 text-xs font-mono bg-background/80 backdrop-blur-sm",
                    "border border-border shadow-lg"
                )}
            >
                {showPercentage ? (
                    <span>
                        {Math.round(progress)}%
                    </span>
                ) : (
                    <span>
                        {Math.round(scrollInfo.scrollTop)} / {Math.round(scrollInfo.scrollHeight - scrollInfo.clientHeight)}
                    </span>
                )}
            </Badge>
        </div>
    );
}

