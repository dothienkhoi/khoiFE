"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeScreenProps {
    userName?: string;
    onNewChat?: () => void;
    type?: 'chat' | 'group';
}

export function WelcomeScreen({
    userName = "Người dùng",
    onNewChat,
    type = 'chat'
}: WelcomeScreenProps) {
    const [isHovered, setIsHovered] = useState<boolean>(false);

    return (
        <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(173,70,255,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(173,70,255,0.05),transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(20,71,230,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_20%,rgba(20,71,230,0.05),transparent_50%)]"></div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 relative z-10">
                {/* Welcome Header */}
                <div className="text-center mb-12 animate-fade-in">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-[#ad46ff] to-[#1447e6] dark:from-[#ad46ff] dark:to-cyan-400 bg-clip-text text-transparent leading-tight py-2">
                        Chào mừng, {userName}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md font-light leading-relaxed">
                        Đây là những điều bạn có thể làm để bắt đầu.
                    </p>
                </div>

                {/* Single Action Card */}
                <div className="flex justify-center max-w-2xl w-full">
                    {/* New Chat Card */}
                    <div
                        className={cn(
                            "group relative p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl",
                            isHovered && "shadow-[#ad46ff]/20 dark:shadow-cyan-400/20 border-[#ad46ff]/50 dark:border-cyan-400/50"
                        )}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className={cn(
                                "relative w-24 h-24 rounded-full bg-gradient-to-br from-[#ad46ff]/20 to-[#1447e6]/20 dark:from-[#ad46ff]/10 dark:to-cyan-400/10 flex items-center justify-center transition-all duration-500",
                                isHovered && "scale-110 shadow-lg shadow-[#ad46ff]/30 dark:shadow-cyan-400/30"
                            )}>
                                {type === 'group' ? (
                                    <Users className="w-12 h-12 text-[#ad46ff] dark:text-cyan-400" />
                                ) : (
                                    <MessageCircle className="w-12 h-12 text-[#ad46ff] dark:text-cyan-400" />
                                )}
                                {/* Floating elements inside chat bubble */}
                                <div className="absolute inset-0 flex items-center justify-center">

                                    <div className="w-6 h-6 rounded-full bg-blue-400/60 dark:bg-blue-400/40 animate-pulse delay-100 absolute -top-2 -right-2"></div>
                                    <div className="w-4 h-4 rounded-full bg-green-400/60 dark:bg-green-400/40 animate-pulse delay-200 absolute -bottom-1 -left-1"></div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="text-center">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                {type === 'group' ? 'Trò chuyện nhóm' : 'Trò chuyện mới'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                                {type === 'group'
                                    ? 'Tạo nhóm để kết nối và chia sẻ với nhiều người cùng lúc.'
                                    : 'Gửi tin nhắn tức thì, chia sẻ tệp tin và nhiều hơn nữa qua tin nhắn.'
                                }
                            </p>
                            <p className="text-[#ad46ff] dark:text-cyan-400 font-medium transition-all duration-300 hover:scale-105 cursor-pointer inline-block">
                                {type === 'group'
                                    ? 'Hãy tạo một nhóm để bắt đầu một cuộc trò chuyện mới'
                                    : 'Hãy thêm bạn bè để bắt đầu một cuộc trò chuyện mới'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// CSS animations
const styles = `
@keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
    animation: fade-in 0.8s ease-out;
}
`;

// Add styles to document
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}
