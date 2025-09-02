"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Image,
    FileText,
    Link,
    Smile,
    Send,
    Heart,
    MessageCircle,

    MoreHorizontal,
    ThumbsUp,
    Bookmark,
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
    const [newPostContent, setNewPostContent] = useState("");
    const [isCreatingPost, setIsCreatingPost] = useState(false);
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
    const [detailNewComment, setDetailNewComment] = useState("");
    const [replyTextMap, setReplyTextMap] = useState<Record<number, string>>({});

    const openPostDetail = async (post: Post) => {
        try {
            setDetailOpen(true);
            setDetailLoading(true);
            setDetailPost(null);
            const res = await getPostDetail(post.postId.toString());
            if (res.success && res.data) {
                setDetailPost(res.data);
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
            if (res.success && res.data) setDetailPost(res.data);
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
            if (!newPostContent.trim()) return;
            setIsCreatingPost(true);

            const payload = {
                title: `Bài viết mới trong ${groupName}`,
                contentMarkdown: newPostContent.trim(),
                attachmentFileIds: [] as string[]
            };

            const response = await createGroupPost(groupId, payload);
            if (response.success) {
                toast.success("Đăng bài thành công!");
                setNewPostContent("");
                setSelectedFiles([]);
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
        const byId: Record<number, any> = {};
        flat.forEach((c: any) => {
            byId[c.commentId] = { ...c, replies: [] };
        });
        flat.forEach((c: any) => {
            const parentId = c.parentCommentId;
            if (parentId && byId[parentId]) {
                byId[parentId].replies.push(byId[c.commentId]);
            }
        });
        return Object.values(byId).filter((c: any) => !c.parentCommentId);
    };

    const renderComments = (nodes: any[] = [], level: number = 0) => (
        <div className={level > 0 ? "ml-8 space-y-3" : "space-y-3"}>
            {nodes.map((c: any) => (
                <div key={c.commentId} className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={c.author?.avatarUrl} />
                        <AvatarFallback className="bg-blue-600 text-white">{(c.author?.fullName || "U").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="text-sm font-medium">{c.author?.fullName}</div>
                        <div className="text-sm text-gray-500">{formatDateAbsolute(c.createdAt)}</div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{c.content}</div>
                        <div className="flex items-center space-x-2 mt-2">
                            <Input value={replyTextMap[c.commentId] || ""} onChange={(e) => setReplyTextMap(prev => ({ ...prev, [c.commentId]: e.target.value }))} placeholder="Trả lời bình luận..." className="h-8" />
                            <Button size="sm" onClick={async () => {
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
                                        if (detail.success) setDetailPost(detail.data);
                                        setReplyTextMap(prev => ({ ...prev, [c.commentId]: "" }));
                                    } else {
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
                <Card className="border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                            <Avatar className="h-12 w-12 ring-2 ring-blue-100 dark:ring-blue-900 shadow-md">
                                <AvatarImage src="/api/placeholder/48/48" />
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg">B</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-4">
                                <div className="relative">
                                    <Textarea placeholder={`Chia sẻ điều gì đó với cộng đồng ${groupName}...`} value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} className="min-h-[120px] resize-none border-2 border-gray-200 dark:border-gray-600 rounded-xl p-4 text-base focus:border-blue-500 dark:focus:border-blue-400 transition-colors" disabled={isCreatingPost} />
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center space-x-2">
                                        <Button type="button" variant="ghost" size="icon"><Image className="h-5 w-5" /></Button>
                                        <Button type="button" variant="ghost" size="icon"><FileText className="h-5 w-5" /></Button>
                                        <Button type="button" variant="ghost" size="icon"><Link className="h-5 w-5" /></Button>
                                        <Button type="button" variant="ghost" size="icon"><Smile className="h-5 w-5" /></Button>
                                    </div>
                                    <Button onClick={handleCreatePost} disabled={isCreatingPost || !newPostContent.trim()} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                        <Send className="h-4 w-4 mr-2" /> Đăng bài
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
                        <Card key={post.id} className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start space-x-3 mb-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={isValidHttpUrl(post.author.avatarUrl) ? post.author.avatarUrl : undefined} />
                                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">{(post.author.fullName || post.author.displayName || post.author.name || "U").charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{post.author.fullName || post.author.displayName || post.author.name || "Unknown User"}</h3>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {formatDateAbsolute(post.createdAt)}
                                            </span>
                                        </div>
                                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mt-1">{post.title}</h4>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.content || post.contentMarkdown || (post as any).contentSnippet || ""}</p>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center space-x-6">
                                        <button onClick={() => handleToggleLike(post)} className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                            <Heart className={`h-5 w-5 ${post.isLiked ? "fill-current" : ""}`} />
                                            <span className="text-sm font-medium">{post.likeCount}</span>
                                        </button>
                                        <button onClick={() => toggleComments(post)} className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                            <MessageCircle className="h-5 w-5" />
                                            <span className="text-sm font-medium">{post.commentCount}</span>
                                        </button>
                                        {/* Nút Chi tiết đã được chuyển sang biểu tượng bình luận */}
                                    </div>
                                    <button className={`p-2 rounded-lg transition-colors ${post.isBookmarked ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20" : "text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"}`}>
                                        <Bookmark className={`h-5 w-5 ${post.isBookmarked ? "fill-current" : ""}`} />
                                    </button>
                                </div>

                                {/* Bình luận inline đã được chuyển vào dialog chi tiết */}
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
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <DialogTitle>Chi tiết bài viết</DialogTitle>
                            <Button size="sm" variant="outline" onClick={refreshPostDetail} disabled={detailLoading}>Làm mới</Button>
                        </div>
                    </DialogHeader>
                    {detailLoading ? (
                        <div className="flex items-center text-gray-500"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Đang tải...</div>
                    ) : detailPost ? (
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={isValidHttpUrl(detailPost.author?.avatarUrl) ? detailPost.author?.avatarUrl : undefined} />
                                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">{(detailPost.author?.fullName || "U").charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="font-semibold">{detailPost.author?.fullName}</div>
                                    <div className="text-sm text-gray-500">{formatDateAbsolute(detailPost.createdAt)}</div>
                                </div>
                            </div>
                            <div>
                                <div className="text-lg font-medium mb-2">{detailPost.title}</div>
                                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{detailPost.contentMarkdown || detailPost.content || ""}</div>
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
                                }} className="flex items-center space-x-2 text-gray-600">
                                    <Heart className={`h-5 w-5 ${detailPost.isLiked ? 'fill-current text-red-500' : ''}`} />
                                    <span className="text-sm">{detailPost.likeCount || 0}</span>
                                </button>
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <MessageCircle className="h-5 w-5" />
                                    <span className="text-sm">{detailPost.commentCount || (detailPost.comments?.length || 0)}</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="font-semibold">Bình luận</div>
                                {(detailPost.comments || []).length === 0 ? (
                                    <div className="text-sm text-gray-500">Chưa có bình luận nào</div>
                                ) : (
                                    renderComments(buildCommentTree(detailPost.comments))
                                )}
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
        </div>
    );
}
