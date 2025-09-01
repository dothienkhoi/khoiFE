"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollToTopProps {
    className?: string;
    scrollContainer?: string;
}

export function ScrollToTop({ className, scrollContainer = ".profile-scrollbar" }: ScrollToTopProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const container = document.querySelector(scrollContainer);
        if (!container) return;

        const handleScroll = () => {
            const scrollTop = container.scrollTop;
            setIsVisible(scrollTop > 300);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [scrollContainer]);

    const scrollToTop = () => {
        const container = document.querySelector(scrollContainer);
        if (container) {
            container.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    if (!isVisible) return null;

    return (
        <Button
            onClick={scrollToTop}
            size="icon"
            className={cn(
                "fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg transition-all duration-300",
                "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
                "text-white border-0 hover:scale-110 active:scale-95",
                "animate-in slide-in-from-bottom-2",
                className
            )}
            aria-label="Cuộn lên đầu"
        >
            <ChevronUp className="h-6 w-6" />
        </Button>
    );
}

