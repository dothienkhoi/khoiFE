"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
    Image,
    FileText,
    Send,
    Heart,
    MessageCircle,
    MoreHorizontal,
    RefreshCw,
    Loader2,
    X
} from "lucide-react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/utils";
import { getGroupPosts, createGroupPost, togglePostLike, getPostDetail, addPostComment } from "@/lib/customer-api-client";

interface Comment {
    commentId: number;
    content: string;
    author: {
        userId: string;
        fullName: string;
        avatarUrl?: string;
    };
    createdAt: string;
    parentCommentId?: number | null;
    replies: Comment[];
}

interface Post {
    id: string;
    postId: number;
    title: string;
    content: string;
    contentMarkdown: string;
    author: {
        id: string;
        userId: string;
        name: string;
        fullName: string;
        displayName?: string;
        avatarUrl?: string;
    };
    createdAt: string;
    likeCount: number;
    commentCount: number;
    shareCount?: number;
    isLiked?: boolean;
    isLikedByCurrentUser?: boolean;
    isBookmarked?: boolean;
    images?: string[];
    attachments?: Array<{
        id: string;
        name: string;
        type: string;
        size: number;
        url: string;
    }>;
    comments?: Comment[];
}

interface CommunityPostsInterfaceProps {
    groupId: string;
    groupName: string;
    groupAvatar?: string;
}

