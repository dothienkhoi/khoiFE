"use client";

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import { Button } from './button';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    List,
    ListOrdered,
    Quote,
    Code,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Undo,
    Redo
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

const MenuBar = ({ editor, disabled }: { editor: any; disabled?: boolean }) => {
    if (!editor) {
        return null;
    }





    return (
        <div className="flex flex-col border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-t-lg">
            {/* Text Formatting Row */}
            <div className="flex items-center gap-1 p-2">
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        disabled={!editor.can().chain().focus().toggleBold().run() || disabled}
                        className={cn(
                            "h-8 w-8 p-0 transition-all duration-200",
                            editor.isActive('bold') && "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                        )}
                        title="Bold (Ctrl+B)"
                    >
                        <Bold className="h-4 w-4" />
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        disabled={!editor.can().chain().focus().toggleItalic().run() || disabled}
                        className={cn(
                            "h-8 w-8 p-0 transition-all duration-200",
                            editor.isActive('italic') && "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                        )}
                        title="Italic (Ctrl+I)"
                    >
                        <Italic className="h-4 w-4" />
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        disabled={!editor.can().chain().focus().toggleUnderline().run() || disabled}
                        className={cn(
                            "h-8 w-8 p-0 transition-all duration-200",
                            editor.isActive('underline') && "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                        )}
                        title="Underline (Ctrl+U)"
                    >
                        <UnderlineIcon className="h-4 w-4" />
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        disabled={!editor.can().chain().focus().toggleStrike().run() || disabled}
                        className={cn(
                            "h-8 w-8 p-0 transition-all duration-200",
                            editor.isActive('strike') && "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                        )}
                        title="Strikethrough"
                    >
                        <Strikethrough className="h-4 w-4" />
                    </Button>
                </div>


            </div>

            {/* Structure & Alignment Row */}
            <div className="flex items-center gap-1 p-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        disabled={!editor.can().chain().focus().toggleBulletList().run() || disabled}
                        className={cn(
                            "h-8 w-8 p-0 transition-all duration-200",
                            editor.isActive('bulletList') && "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                        )}
                        title="Bullet List"
                    >
                        <List className="h-4 w-4" />
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        disabled={!editor.can().chain().focus().toggleOrderedList().run() || disabled}
                        className={cn(
                            "h-8 w-8 p-0 transition-all duration-200",
                            editor.isActive('orderedList') && "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                        )}
                        title="Numbered List"
                    >
                        <ListOrdered className="h-4 w-4" />
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        disabled={!editor.can().chain().focus().toggleBlockquote().run() || disabled}
                        className={cn(
                            "h-8 w-8 p-0 transition-all duration-200",
                            editor.isActive('blockquote') && "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                        )}
                        title="Quote"
                    >
                        <Quote className="h-4 w-4" />
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        disabled={!editor.can().chain().focus().toggleCodeBlock().run() || disabled}
                        className={cn(
                            "h-8 w-8 p-0 transition-all duration-200",
                            editor.isActive('codeBlock') && "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                        )}
                        title="Code Block"
                    >
                        <Code className="h-4 w-4" />
                    </Button>
                </div>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        disabled={disabled}
                        className={cn(
                            "h-8 w-8 p-0 transition-all duration-200",
                            editor.isActive({ textAlign: 'left' }) && "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                        )}
                        title="Align Left"
                    >
                        <AlignLeft className="h-4 w-4" />
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        disabled={disabled}
                        className={cn(
                            "h-8 w-8 p-0 transition-all duration-200",
                            editor.isActive({ textAlign: 'center' }) && "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                        )}
                        title="Align Center"
                    >
                        <AlignCenter className="h-4 w-4" />
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        disabled={disabled}
                        className={cn(
                            "h-8 w-8 p-0 transition-all duration-200",
                            editor.isActive({ textAlign: 'right' }) && "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                        )}
                        title="Align Right"
                    >
                        <AlignRight className="h-4 w-4" />
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                        disabled={disabled}
                        className={cn(
                            "h-8 w-8 p-0 transition-all duration-200",
                            editor.isActive({ textAlign: 'justify' }) && "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                        )}
                        title="Justify"
                    >
                        <AlignJustify className="h-4 w-4" />
                    </Button>
                </div>



                <div className="flex-1" />

                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().chain().focus().undo().run() || disabled}
                        className="h-8 w-8 p-0 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo className="h-4 w-4" />
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().chain().focus().redo().run() || disabled}
                        className="h-8 w-8 p-0 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export function RichTextEditor({
    content,
    onChange,
    placeholder = "Start writing...",
    disabled = false,
    className
}: RichTextEditorProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 dark:text-blue-400 underline cursor-pointer hover:text-blue-800 dark:hover:text-blue-300',
                },
            }),
            Placeholder.configure({
                placeholder,
                emptyEditorClass: 'is-editor-empty',
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Underline,
            Strike,

        ],
        content,
        editable: !disabled,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
            },
        },
    });

    if (!mounted) {
        return (
            <div className={cn("border-2 border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden shadow-sm", className)}>
                <div className="p-4 bg-white dark:bg-gray-900 min-h-[140px] flex items-center justify-center">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span>Đang tải trình soạn thảo...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("border-2 border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200", className)}>
            <MenuBar editor={editor} disabled={disabled} />
            <div className="p-4 bg-white dark:bg-gray-900 min-h-[140px] focus-within:bg-gray-50 dark:focus-within:bg-gray-800/50 transition-colors duration-200">
                <EditorContent
                    editor={editor}
                    className="prose prose-sm dark:prose-invert max-w-none focus:outline-none"
                />
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                    .ProseMirror {
                        outline: none;
                        min-height: 120px;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }
                    
                    .ProseMirror p.is-editor-empty:first-child::before {
                        color: #adb5bd;
                        content: attr(data-placeholder);
                        float: left;
                        height: 0;
                        pointer-events: none;
                        font-style: italic;
                    }
                    
                    .ProseMirror p {
                        margin: 0.5em 0;
                        line-height: 1.6;
                    }
                    
                    .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6 {
                        margin: 1em 0 0.5em 0;
                        font-weight: 600;
                        line-height: 1.3;
                    }
                    
                    .ProseMirror ul,
                    .ProseMirror ol {
                        padding: 0 1em;
                        margin: 0.5em 0;
                    }
                    
                    .ProseMirror li {
                        margin: 0.25em 0;
                    }
                    
                    .ProseMirror blockquote {
                        border-left: 4px solid #e5e7eb;
                        margin: 1em 0;
                        padding: 0.5em 1em;
                        color: #6b7280;
                        background: #f9fafb;
                        border-radius: 0 0.375rem 0.375rem 0;
                    }
                    
                    .ProseMirror pre {
                        background: #f3f4f6;
                        border-radius: 0.5rem;
                        padding: 1rem;
                        margin: 1em 0;
                        overflow-x: auto;
                        border: 1px solid #e5e7eb;
                    }
                    
                    .ProseMirror code {
                        background: #f3f4f6;
                        padding: 0.2em 0.4em;
                        border-radius: 0.25rem;
                        font-size: 0.875em;
                        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
                    }
                    
                    .ProseMirror pre code {
                        background: transparent;
                        padding: 0;
                        border-radius: 0;
                    }
                    
                    .dark .ProseMirror blockquote {
                        border-left-color: #4b5563;
                        color: #9ca3af;
                        background: #1f2937;
                    }
                    
                    .dark .ProseMirror pre {
                        background: #374151;
                        border-color: #4b5563;
                    }
                    
                    .dark .ProseMirror code {
                        background: #374151;
                    }
                    
                    .ProseMirror:focus {
                        outline: none;
                    }
                    
                    .ProseMirror .is-editor-empty:first-child::before {
                        color: #adb5bd;
                        content: attr(data-placeholder);
                        float: left;
                        height: 0;
                        pointer-events: none;
                    }
                `
            }} />
        </div>
    );
}
