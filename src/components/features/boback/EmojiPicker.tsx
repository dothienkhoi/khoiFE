"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onEmojiSelect: (emoji: string) => void;
    disabled?: boolean;
}

const EMOJI_CATEGORIES = [
    {
        name: "Cảm xúc",
        emojis: [
            '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
            '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
            '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
            '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏'
        ]
    },
    {
        name: "Tâm trạng",
        emojis: [
            '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
            '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
            '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
            '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥'
        ]
    },
    {
        name: "Biểu cảm",
        emojis: [
            '😶', '😐', '😑', '😯', '😦', '😧', '😮', '😲',
            '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢',
            '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '💩',
            '👻', '💀', '☠️', '👽', '👾', '🤖', '😺', '😸'
        ]
    },
    {
        name: "Biểu tượng",
        emojis: [
            '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈',
            '🙉', '🙊', '💌', '💘', '💝', '💖', '💗', '💙',
            '💚', '❤️', '🧡', '💛', '💜', '🖤', '💯', '💢',
            '💥', '💫', '💦', '💨', '🕳️', '💬', '🗨️', '🗯️'
        ]
    }
];

export function EmojiPicker({ isOpen, onClose, onEmojiSelect, disabled = false }: EmojiPickerProps) {
    const [selectedCategory, setSelectedCategory] = useState(0);

    if (!isOpen) return null;

    const handleEmojiClick = (emoji: string) => {
        onEmojiSelect(emoji);
        onClose();
    };

    return (
        <div className="absolute bottom-full left-0 mb-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 min-w-[320px] max-w-[400px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Chọn emoji</h3>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    onClick={onClose}
                    disabled={disabled}
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 mb-4">
                {EMOJI_CATEGORIES.map((category, index) => (
                    <Button
                        key={category.name}
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "flex-1 text-xs font-medium rounded-lg transition-all duration-200",
                            selectedCategory === index
                                ? "bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white shadow-md"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                        onClick={() => setSelectedCategory(index)}
                        disabled={disabled}
                    >
                        {category.name}
                    </Button>
                ))}
            </div>

            {/* Emoji Grid */}
            <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto scrollbar-hide">
                {EMOJI_CATEGORIES[selectedCategory].emojis.map((emoji, index) => (
                    <Button
                        key={`${selectedCategory}-${index}`}
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 p-0 text-lg hover:bg-gradient-to-r hover:from-[#ad46ff]/10 hover:to-[#1447e6]/10 hover:scale-110 transition-all duration-200 rounded-xl"
                        onClick={() => handleEmojiClick(emoji)}
                        disabled={disabled}
                        title={emoji}
                    >
                        {emoji}
                    </Button>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Chọn emoji để thêm vào tin nhắn
                </p>
            </div>
        </div>
    );
}
