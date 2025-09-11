import { useState, useCallback, useRef } from "react";

interface MentionUser {
    userId: string;
    fullName: string;
    avatarUrl?: string | null;
    presenceStatus?: string;
}

interface MentionState {
    isActive: boolean;
    searchTerm: string;
    position: { top: number; left: number };
    cursorPosition: number;
}

export function useMention() {
    const [mentionState, setMentionState] = useState<MentionState>({
        isActive: false,
        searchTerm: "",
        position: { top: 0, left: 0 },
        cursorPosition: 0,
    });

    const activateMention = useCallback((textarea: HTMLTextAreaElement) => {
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = textarea.value.substring(0, cursorPos);

        // Find the last @ symbol before cursor
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        if (lastAtIndex === -1) {
            return;
        }

        // Check if there's a space after @ (invalid mention)
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        if (textAfterAt.includes(" ")) {
            return;
        }

        // Get search term (text after @)
        const searchTerm = textAfterAt;

        // Calculate position for suggestions dropdown
        const textareaRect = textarea.getBoundingClientRect();

        setMentionState({
            isActive: true,
            searchTerm,
            position: {
                top: textareaRect.top - 135, // Position right above textarea
                left: textareaRect.left, // Align with textarea left
            },
            cursorPosition: lastAtIndex,
        });
    }, []);

    const deactivateMention = useCallback(() => {
        setMentionState({
            isActive: false,
            searchTerm: "",
            position: { top: 0, left: 0 },
            cursorPosition: 0,
        });
    }, []);

    const selectMention = useCallback((user: MentionUser, textarea: HTMLTextAreaElement, onTextChange?: (text: string) => void) => {
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = textarea.value.substring(0, cursorPos);
        const textAfterCursor = textarea.value.substring(cursorPos);

        // Find the last @ symbol
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        if (lastAtIndex === -1) {
            return;
        }

        // Replace @searchTerm with @fullName
        const textBeforeAt = textBeforeCursor.substring(0, lastAtIndex);
        const mentionText = `@${user.fullName}`;
        const newText = textBeforeAt + mentionText + textAfterCursor;

        // Update textarea value
        textarea.value = newText;

        // Set cursor position after the mention
        const newCursorPos = textBeforeAt.length + mentionText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);

        // Call the text change callback if provided
        if (onTextChange) {
            onTextChange(newText);
        }

        // Trigger input event for React
        const inputEvent = new Event("input", { bubbles: true });
        textarea.dispatchEvent(inputEvent);

        // Focus back to textarea
        textarea.focus();

        // Deactivate mention
        deactivateMention();
    }, [deactivateMention]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = e.currentTarget;

        if (e.key === "@") {
            // Small delay to let the @ character be inserted
            setTimeout(() => activateMention(textarea), 10);
        } else if (mentionState.isActive) {
            if (e.key === "Escape") {
                e.preventDefault();
                deactivateMention();
            } else if (e.key === " ") {
                // Space deactivates mention
                deactivateMention();
            }
        }
    }, [mentionState.isActive, activateMention, deactivateMention]);

    const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
        const textarea = e.currentTarget;

        if (mentionState.isActive) {
            // Update search term as user types
            const cursorPos = textarea.selectionStart;
            const textBeforeCursor = textarea.value.substring(0, cursorPos);
            const lastAtIndex = textBeforeCursor.lastIndexOf("@");

            if (lastAtIndex !== -1) {
                const searchTerm = textBeforeCursor.substring(lastAtIndex + 1);

                // Check if mention is still valid (no spaces)
                if (!searchTerm.includes(" ")) {
                    setMentionState(prev => ({
                        ...prev,
                        searchTerm,
                    }));
                } else {
                    deactivateMention();
                }
            } else {
                deactivateMention();
            }
        }
    }, [mentionState.isActive, deactivateMention]);

    return {
        mentionState,
        activateMention,
        deactivateMention,
        selectMention,
        handleKeyDown,
        handleInput,
    };
}
