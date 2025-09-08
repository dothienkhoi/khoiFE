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
import { getGroupPosts, createGroupPost, togglePostLike, getPostDetail, addPostComment, getGroupDetails } from "@/lib/customer-api-client";

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
    const [editorKey, setEditorKey] = useState(0);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMorePosts, setHasMorePosts] = useState(false);
    const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
    // Removed old inline comments list (we use Detail dialog only)
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
    const [groupOwnerIds, setGroupOwnerIds] = useState<Set<string>>(new Set());

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
                const toBool = (v: any) => v === true || v === 1 || v === '1' || String(v).toLowerCase?.() === 'true';
                // Read local like cache to keep red heart after navigation
                const likedCache: Record<string, boolean> = (() => {
                    try {
                        const raw = localStorage.getItem('fb_liked_posts');
                        return raw ? JSON.parse(raw) : {};
                    } catch { return {}; }
                })();

                const mapped: Post[] = items.map((p: any) => {
                    const postId = p.postId;
                    const serverIsLiked = toBool(p.isLikedByCurrentUser ?? p.isLiked ?? p.IsLiked ?? p.LikedByCurrentUser);
                    const cachedIsLiked = likedCache[postId];
                    const finalIsLiked = cachedIsLiked !== undefined ? !!cachedIsLiked : serverIsLiked;

                    console.log(`[Like] Post ${postId}: server=${serverIsLiked}, cache=${cachedIsLiked}, final=${finalIsLiked}`);

                    return {
                        id: p.id || p.postId?.toString(),
                        postId: p.postId,
                        title: p.title || p.Title || "",
                        content: p.content || p.contentMarkdown || p.contentSnippet || "",
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
                        likeCount: p.likeCount ?? p.LikeCount ?? 0,
                        commentCount: p.commentCount ?? p.CommentCount ?? 0,
                        isLiked: finalIsLiked,
                        attachments: []
                    };
                });

                if (page === 1 || refresh) {
                    setPosts(mapped);
                    // Initialize like status for all posts
                    const newLikeStatus: Record<string, boolean> = {};
                    mapped.forEach(post => {
                        newLikeStatus[post.id] = !!post.isLiked;
                    });
                    setLikeStatus(newLikeStatus);
                } else {
                    setPosts(prev => [...prev, ...mapped]);
                    // Update like status for new posts
                    setLikeStatus(prev => {
                        const updated = { ...prev };
                        mapped.forEach(post => {
                            updated[post.id] = !!post.isLiked;
                        });
                        return updated;
                    });
                }

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

    // Load group owners (admin/owner) to label Chủ nhóm
    useEffect(() => {
        const loadOwners = async () => {
            try {
                const res = await getGroupDetails(groupId);
                if (res?.success && res?.data?.members) {
                    const owners = new Set<string>();
                    (res.data.members || []).forEach((m: any) => {
                        const role = m.role || m.Role;
                        if (role && (String(role).toLowerCase() === "admin" || String(role).toLowerCase() === "owner")) {
                            owners.add(m.userId || m.UserID);
                        }
                    });
                    setGroupOwnerIds(owners);
                } else {
                    setGroupOwnerIds(new Set());
                }
            } catch {
                setGroupOwnerIds(new Set());
            }
        };
        loadOwners();
    }, [groupId]);

    const handleCreatePost = async () => {
        try {
            if (!newPostTitle.trim() || !newPostContent.trim()) return;
            setIsCreatingPost(true);

            const payload = {
                title: newPostTitle.trim(),
                content: newPostContent.trim(), // Send HTML content
                contentMarkdown: newPostContent.trim(), // Also send as markdown for compatibility
                attachmentFileIds: uploadedFileIds
            };

            const response = await createGroupPost(groupId, payload);
            if (response.success) {
                toast.success("Đăng bài thành công!");
                // Clear all form data
                setNewPostTitle("");
                setNewPostContent("");
                setSelectedFiles([]);
                setUploadedFileIds([]);
                // Force re-render editor to clear content
                setEditorKey(prev => prev + 1);
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

    // Track pending like/unlike to avoid double clicks
    const [likePending, setLikePending] = useState<Record<string, boolean>>({});

    // Track like status separately to ensure UI updates correctly
    const [likeStatus, setLikeStatus] = useState<Record<string, boolean>>({});

    const handleToggleLike = async (post: Post) => {
        if (likePending[post.id]) return; // prevent double action on the same post
        setLikePending(prev => ({ ...prev, [post.id]: true }));

        const currentIsLiked = post.isLiked;
        const newIsLiked = !currentIsLiked;
        const newLikeCount = Math.max(0, (post.likeCount || 0) + (newIsLiked ? 1 : -1));

        console.log(`[Like] Toggling like for post ${post.id}, current: ${currentIsLiked} -> new: ${newIsLiked}`);

        // Update like status state immediately
        setLikeStatus(prev => ({ ...prev, [post.id]: newIsLiked }));

        // Optimistic UI update immediately
        setPosts(prev => prev.map(p =>
            p.id === post.id
                ? { ...p, isLiked: newIsLiked, likeCount: newLikeCount }
                : p
        ));

        try {
            const res = await togglePostLike(post.postId.toString());
            if (!res.success) {
                // Rollback on failure
                console.log(`[Like] API failed, rolling back for post ${post.id}`);
                setLikeStatus(prev => ({ ...prev, [post.id]: !!currentIsLiked }));
                setPosts(prev => prev.map(p =>
                    p.id === post.id
                        ? { ...p, isLiked: currentIsLiked, likeCount: post.likeCount }
                        : p
                ));
                toast.error(res.message || "Không thể thao tác thích/bỏ thích");
            } else {
                console.log(`[Like] API success for post ${post.id}, keeping optimistic state`);
                // Keep the optimistic state since API succeeded
                // Update cache to persist the state
                try {
                    const raw = localStorage.getItem('fb_liked_posts');
                    const cache = raw ? JSON.parse(raw) : {};
                    cache[post.postId] = newIsLiked;
                    localStorage.setItem('fb_liked_posts', JSON.stringify(cache));
                    console.log(`[Like] Updated cache for post ${post.postId}: ${newIsLiked}`);
                } catch { }
            }
        } catch (error: any) {
            console.log(`[Like] API error, rolling back for post ${post.id}`);
            setLikeStatus(prev => ({ ...prev, [post.id]: !!currentIsLiked }));
            setPosts(prev => prev.map(p =>
                p.id === post.id
                    ? { ...p, isLiked: currentIsLiked, likeCount: post.likeCount }
                    : p
            ));
            handleApiError(error, "Không thể thao tác thích/bỏ thích");
        } finally {
            setLikePending(prev => ({ ...prev, [post.id]: false }));
        }
    };

    const toggleComments = async (post: Post) => {
        // Mở dialog chi tiết khi bấm vào bình luận
        await openPostDetail(post);
    };

    // Comment submission is handled in the detail dialog

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
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={isValidHttpUrl(c.author?.avatarUrl) ? c.author.avatarUrl : undefined} />
                        <AvatarFallback>{getInitials(c.author?.fullName || c.author?.displayName || c.author?.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-black dark:text-white">{c.author?.fullName || c.author?.displayName || c.author?.name || 'Người dùng'}</div>
                            <div className="text-xs text-gray-500">{formatDateAbsolute(c.createdAt)}</div>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{c.content}</div>
                        <div className="flex items-center space-x-2 mt-1">
                            <Input value={replyTextMap[c.commentId] || ""} onChange={(e) => setReplyTextMap(prev => ({ ...prev, [c.commentId]: e.target.value }))} placeholder="Trả lời bình luận..." className="h-7 text-xs px-2" />
                            <Button size="sm" className="h-7 px-3 text-xs" onClick={async () => {
                                const content = (replyTextMap[c.commentId] || '').trim();
                                if (!content) return;
                                try {
                                    const res = await addPostComment((detailPost.postId || detailPost.id).toString(), { content, parentCommentId: c.commentId });
                                    if (res.success) {
                                        const detail = await getPostDetail((detailPost.postId || detailPost.id).toString());
                                        if (detail.success) {
                                            setDetailPost(detail.data);
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
        <div className="flex-1 overflow-y-auto custom-scrollbar">
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
                                key={editorKey}
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
                                            <h3 className="font-bold text-black dark:text-white text-lg">{post.author.fullName || post.author.displayName || post.author.name || "Người dùng"}</h3>
                                            {/* Vai trò: Chủ nhóm (người tạo nhóm) hoặc Thành viên */}
                                            <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-600/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-500/30 text-xs px-2 py-1">
                                                {groupOwnerIds.has(post.author.userId as any) ? "Chủ nhóm" : "Thành viên"}
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
                                    <div
                                        className="text-black dark:text-gray-300 text-base leading-relaxed prose prose-sm dark:prose-invert max-w-none [&_p]:text-inherit [&_div]:text-inherit"
                                        dangerouslySetInnerHTML={{
                                            __html: post.content || post.contentMarkdown || (post as any).contentSnippet || ""
                                        }}
                                    />
                                </div>

                                {/* Interaction Bar */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center space-x-6">
                                        <button
                                            onClick={() => {
                                                console.log(`[Like Button] Post ${post.id} isLiked: ${post.isLiked}, likeCount: ${post.likeCount}`);
                                                handleToggleLike(post);
                                            }}
                                            disabled={!!likePending[post.id]}
                                            aria-pressed={post.isLiked}
                                            title={post.isLiked ? "Bỏ thích" : "Thích"}
                                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-black dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 ${likePending[post.id] ? "pointer-events-none opacity-60" : ""}`}
                                        >
                                            {(() => {
                                                const currentLikeStatus = likeStatus[post.id] !== undefined ? likeStatus[post.id] : post.isLiked;
                                                console.log(`[Heart Render] Post ${post.id}: post.isLiked=${post.isLiked}, likeStatus=${likeStatus[post.id]}, final=${currentLikeStatus}`);
                                                return currentLikeStatus ? (
                                                    <Heart className="h-5 w-5 fill-current text-red-500" />
                                                ) : (
                                                    <Heart className="h-5 w-5 text-gray-400" />
                                                );
                                            })()}
                                            <span className="text-sm font-medium">{post.isLiked ? "Bỏ thích" : "Thích"}</span>
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
                                        {(post as any).author?.userId === (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.user?.id : undefined) && (
                                            <Badge variant="outline" className="bg-blue-100 dark:bg-blue-600/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-500/30 text-xs px-3 py-1">
                                                Bài của bạn
                                            </Badge>
                                        )}
                                        {(post as any).author?.userId === (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.user?.id : undefined) && (
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
                                        )}
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
                <DialogContent className="max-w-3xl p-0 overflow-hidden">
                    <div className="max-h-[80vh] overflow-y-auto p-6">
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
                                    <div
                                        className="text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none [&_p]:text-inherit [&_div]:text-inherit"
                                        dangerouslySetInnerHTML={{
                                            __html: detailPost.contentMarkdown || detailPost.content || ""
                                        }}
                                    />
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
                                        {detailPost.isLiked ? (
                                            <Heart className="h-5 w-5 fill-current text-red-500" />
                                        ) : (
                                            <Heart className="h-5 w-5 text-gray-400" />
                                        )}
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
                    </div>
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
