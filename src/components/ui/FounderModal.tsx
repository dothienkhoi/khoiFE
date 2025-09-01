import { X, Phone, GraduationCap, User, Mail, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

interface Founder {
    name: string;
    icon: React.ReactNode;
    color: string;
    studentId: string;
    phone: string;
    major: string;
    email: string;
}

interface FounderModalProps {
    isOpen: boolean;
    founder: Founder | null;
    onClose: () => void;
}

export default function FounderModal({ isOpen, founder, onClose }: FounderModalProps) {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [animationKey, setAnimationKey] = useState(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            // Reset animation key to trigger re-animation
            setAnimationKey(prev => prev + 1);
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                setIsVisible(true);
            }, 50);
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    if (!isOpen || !founder || !mounted) return null;

    // Determine if we're in dark mode
    const isDark = resolvedTheme === 'dark';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" key={animationKey}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 backdrop-blur-md transition-all duration-500 ${isDark ? 'bg-black/80' : 'bg-black/60'
                    } ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div
                className={`relative backdrop-blur-xl border rounded-3xl p-8 max-w-2xl w-full transform transition-all duration-700 shadow-2xl ${isDark
                    ? 'bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-800/95 border-white/20'
                    : 'bg-gradient-to-br from-indigo-900/95 via-purple-900/95 to-cyan-900/95 border-white/20'
                    } ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
            >
                <div className="absolute top-6 right-6">
                    <button
                        onClick={onClose}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 group shadow-lg ${isDark
                            ? 'bg-white/10 hover:bg-white/20'
                            : 'bg-white/10 hover:bg-white/20'
                            }`}
                    >
                        <X className={`h-5 w-5 group-hover:rotate-90 transition-transform duration-300 ${isDark ? 'text-white' : 'text-white'
                            }`} />
                    </button>
                </div>

                <div className="text-center">
                    {/* Avatar */}
                    <div
                        className={`w-32 h-32 bg-gradient-to-br ${founder.color} rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                            }`}
                    >
                        {founder.icon}
                    </div>

                    {/* Name */}
                    <h3
                        className={`text-3xl font-bold mb-4 bg-clip-text text-transparent transition-all duration-700 delay-300 ${isDark
                            ? 'bg-gradient-to-r from-cyan-400 to-purple-400'
                            : 'bg-gradient-to-r from-cyan-400 to-purple-400'
                            } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                    >
                        {founder.name}
                    </h3>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        <div
                            className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 shadow-lg hover:shadow-xl transform hover:scale-105 delay-400 ${isDark
                                ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                                : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                } ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                        >
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <User className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-left">
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-300'}`}>Mã sinh viên</p>
                                <p className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-white'}`}>{founder.studentId}</p>
                            </div>
                        </div>

                        <div
                            className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 shadow-lg hover:shadow-xl transform hover:scale-105 delay-500 ${isDark
                                ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                                : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                } ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
                        >
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-left">
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-300'}`}>Chuyên ngành</p>
                                <p className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-white'}`}>{founder.major}</p>
                            </div>
                        </div>

                        <div
                            className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 shadow-lg hover:shadow-xl transform hover:scale-105 delay-600 ${isDark
                                ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                                : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                } ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                        >
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Phone className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-left">
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-300'}`}>Số điện thoại</p>
                                <p className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-white'}`}>{founder.phone}</p>
                            </div>
                        </div>

                        <div
                            className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 shadow-lg hover:shadow-xl transform hover:scale-105 delay-700 ${isDark
                                ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                                : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                } ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
                        >
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Mail className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-left">
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-300'}`}>Email</p>
                                <p className={`font-semibold text-lg break-all ${isDark ? 'text-white' : 'text-white'}`}>{founder.email}</p>
                            </div>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
}