export function CommunityPostsInterface({ groupId, groupName, groupAvatar }: CommunityPostsInterfaceProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPostTitle, setNewPostTitle] = useState("");
    const [newPostContent, setNewPostContent] = useState("");
    const [isCreatingPost, setIsCreatingPost] = useState(false);
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMorePosts, setHasMorePosts] = useState(false);
    const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
    const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
    const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
    const [newComment, setNewComment] = useState<Record<string, string>>({});
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailPost, setDetailPost] = useState<any>(null);
    const [detailCommentsTree, setDetailCommentsTree] = useState<any[]>([]);
    const [detailNewComment, setDetailNewComment] = useState("");
    const [replyTextMap, setReplyTextMap] = useState<Record<number, string>>({});
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [editingContent, setEditingContent] = useState("");
    const [deletingPost, setDeletingPost] = useState<Post | null>(null);

    const openPostDetail = async (post: Post) => {
        try {
            setDetailOpen(true);
            setDetailLoading(true);
            setDetailPost(null);
            const res = await getPostDetail(post.postId.toString());
            if (res.success && res.data) {
                setDetailPost(res.data);
                setDetailCommentsTree(buildCommentTree(res.data.comments || []));
            } else {
                toast.error(res.message || "Không thể tải chi tiết bài viết");
            }
        } catch (error: any) {
            handleApiError(error, "Không thể tải chi tiết bài viết");
        } finally {
            setDetailLoading(false);
        }
    };

    const refreshPostDetail = async () => {
        if (!detailPost) return;
        try {
            setDetailLoading(true);
            const res = await getPostDetail((detailPost.postId || detailPost.id).toString());
            if (res.success && res.data) {
                setDetailPost(res.data);
                setDetailCommentsTree(buildCommentTree(res.data.comments || []));
            }
        } catch (e: any) {
            handleApiError(e, "Không thể làm mới chi tiết");
        } finally {
            setDetailLoading(false);
        }
    };

    // Fetch posts from API with pagination
    const fetchPosts = async (page: number = 1, refresh: boolean = false) => {
        try {
            if (refresh) setIsRefreshing(true);
            setIsLoadingPosts(true);

            const response = await getGroupPosts(groupId, page, 10);
            if (response.success && response.data) {
                const items = response.data.items || [];
                const mapped: Post[] = items.map((p: any) => ({
                    id: p.id || p.postId?.toString(),
                    postId: p.postId,
                    title: p.title || p.Title || "", // fallback from DB casing
                    content: p.content || p.contentMarkdown || p.contentSnippet || "", // include snippet from list API
                    contentMarkdown: p.contentMarkdown || "",
                    author: {
                        id: p.author?.userId || p.authorId,
                        userId: p.author?.userId || p.authorId,
                        name: p.author?.displayName || p.authorName || p.author?.fullName || "Unknown User",
                        fullName: p.author?.fullName || p.author?.displayName || p.authorName || "Unknown User",
                        displayName: p.author?.displayName || p.authorName || p.author?.fullName || "Unknown User",
                        avatarUrl: p.author?.avatarUrl || p.authorAvatar || p.author?.avatarURL
                    },
                    createdAt: p.createdAt,
                    likeCount: p.likeCount || 0,
                    commentCount: p.commentCount || 0,
                    isLiked: p.isLikedByCurrentUser || p.isLiked,
                    attachments: []
                }));

                if (page === 1 || refresh) setPosts(mapped); else setPosts(prev => [...prev, ...mapped]);

                const totalPages = response.data.totalPages || 1;
                const pageNumber = response.data.pageNumber || page;
                setHasMorePosts(pageNumber < totalPages);
                setCurrentPage(pageNumber);
            } else {
                setPosts([]);
                setHasMorePosts(false);
            }
        } catch (error: any) {
            const err = handleApiError(error, "Không thể tải bài viết");
            console.error(err.message);
            setPosts([]);
            setHasMorePosts(false);
        } finally {
            setIsLoadingPosts(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPosts(1, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupId]);

    const handleCreatePost = async () => {
        try {
            if (!newPostTitle.trim() || !newPostContent.trim()) return;
            setIsCreatingPost(true);

            const payload = {
                title: newPostTitle.trim(),
                contentMarkdown: newPostContent.trim(),
                attachmentFileIds: uploadedFileIds
            };

            const response = await createGroupPost(groupId, payload);
            if (response.success) {
                toast.success("Đăng bài thành công!");
                setNewPostTitle("");
                setNewPostContent("");
                setSelectedFiles([]);
                setUploadedFileIds([]);
                fetchPosts(1, true);
            } else {
                toast.error(response.message || "Không thể đăng bài");
            }
        } catch (error: any) {
            const err = handleApiError(error, "Không thể đăng bài");
            console.error(err.message);
        } finally {
            setIsCreatingPost(false);
        }
    };

    const handleToggleLike = async (post: Post) => {
        // Optimistic UI
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isLiked: !p.isLiked, likeCount: (p.likeCount || 0) + (p.isLiked ? -1 : 1) } : p));
        try {
            const res = await togglePostLike(post.postId.toString());
            if (!res.success) {
                // rollback on failure
                setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isLiked: !p.isLiked, likeCount: (p.likeCount || 0) + (p.isLiked ? -1 : 1) } : p));
                toast.error(res.message || "Không thể thao tác thích/bỏ thích");
            }
        } catch (error: any) {
            setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isLiked: !p.isLiked, likeCount: (p.likeCount || 0) + (p.isLiked ? -1 : 1) } : p));
            handleApiError(error, "Không thể thao tác thích/bỏ thích");
        }
    };

    const toggleComments = async (post: Post) => {
        // Mở dialog chi tiết khi bấm vào bình luận
        await openPostDetail(post);
    };

    const submitComment = async (post: Post) => {
        const content = (newComment[post.id] || "").trim();
        if (!content) return;
        // optimistic add
        const temp: Comment = {
            commentId: Math.floor(Math.random() * 1e9),
            content,
            author: { userId: "me", fullName: "Bạn", avatarUrl: undefined },
            createdAt: new Date().toISOString(),
            parentCommentId: null,
            replies: []
        };
        setPostComments(prev => ({ ...prev, [post.id]: [...(prev[post.id] || []), temp] }));
        setNewComment(prev => ({ ...prev, [post.id]: "" }));
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p));
        try {
            const res = await addPostComment(post.postId.toString(), { content });
            if (!res.success) {
                toast.error(res.message || "Không thể bình luận");
                // rollback count; keep temp comment for UX
                setPosts(prev => prev.map(p => p.id === post.id ? { ...p, commentCount: Math.max(0, (p.commentCount || 1) - 1) } : p));
            } else {
                // Optionally refresh detail to get accurate server data
                const detail = await getPostDetail(post.postId.toString());
                if (detail.success) {
                    const comments: Comment[] = (detail.data.comments || []).map((c: any) => ({
                        commentId: c.commentId,
                        content: c.content,
                        author: { userId: c.author?.userId, fullName: c.author?.displayName || c.author?.fullName || "", avatarUrl: c.author?.avatarUrl },
                        createdAt: c.createdAt,
                        parentCommentId: c.parentCommentId,
                        replies: []
                    }));
                    setPostComments(prev => ({ ...prev, [post.id]: comments }));
                }
            }
        } catch (error: any) {
            handleApiError(error, "Không thể bình luận");
        }
    };

    const handleLoadMore = () => {
        if (hasMorePosts && !isLoadingPosts) fetchPosts(currentPage + 1);
    };

    const handleRefresh = () => { fetchPosts(1, true); };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffInHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffInHours < 1) return "Vừa xong";
        if (diffInHours < 24) return `${diffInHours} giờ trước`;
        const days = Math.floor(diffInHours / 24);
        return `${days} ngày trước`;
    };

    const formatDateAbsolute = (dateString: string) => {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return "";
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    };

    const getInitials = (name?: string) => {
        if (!name || typeof name !== "string") return "U";
        const parts = name.trim().split(/\s+/);
        const first = parts[0]?.[0] || "";
        const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
        return (first + last).toUpperCase() || "U";
    };

    const toPlainText = (input?: string) => {
        if (!input || typeof input !== "string") return "";
        try {
            const div = document.createElement("div");
            div.innerHTML = input;
            return (div.textContent || div.innerText || "").trim();
        } catch {
            return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        }
    };

    const isValidHttpUrl = (value?: string) => {
        if (!value || typeof value !== "string") return false;
        try {
            const u = new URL(value);
            return u.protocol === "http:" || u.protocol === "https:";
        } catch {
            return false;
        }
    };

    const buildCommentTree = (flat: any[] = []) => {
        if (!Array.isArray(flat)) return [] as any[];

        const hasNested = flat.some((c: any) => Array.isArray(c.replies) && c.replies.length > 0);
        const normalize = (c: any): any => ({
            commentId: c.commentId ?? c.id,
            content: c.content ?? c.Content ?? "",
            author: c.author ?? c.Author ?? {},
            createdAt: c.createdAt ?? c.CreatedAt ?? new Date().toISOString(),
            parentCommentId: c.parentCommentId ?? c.ParentCommentId ?? null,
            replies: Array.isArray(c.replies) ? c.replies.map(normalize) : []
        });

        if (hasNested) {
            return flat.map(normalize);
        }

        // Flat → tree
        const items = flat.map(normalize);
        const childrenByParent: Record<string, any[]> = {};
        for (const c of items) {
            const key = c.parentCommentId == null ? "root" : String(c.parentCommentId);
            if (!childrenByParent[key]) childrenByParent[key] = [];
            childrenByParent[key].push({ ...c, replies: [] });
        }

        const attach = (node: any): any => {
            const children = childrenByParent[String(node.commentId)] || [];
            node.replies = children.map(attach);
            return node;
        };
        return (childrenByParent["root"] || []).map(attach);
    };

    const onEditPost = (post: Post) => {
        setEditingPost(post);
        setEditingTitle(post.title || "");
        setEditingContent(post.contentMarkdown || post.content || "");
    };

    const saveEditPost = async () => {
        if (!editingPost) return;
        const updated = {
            title: editingTitle.trim(),
            content: editingContent.trim()
        };
        if (!updated.title || !updated.content) {
            toast.error("Tiêu đề và nội dung không được để trống");
            return;
        }
        // Optimistic update; TODO hook to Update API when available
        setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, title: updated.title, content: updated.content, contentMarkdown: updated.content } : p));
        setEditingPost(null);
        setEditingTitle("");
        setEditingContent("");
        toast.success("Cập nhật bài viết thành công");
    };

    const onDeletePost = async (post: Post) => {
        setDeletingPost(post);
    };

    const confirmDeletePost = async () => {
        if (!deletingPost) return;
        const previous = posts;
        setPosts(prev => prev.filter(p => p.id !== deletingPost.id));
        setDeletingPost(null);
        try {
            // TODO: Kết nối API xóa bài viết khi backend sẵn sàng
        } catch (e: any) {
            // rollback nếu lỗi
            setPosts(previous);
            toast.error("Xóa bài viết thất bại");
        }
    };

    const renderComments = (nodes: any[] = [], level: number = 0) => (
        <div className={level > 0 ? "ml-6 space-y-2" : "space-y-3"}>
            {nodes.map((c: any) => (
                <div key={c.commentId} className="flex items-start space-x-3">

                    <div className="flex-1">
                        <div className="text-sm font-medium">{c.author?.fullName}</div>
                        <div className="text-sm text-gray-500">{formatDateAbsolute(c.createdAt)}</div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{c.content}</div>
                        <div className="flex items-center space-x-2 mt-1">
                            <Input value={replyTextMap[c.commentId] || ""} onChange={(e) => setReplyTextMap(prev => ({ ...prev, [c.commentId]: e.target.value }))} placeholder="Trả lời bình luận..." className="h-7 text-xs px-2" />
                            <Button size="sm" className="h-7 px-3 text-xs" onClick={async () => {
                                const content = (replyTextMap[c.commentId] || '').trim();
                                if (!content) return;
                                try {
                                    // Optimistic add
                                    const tempId = Math.floor(Math.random() * 1e9);
                                    setDetailPost((prev: any) => prev ? {
                                        ...prev,
                                        comments: [
                                            ...prev.comments,
                                            {
                                                commentId: tempId,
                                                content,
                                                author: prev.author,
                                                createdAt: new Date().toISOString(),
                                                parentCommentId: c.commentId
                                            }
                                        ]
                                    } : prev);
                                    const res = await addPostComment((detailPost.postId || detailPost.id).toString(), { content, parentCommentId: c.commentId });
                                    if (res.success) {
                                        const detail = await getPostDetail((detailPost.postId || detailPost.id).toString());
                                        if (detail.success) {
                                            // Merge optimistic comments (temporary ids) to avoid flicker if backend delays indexing
                                            setDetailPost((prev: any) => {
                                                const serverComments = detail.data?.comments || [];
                                                const prevComments = prev?.comments || [];
                                                const tempOnly = prevComments.filter((pc: any) => !serverComments.some((sc: any) => sc.commentId === pc.commentId));
                                                return { ...detail.data, comments: [...serverComments, ...tempOnly] };
                                            });
                                            setDetailCommentsTree(buildCommentTree(detail.data.comments || []));
                                        }
                                        setReplyTextMap(prev => ({ ...prev, [c.commentId]: "" }));
                                    } else {
                                        // Graceful fallback for 404 (post not found or comment route mismatch)
                                        toast.error(res.message || 'Không thể trả lời');
                                    }
                                } catch (err: any) {
                                    handleApiError(err, 'Không thể trả lời');
                                }
                            }}>Gửi</Button>
                        </div>
                        {c.replies && c.replies.length > 0 && renderComments(c.replies, level + 1)}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                            <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bài viết trong {groupName}</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Chia sẻ và tương tác với cộng đồng</p>
                        </div>
                    </div>
                    <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm" className="flex items-center space-x-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>Làm mới</span>
                    </Button>
                </div>

                {/* Create Post */}
                <Card className="border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md bg-white dark:bg-gray-900">
                    <CardContent className="p-4">
                        <div className="space-y-3">
                            <Input placeholder="Tiêu đề bài viết" value={newPostTitle} onChange={(e) => setNewPostTitle(e.target.value)} className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-base focus:border-gray-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-gray-100 dark:focus:ring-blue-900/20 transition-all duration-200 text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400" disabled={isCreatingPost} />

                            {/* File Attachment Controls - Above Tiptap */}
                            <div className="flex items-center space-x-1 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-600 w-fit">
                                <input
                                    type="file"
                                    id="file-upload"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        setSelectedFiles(prev => [...prev, ...files]);
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                    className="h-7 px-2 hover:bg-gray-100 dark:hover:bg-blue-900/20 text-black dark:text-blue-300 transition-colors duration-200"
                                >
                                    <FileText className="h-3 w-3 mr-1" />
                                    <span className="text-xs font-medium">Tài liệu</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                    className="h-7 px-2 hover:bg-gray-100 dark:hover:bg-blue-900/20 text-black dark:text-blue-300 transition-colors duration-200"
                                >
                                    <Image className="h-3 w-3 mr-1" />
                                    <span className="text-xs font-medium">Hình ảnh</span>
                                </Button>
                            </div>

                            <RichTextEditor
                                content={newPostContent}
                                onChange={setNewPostContent}
                                placeholder={`Nội dung chia sẻ với cộng đồng ${groupName}...`}
                                disabled={isCreatingPost}
                            />
                            {/* File Preview */}
                            {selectedFiles.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} className="relative group">
                                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors duration-200">
                                                <div className="flex items-center space-x-2">
                                                    <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                    <span className="text-xs text-black dark:text-gray-300 truncate font-medium">{file.name}</span>
                                                </div>
                                                <div className="text-xs text-black dark:text-gray-400 mt-1">{formatFileSize(file.size)}</div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                                                    setUploadedFileIds(prev => prev.filter((_, i) => i !== index));
                                                }}
                                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-black dark:text-gray-500">
                                        {newPostTitle.length}/100 • {newPostContent.length}/2000
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        onClick={handleCreatePost}
                                        disabled={isCreatingPost || !newPostContent.trim() || !newPostTitle.trim() || newPostTitle.length > 100 || newPostContent.length > 2000}
                                        className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 dark:from-blue-600 dark:to-purple-600 dark:hover:from-blue-700 dark:hover:to-purple-700 text-white shadow-sm hover:shadow-md transition-all duration-200 px-6 py-2 rounded-lg font-medium"
                                    >
                                        {isCreatingPost ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4 mr-2" />
                                        )}
                                        Đăng bài
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Posts List */}
                <div className="space-y-6">
                    {isLoadingPosts && currentPage === 1 && (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            <span className="ml-2 text-gray-500">Đang tải bài viết...</span>
                        </div>
                    )}

                    {!isLoadingPosts && posts.length === 0 && (
                        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
                            <CardContent className="text-center py-16">
                                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FileText className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Chưa có bài viết nào</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">Hãy là người đầu tiên chia sẻ điều gì đó thú vị với cộng đồng {groupName}!</p>
                            </CardContent>
                        </Card>
                    )}

                    {posts.map((post) => (
                        <Card key={post.id} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md dark:shadow-lg dark:hover:shadow-xl transition-all duration-200 backdrop-blur-sm">
                            <CardContent className="p-6">
                                {/* Author Info */}
                                <div className="flex items-start space-x-3 mb-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={isValidHttpUrl(post.author.avatarUrl) ? post.author.avatarUrl : undefined} alt={post.author.fullName || post.author.displayName || "User"} />
                                        <AvatarFallback>{getInitials(post.author.fullName || post.author.displayName || post.author.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <h3 className="font-bold text-black dark:text-white text-lg">{post.author.fullName || post.author.displayName || post.author.name || "Unknown User"}</h3>
                                            <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-600/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-500/30 text-xs px-2 py-1">
                                                Member
                                            </Badge>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm text-black dark:text-gray-400">
                                            <span>{groupName}</span>
                                            <span>•</span>
                                            <span>{formatDateAbsolute(post.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Post Content */}
                                <div className="mb-6">
                                    <h4 className="text-xl font-bold text-black dark:text-white mb-3">{post.title}</h4>
                                    <p className="text-black dark:text-gray-300 text-base leading-relaxed whitespace-pre-wrap">
                                        {toPlainText(post.content || post.contentMarkdown || (post as any).contentSnippet || "")}
                                    </p>
                                </div>

                                {/* Interaction Bar */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center space-x-6">
                                        <button
                                            onClick={() => handleToggleLike(post)}
                                            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-black dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
                                        >
                                            <Heart className={`h-5 w-5 ${post.isLiked ? "fill-current text-red-500" : ""}`} />
                                            <span className="text-sm font-medium">Thích</span>
                                            {post.likeCount > 0 && (
                                                <span className="text-sm text-gray-600 dark:text-gray-400">({post.likeCount})</span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => toggleComments(post)}
                                            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-black dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-200"
                                        >
                                            <MessageCircle className="h-5 w-5" />
                                            <span className="text-sm font-medium">Bình luận</span>
                                            {post.commentCount > 0 && (
                                                <span className="text-sm text-gray-600 dark:text-gray-400">({post.commentCount})</span>
                                            )}
                                        </button>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Badge variant="outline" className="bg-blue-100 dark:bg-blue-600/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-500/30 text-xs px-3 py-1">
                                            Bài của bạn
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-2 rounded-lg text-black dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-44 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border border-gray-200 dark:border-gray-700">
                                                <DropdownMenuItem onClick={() => onEditPost(post)} className="focus:bg-gray-100 dark:focus:bg-gray-700">
                                                    Chỉnh sửa bài viết
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onDeletePost(post)} className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/30">
                                                    Xóa bài viết
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {hasMorePosts && !isLoadingPosts && posts.length > 0 && (
                        <div className="flex justify-center py-6">
                            <Button onClick={handleLoadMore} variant="outline" className="flex items-center">
                                <Loader2 className="h-4 w-4 mr-2" /> Tải thêm bài viết
                            </Button>
                        </div>
                    )}

                    {isLoadingPosts && currentPage > 1 && (
                        <div className="flex justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            <span className="ml-2 text-gray-500">Đang tải thêm...</span>
                        </div>
                    )}
                </div>
            </div>
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Chi tiết bài viết</DialogTitle>
                        <DialogDescription className="sr-only">Cửa sổ hiển thị nội dung bài viết và các bình luận.</DialogDescription>
                    </DialogHeader>
                    {detailLoading ? (
                        <div className="flex items-center text-gray-500"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Đang tải...</div>
                    ) : detailPost ? (
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={isValidHttpUrl(detailPost.author?.avatarUrl) ? detailPost.author?.avatarUrl : undefined} alt={detailPost.author?.fullName || "User"} />
                                    <AvatarFallback>{getInitials(detailPost.author?.fullName)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="font-semibold">{detailPost.author?.fullName}</div>
                                    <div className="text-sm text-gray-500">{formatDateAbsolute(detailPost.createdAt)}</div>
                                </div>
                            </div>
                            <div>
                                <div className="text-lg font-medium mb-2">{detailPost.title}</div>
                                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{toPlainText(detailPost.contentMarkdown || detailPost.content || "")}</div>
                            </div>
                            <div className="flex items-center space-x-6 pt-2">
                                <button onClick={async () => {
                                    try {
                                        // optimistic
                                        setDetailPost((prev: any) => prev ? { ...prev, isLiked: !prev.isLiked, likeCount: (prev.likeCount || 0) + (prev.isLiked ? -1 : 1) } : prev);
                                        const res = await togglePostLike((detailPost.postId || detailPost.id).toString());
                                        if (!res.success) {
                                            setDetailPost((prev: any) => prev ? { ...prev, isLiked: !prev.isLiked, likeCount: (prev.likeCount || 0) + (prev.isLiked ? -1 : 1) } : prev);
                                            toast.error(res.message || "Không thể thích/bỏ thích");
                                        }
                                    } catch (e: any) {
                                        handleApiError(e, "Không thể thích/bỏ thích");
                                    }
                                }} className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors">
                                    <Heart className={`h-5 w-5 ${detailPost.isLiked ? 'fill-current text-red-500' : ''}`} />
                                    <span className="text-sm font-medium">Thích</span>
                                    <span className="text-sm text-gray-500">({detailPost.likeCount || 0})</span>
                                </button>
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <MessageCircle className="h-5 w-5" />
                                    <span className="text-sm font-medium">Bình luận</span>
                                    <span className="text-sm text-gray-500">({detailPost.commentCount || (detailPost.comments?.length || 0)})</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="font-semibold">Bình luận</div>
                                {(() => {
                                    const tree = buildCommentTree(detailPost.comments || []); return tree.length === 0 ? (
                                        <div className="text-sm text-gray-500">Chưa có bình luận nào</div>
                                    ) : (
                                        renderComments(tree)
                                    );
                                })()}
                                <div className="flex items-center space-x-2">
                                    <Input value={detailNewComment} onChange={(e) => setDetailNewComment(e.target.value)} placeholder="Viết bình luận..." className="flex-1" />
                                    <Button size="sm" onClick={async () => {
                                        const content = detailNewComment.trim();
                                        if (!content) return;
                                        try {
                                            // Optimistic add
                                            const tempId = Math.floor(Math.random() * 1e9);
                                            setDetailPost((prev: any) => prev ? {
                                                ...prev,
                                                comments: [
                                                    ...prev.comments,
                                                    {
                                                        commentId: tempId,
                                                        content,
                                                        author: prev.author,
                                                        createdAt: new Date().toISOString(),
                                                        parentCommentId: null
                                                    }
                                                ]
                                            } : prev);
                                            const res = await addPostComment((detailPost.postId || detailPost.id).toString(), { content });
                                            if (res.success) {
                                                const detail = await getPostDetail((detailPost.postId || detailPost.id).toString());
                                                if (detail.success) setDetailPost(detail.data);
                                                setDetailNewComment("");
                                            } else {
                                                toast.error(res.message || 'Không thể bình luận');
                                            }
                                        } catch (err: any) {
                                            handleApiError(err, 'Không thể bình luận');
                                        }
                                    }}>Gửi</Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">Không có dữ liệu</div>
                    )}
                </DialogContent>
            </Dialog>
            {/* Edit Post Dialog */}
            <Dialog open={!!editingPost} onOpenChange={(open) => { if (!open) setEditingPost(null); }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa bài viết</DialogTitle>
                        <DialogDescription className="sr-only">Biểu mẫu chỉnh sửa tiêu đề và nội dung bài viết.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Input
                            placeholder="Tiêu đề bài viết"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-base focus:border-gray-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-gray-100 dark:focus:ring-blue-900/20 transition-all duration-200 text-black dark:text-white"
                        />
                        <RichTextEditor
                            content={editingContent}
                            onChange={setEditingContent}
                            placeholder="Nội dung bài viết..."
                        />
                        <div className="flex justify-end space-x-2 pt-2">
                            <Button variant="outline" onClick={() => setEditingPost(null)}>Hủy</Button>
                            <Button onClick={saveEditPost} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">Lưu thay đổi</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Confirm Delete Dialog */}
            <AlertDialog open={!!deletingPost} onOpenChange={(open) => { if (!open) setDeletingPost(null); }}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc muốn xóa bài viết này?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Bài viết sẽ bị xóa khỏi cộng đồng.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeletePost} className="bg-red-600 hover:bg-red-700 text-white">Xóa bài viết</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
