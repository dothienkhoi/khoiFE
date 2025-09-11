"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { FileText, Send, Heart, MessageCircle, MoreHorizontal, RefreshCw, Loader2, X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/utils";
import {
    getGroupPosts,
    createGroupPost,
    togglePostLike,
    getPostDetail,
    addPostComment,
    getGroupDetails,
    updatePost,
    deletePost,
    uploadPostAttachments,
} from "@/lib/customer-api-client";

interface Comment {
    commentId: number;
    content: string;
    author: { userId: string; fullName: string; avatarUrl?: string };
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
    isLiked?: boolean;
    attachments?: Array<{ id: string; name: string; type: string; size: number; url: string }>;
    comments?: Comment[];
}

interface CommunityPostsInterfaceProps {
    groupId: string;
    groupName: string;
    groupAvatar?: string;
}

export function CommunityPostsInterface({ groupId, groupName }: CommunityPostsInterfaceProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPostTitle, setNewPostTitle] = useState("");
    const [newPostContent, setNewPostContent] = useState("");
    const [isCreatingPost, setIsCreatingPost] = useState(false);
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);
    const [filePreviews, setFilePreviews] = useState<{ url: string; type: string }[]>([]);
    const [editorKey, setEditorKey] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMorePosts, setHasMorePosts] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailPost, setDetailPost] = useState<any>(null);
    const [detailStartIndex, setDetailStartIndex] = useState<number | null>(null);
    const attachmentsRef = useRef<HTMLDivElement | null>(null);
    const [detailIndex, setDetailIndex] = useState(0);
    const [detailNewComment, setDetailNewComment] = useState("");
    const [replyTextMap, setReplyTextMap] = useState<Record<number, string>>({});
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [editingContent, setEditingContent] = useState("");
    const [editingFiles, setEditingFiles] = useState<File[]>([]);
    const [deletingPost, setDeletingPost] = useState<Post | null>(null);
    const [groupOwnerIds, setGroupOwnerIds] = useState<Set<string>>(new Set());
    const [likePending, setLikePending] = useState<Record<string, boolean>>({});
    const [likeStatus, setLikeStatus] = useState<Record<string, boolean>>({});
    // Limits for attachments
    const MAX_IMAGES = 5;
    const MAX_VIDEOS = 2;
    const MAX_FILES = 5;

    const unlockScroll = () => {
        try {
            document.body.style.overflow = "";
            document.documentElement.style.overflow = "";
            document.body.classList.remove("overflow-hidden");
            document.documentElement.classList.remove("overflow-hidden");
            document.body.style.pointerEvents = "";
            document.documentElement.style.pointerEvents = "";
        } catch { }
    };

    useEffect(() => () => unlockScroll(), []);
    useEffect(() => {
        const anyOverlayOpen = !!editingPost || !!deletingPost || !!detailOpen;
        if (!anyOverlayOpen) {
            const id = setTimeout(unlockScroll, 0);
            return () => clearTimeout(id);
        }
    }, [editingPost, deletingPost, detailOpen]);

    const isValidHttpUrl = (value?: string) => {
        if (!value || typeof value !== "string") return false;
        try {
            const u = new URL(value);
            return u.protocol === "http:" || u.protocol === "https:";
        } catch {
            return false;
        }
    };
    const isImageType = (mimeOrName: string) => (/^image\//i.test(mimeOrName)) || /(\.png|\.jpe?g|\.gif|\.webp|\.bmp|\.svg)$/i.test(mimeOrName);
    const isVideoType = (mimeOrName: string) => (/^video\//i.test(mimeOrName)) || /(\.mp4|\.webm|\.ogg|\.mkv)$/i.test(mimeOrName);

    const getInitials = (name?: string) => {
        if (!name || typeof name !== "string") return "U";
        const parts = name.trim().split(/\s+/);
        const first = parts[0]?.[0] || "";
        const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
        return (first + last).toUpperCase() || "U";
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatDateAbsolute = (dateString: string) => {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return "";
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
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
            replies: Array.isArray(c.replies) ? c.replies.map(normalize) : [],
        });
        if (hasNested) return flat.map(normalize);
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

    const openPostDetail = async (post: Post, startIndex?: number) => {
        try {
            setDetailOpen(true);
            setDetailLoading(true);
            setDetailPost(null);
            setDetailStartIndex(typeof startIndex === 'number' ? startIndex : null);
            const res = await getPostDetail(post.postId.toString());
            if (res.success && res.data) {
                setDetailPost(res.data);
            } else {
                toast.error(res.message || "Không thể tải chi tiết bài viết");
            }
        } catch (e: any) {
            handleApiError(e, "Không thể tải chi tiết bài viết");
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        if (detailOpen && detailStartIndex != null) {
            const t = setTimeout(() => {
                attachmentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 150);
            return () => clearTimeout(t);
        }
    }, [detailOpen, detailStartIndex]);

    useEffect(() => {
        if (detailOpen) {
            setDetailIndex(detailStartIndex != null ? detailStartIndex : 0);
        }
    }, [detailOpen, detailStartIndex]);

    const goPrevAttachment = () => {
        const atts = detailPost?.attachments || [];
        const media = atts.filter((att: any) => {
            const type = (att.type || "").toLowerCase();
            const url = att.url || "";
            return type.includes("image") || /(\.png|\.jpe?g|\.gif|\.webp|\.bmp|\.svg)$/i.test(url) || type.includes("video") || /(\.mp4|\.webm|\.ogg|\.mkv)$/i.test(url);
        });
        if (media.length === 0) return;
        setDetailIndex((prev) => (prev - 1 + media.length) % media.length);
    };
    const goNextAttachment = () => {
        const atts = detailPost?.attachments || [];
        const media = atts.filter((att: any) => {
            const type = (att.type || "").toLowerCase();
            const url = att.url || "";
            return type.includes("image") || /(\.png|\.jpe?g|\.gif|\.webp|\.bmp|\.svg)$/i.test(url) || type.includes("video") || /(\.mp4|\.webm|\.ogg|\.mkv)$/i.test(url);
        });
        if (media.length === 0) return;
        setDetailIndex((prev) => (prev + 1) % media.length);
    };

    const fetchPosts = async (page = 1, refresh = false) => {
        try {
            if (refresh) setIsRefreshing(true);
            setIsLoadingPosts(true);
            const response = await getGroupPosts(groupId, page, 10);
            if (response.success && response.data) {
                const items = response.data.items || [];
                const toBool = (v: any) => v === true || v === 1 || v === "1" || String(v).toLowerCase?.() === "true";
                const likedCache: Record<string, boolean> = (() => {
                    try {
                        const raw = localStorage.getItem("fb_liked_posts");
                        return raw ? JSON.parse(raw) : {};
                    } catch {
                        return {};
                    }
                })();
                const mapped: Post[] = items.map((p: any) => {
                    const postId = p.postId;
                    const serverIsLiked = toBool(p.isLikedByCurrentUser ?? p.isLiked ?? p.IsLiked ?? p.LikedByCurrentUser);
                    const cachedIsLiked = likedCache[postId];
                    const finalIsLiked = cachedIsLiked !== undefined ? !!cachedIsLiked : serverIsLiked;
                    const rawAttachments = p.attachments || p.Attachments || p.files || p.Files || [];
                    const attachments = Array.isArray(rawAttachments)
                        ? rawAttachments.map((a: any) => ({
                            id: a.id || a.fileId || a.FileID || `${postId}-${Math.random()}`,
                            name: a.fileName || a.name || a.FileName || "Tệp đính kèm",
                            type: a.fileType || a.type || a.FileType || "file",
                            size: a.fileSize || a.size || a.FileSize || 0,
                            url: a.url || a.storageUrl || a.Url || a.StorageUrl || a.storageURL || "",
                        }))
                        : [];
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
                            avatarUrl: p.author?.avatarUrl || p.authorAvatar || p.author?.avatarURL,
                        },
                        createdAt: p.createdAt,
                        likeCount: p.likeCount ?? p.LikeCount ?? 0,
                        commentCount: p.commentCount ?? p.CommentCount ?? 0,
                        isLiked: finalIsLiked,
                        attachments,
                    };
                });
                if (page === 1 || refresh) {
                    setPosts(mapped);
                    const newLikeStatus: Record<string, boolean> = {};
                    mapped.forEach((post) => (newLikeStatus[post.id] = !!post.isLiked));
                    setLikeStatus(newLikeStatus);
                } else {
                    setPosts((prev) => [...prev, ...mapped]);
                    setLikeStatus((prev) => {
                        const updated = { ...prev };
                        mapped.forEach((post) => (updated[post.id] = !!post.isLiked));
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
        } catch (e: any) {
            handleApiError(e, "Không thể tải bài viết");
            setPosts([]);
            setHasMorePosts(false);
        } finally {
            setIsLoadingPosts(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPosts(1, true);
    }, [groupId]);

    useEffect(() => {
        const loadOwners = async () => {
            try {
                const res = await getGroupDetails(groupId);
                if (res?.success && res?.data?.members) {
                    const owners = new Set<string>();
                    (res.data.members || []).forEach((m: any) => {
                        const role = m.role || m.Role;
                        if (role && ["admin", "owner"].includes(String(role).toLowerCase())) owners.add(m.userId || m.UserID);
                    });
                    setGroupOwnerIds(owners);
                } else setGroupOwnerIds(new Set());
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
                content: newPostContent.trim(),
                contentMarkdown: newPostContent.trim(),
                attachmentFileIds: uploadedFileIds,
            };
            const response = await createGroupPost(groupId, payload);
            if (response.success) {
                let createdAttachments: any[] = [];
                try {
                    const newPostId = response.data?.postId || response.data?.id;
                    if (newPostId && selectedFiles.length > 0) {
                        const up = await uploadPostAttachments(newPostId, selectedFiles);
                        if (up?.success && Array.isArray(up.data)) {
                            createdAttachments = up.data.map((a: any) => ({
                                id: a.fileId || a.id,
                                name: a.fileName || a.name,
                                type: a.fileType || a.type,
                                size: a.fileSize || a.size,
                                url: a.storageUrl || a.url,
                            }));
                        } else throw new Error(up?.message || "Upload thất bại");
                    }
                } catch (err: any) {
                    // Nếu upload thất bại vì video quá lớn hoặc server yêu cầu định danh trường khác, vẫn giữ bài nhưng báo nhẹ
                    toast.error(err?.message || "Đã đăng bài nhưng tải tệp đính kèm thất bại");
                }
                toast.success("Đăng bài thành công!");
                if (response.data) {
                    const tempPost: Post = {
                        id: String(response.data.postId || response.data.id || Date.now()),
                        postId: response.data.postId || response.data.id || Date.now(),
                        title: payload.title,
                        content: payload.content,
                        contentMarkdown: payload.contentMarkdown,
                        author: { id: "", userId: "", name: "", fullName: "", displayName: "" },
                        createdAt: new Date().toISOString(),
                        likeCount: 0,
                        commentCount: 0,
                        attachments: createdAttachments,
                    } as any;
                    setPosts((prev) => [tempPost, ...prev]);
                }
                setNewPostTitle("");
                setNewPostContent("");
                setSelectedFiles([]);
                setUploadedFileIds([]);
                setEditorKey((k) => k + 1);
                fetchPosts(1, true);
            } else toast.error(response.message || "Không thể đăng bài");
        } catch (e: any) {
            handleApiError(e, "Không thể đăng bài");
        } finally {
            setIsCreatingPost(false);
        }
    };

    useEffect(() => {
        const urls: { url: string; type: string }[] = [];
        const created: string[] = [];
        selectedFiles.forEach((f) => {
            try {
                const url = URL.createObjectURL(f);
                urls.push({ url, type: f.type || "" });
                created.push(url);
            } catch { }
        });
        setFilePreviews(urls);
        return () => {
            created.forEach((u) => {
                try {
                    URL.revokeObjectURL(u);
                } catch { }
            });
        };
    }, [selectedFiles]);

    // Prefill edit dialog when opening
    useEffect(() => {
        if (editingPost) {
            setEditingTitle(editingPost.title || "");
            setEditingContent(editingPost.contentMarkdown || (editingPost as any).content || "");
            setEditingFiles([]);
        }
    }, [editingPost]);

    const handleToggleLike = async (post: Post) => {
        if (likePending[post.id]) return;
        setLikePending((p) => ({ ...p, [post.id]: true }));
        const currentIsLiked = post.isLiked;
        const newIsLiked = !currentIsLiked;
        const newLikeCount = Math.max(0, (post.likeCount || 0) + (newIsLiked ? 1 : -1));
        setLikeStatus((p) => ({ ...p, [post.id]: newIsLiked }));
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, isLiked: newIsLiked, likeCount: newLikeCount } : p)));
        try {
            const res = await togglePostLike(post.postId.toString());
            if (!res.success) {
                setLikeStatus((p) => ({ ...p, [post.id]: !!currentIsLiked }));
                setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, isLiked: currentIsLiked, likeCount: post.likeCount } : p)));
                toast.error(res.message || "Không thể thao tác thích/bỏ thích");
            } else {
                try {
                    const raw = localStorage.getItem("fb_liked_posts");
                    const cache = raw ? JSON.parse(raw) : {};
                    cache[post.postId] = newIsLiked;
                    localStorage.setItem("fb_liked_posts", JSON.stringify(cache));
                } catch { }
            }
        } catch (e: any) {
            setLikeStatus((p) => ({ ...p, [post.id]: !!currentIsLiked }));
            setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, isLiked: currentIsLiked, likeCount: post.likeCount } : p)));
            handleApiError(e, "Không thể thao tác thích/bỏ thích");
        } finally {
            setLikePending((p) => ({ ...p, [post.id]: false }));
        }
    };

    const toggleComments = async (post: Post) => openPostDetail(post);
    const handleLoadMore = () => {
        if (hasMorePosts && !isLoadingPosts) fetchPosts(currentPage + 1);
    };
    const handleRefresh = () => fetchPosts(1, true);

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
                            <div className="text-sm font-medium text-black dark:text-white">
                                {c.author?.fullName || c.author?.displayName || c.author?.name || "Người dùng"}
                            </div>
                            <div className="text-xs text-gray-500">{formatDateAbsolute(c.createdAt)}</div>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{c.content}</div>
                        <div className="flex items-center space-x-2 mt-1">
                            <Input
                                value={replyTextMap[c.commentId] || ""}
                                onChange={(e) => setReplyTextMap((prev) => ({ ...prev, [c.commentId]: e.target.value }))}
                                placeholder="Trả lời bình luận..."
                                className="h-7 text-xs px-2"
                            />
                            <Button
                                size="sm"
                                className="h-7 px-3 text-xs"
                                onClick={async () => {
                                    const content = (replyTextMap[c.commentId] || "").trim();
                                    if (!content) return;
                                    try {
                                        const res = await addPostComment((detailPost.postId || detailPost.id).toString(), {
                                            content,
                                            parentCommentId: c.commentId,
                                        });
                                        if (res.success) {
                                            const detail = await getPostDetail((detailPost.postId || detailPost.id).toString());
                                            if (detail.success) setDetailPost(detail.data);
                                            setReplyTextMap((prev) => ({ ...prev, [c.commentId]: "" }));
                                        } else toast.error(res.message || "Không thể trả lời");
                                    } catch (err: any) {
                                        handleApiError(err, "Không thể trả lời");
                                    }
                                }}
                            >
                                Gửi
                            </Button>
                        </div>
                        {c.replies && c.replies.length > 0 && renderComments(c.replies, level + 1)}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-2xl mx-auto p-6 space-y-6">
                <div className="rounded-xl p-5 border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 shadow-sm">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tạo bài viết trong {groupName}</h2>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Chia sẻ nội dung cùng mọi người trong cộng đồng</p>
                        </div>
                    </div>
                </div>

                <Card className="border border-gray-200 dark:border-gray-700 transition-all duration-200 shadow-sm bg-white dark:bg-gray-900">
                    <CardContent className="p-4">
                        <div className="space-y-3">
                            <Input
                                placeholder="Tiêu đề bài viết"
                                value={newPostTitle}
                                onChange={(e) => setNewPostTitle(e.target.value)}
                                className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-base focus:border-gray-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-gray-100 dark:focus:ring-blue-900/20 transition-all duration-200 text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                disabled={isCreatingPost}
                            />
                            <input
                                type="file"
                                id="file-upload"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    const incoming = Array.from(e.target.files || []);
                                    if (incoming.length === 0) return;
                                    const currentImages = selectedFiles.filter(f => isImageType(f.type || f.name)).length;
                                    const currentVideos = selectedFiles.filter(f => isVideoType(f.type || f.name)).length;
                                    const currentFiles = selectedFiles.filter(f => !isImageType(f.type || f.name) && !isVideoType(f.type || f.name)).length;
                                    const accepted: File[] = [];
                                    let img = currentImages;
                                    let vid = currentVideos;
                                    let oth = currentFiles;
                                    for (const f of incoming) {
                                        if (isImageType(f.type || f.name)) {
                                            if (img < MAX_IMAGES) { accepted.push(f); img++; }
                                        } else if (isVideoType(f.type || f.name)) {
                                            if (vid < MAX_VIDEOS) { accepted.push(f); vid++; }
                                        } else {
                                            if (oth < MAX_FILES) { accepted.push(f); oth++; }
                                        }
                                    }
                                    const rejected = incoming.length - accepted.length;
                                    if (rejected > 0) {
                                        toast.error(`Vượt quá giới hạn: tối đa ${MAX_IMAGES} ảnh, ${MAX_VIDEOS} video, ${MAX_FILES} file.`);
                                    }
                                    setSelectedFiles((prev) => [...prev, ...accepted]);
                                }}
                            />
                            <RichTextEditor
                                key={editorKey}
                                content={newPostContent}
                                onChange={setNewPostContent}
                                placeholder={`Nội dung chia sẻ với cộng đồng ${groupName}...`}
                                disabled={isCreatingPost}
                            />
                            {selectedFiles.length > 0 && (() => {
                                const images = selectedFiles.map((f, i) => ({ f, i })).filter(x => isImageType(x.f.type || x.f.name));
                                const videos = selectedFiles.map((f, i) => ({ f, i })).filter(x => isVideoType(x.f.type || x.f.name));
                                const others = selectedFiles.map((f, i) => ({ f, i })).filter(x => !isImageType(x.f.type || x.f.name) && !isVideoType(x.f.type || x.f.name));
                                return (
                                    <div className="space-y-4 mb-4">
                                        {images.length > 0 && (
                                            <div>
                                                <div className="text-xs mb-2 text-black dark:text-gray-300">Ảnh ({images.length}/{MAX_IMAGES})</div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    {images.map(({ f, i }) => {
                                                        const preview = filePreviews[i];
                                                        return (
                                                            <div key={`img-${i}`} className="relative group rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-800">
                                                                {preview?.url && <img src={preview.url} alt={f.name} className="w-full h-32 object-cover" />}
                                                                <button onClick={() => { setSelectedFiles(prev => prev.filter((_, idx) => idx !== i)); setUploadedFileIds(prev => prev.filter((_, idx) => idx !== i)); }} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                        {videos.length > 0 && (
                                            <div>
                                                <div className="text-xs mb-2 text-black dark:text-gray-300">Video ({videos.length}/{MAX_VIDEOS})</div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    {videos.map(({ f, i }) => {
                                                        const preview = filePreviews[i];
                                                        return (
                                                            <div key={`vid-${i}`} className="relative group rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-800">
                                                                {preview?.url && <video src={preview.url} className="w-full h-32" controls />}
                                                                <button onClick={() => { setSelectedFiles(prev => prev.filter((_, idx) => idx !== i)); setUploadedFileIds(prev => prev.filter((_, idx) => idx !== i)); }} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                        {others.length > 0 && (
                                            <div>
                                                <div className="text-xs mb-2 text-black dark:text-gray-300">Tệp ({others.length}/{MAX_FILES})</div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {others.map(({ f, i }) => (
                                                        <div key={`file-${i}`} className="relative group p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                                                            <div className="flex items-center space-x-2">
                                                                <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                                <span className="text-xs text-black dark:text-gray-300 truncate font-medium">{f.name}</span>
                                                            </div>
                                                            <div className="text-xs text-black dark:text-gray-400 mt-1">{formatFileSize(f.size)}</div>
                                                            <button onClick={() => { setSelectedFiles(prev => prev.filter((_, idx) => idx !== i)); setUploadedFileIds(prev => prev.filter((_, idx) => idx !== i)); }} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                            <div className="flex items-center justify-between pt-2">
                                <div className="text-xs text-black dark:text-gray-500">{newPostTitle.length}/100 • {newPostContent.length}/2000</div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => document.getElementById("file-upload")?.click()}
                                        className="text-black dark:text-white"
                                    >
                                        <FileText className="h-4 w-4 mr-2" /> Thêm tệp
                                    </Button>
                                    <Button
                                        onClick={handleCreatePost}
                                        disabled={
                                            isCreatingPost ||
                                            !newPostContent.trim() ||
                                            !newPostTitle.trim() ||
                                            newPostTitle.length > 100 ||
                                            newPostContent.length > 2000
                                        }
                                        className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 dark:from-blue-600 dark:to-purple-600 dark:hover:from-blue-700 dark:hover:to-purple-700 text-white shadow-sm hover:shadow-md transition-all duration-200 px-6 py-2 rounded-lg font-medium"
                                    >
                                        {isCreatingPost ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                                        Đăng bài
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
                                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                    Hãy là người đầu tiên chia sẻ điều gì đó thú vị với cộng đồng {groupName}!
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {posts.map((post) => (
                        <Card key={post.id} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md dark:shadow-lg dark:hover:shadow-xl transition-all duration-200 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-start space-x-3 mb-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={isValidHttpUrl(post.author.avatarUrl) ? post.author.avatarUrl : undefined} alt={post.author.fullName || post.author.displayName || "User"} />
                                        <AvatarFallback>{getInitials(post.author.fullName || post.author.displayName || post.author.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <h3 className="font-bold text-black dark:text-white text-lg">{post.author.fullName || post.author.displayName || post.author.name || "Người dùng"}</h3>
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

                                <div className="mb-6">
                                    <h4 className="text-xl font-bold text-black dark:text-white mb-3">{post.title}</h4>
                                    <div
                                        className="text-black dark:text-gray-300 text-base leading-relaxed prose prose-sm dark:prose-invert max-w-none [&_p]:text-inherit [&_div]:text-inherit"
                                        dangerouslySetInnerHTML={{ __html: post.content || post.contentMarkdown || (post as any).contentSnippet || "" }}
                                    />
                                    {Array.isArray(post.attachments) && post.attachments.length > 0 && (() => {
                                        const medias = post.attachments.filter(a => isImageType(a.type || a.url) || isVideoType(a.type || a.url));
                                        const files = post.attachments.filter(a => !isImageType(a.type || a.url) && !isVideoType(a.type || a.url));
                                        const count = medias.length;
                                        const renderTile = (att: any, showOverlay: boolean = false, overlayText: string = "", aspectClass: string = "aspect-square", onOverlayClick?: () => void) => {
                                            const isImg = isImageType(att.type || att.url);
                                            return (
                                                <div key={`media-${att.id}`} className={`${aspectClass} relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer`} onClick={() => openPostDetail(post)}>
                                                    {isImg ? (
                                                        <img src={att.url} alt={att.name} className="absolute inset-0 w-full h-full object-cover" />
                                                    ) : (
                                                        <video className="absolute inset-0 w-full h-full object-cover" muted playsInline preload="metadata">
                                                            <source src={att.url} />
                                                        </video>
                                                    )}
                                                    {showOverlay && (
                                                        <div onClick={(e) => { e.stopPropagation(); onOverlayClick ? onOverlayClick() : openPostDetail(post); }} className="absolute inset-0 bg-black/50 text-white text-2xl font-semibold flex items-center justify-center select-none">{overlayText}</div>
                                                    )}
                                                </div>
                                            );
                                        };

                                        const renderGrid = () => {
                                            if (count === 1) {
                                                const [a1] = medias;
                                                return (
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {renderTile(a1, false, "", "aspect-video")}
                                                    </div>
                                                );
                                            }
                                            if (count === 2) {
                                                const [a1, a2] = medias;
                                                return (
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {renderTile(a1, false, "", "aspect-[3/2]")}
                                                        {renderTile(a2, false, "", "aspect-[3/2]")}
                                                    </div>
                                                );
                                            }
                                            if (count === 3) {
                                                const [a1, a2, a3] = medias;
                                                return (
                                                    <div className="grid grid-cols-3 grid-rows-2 gap-3">
                                                        <div className="col-span-2 row-span-2">{renderTile(a1, false, "", "aspect-square")}</div>
                                                        {renderTile(a2, false, "", "aspect-square")}
                                                        {renderTile(a3, false, "", "aspect-square")}
                                                    </div>
                                                );
                                            }
                                            // 4 or more: show first 4 in 2x2, overlay +N on last if more than 4
                                            const firstFour = medias.slice(0, 4);
                                            const remaining = Math.max(0, count - 4);
                                            return (
                                                <div className="grid grid-cols-2 gap-3">
                                                    {firstFour.map((att, idx) => (
                                                        renderTile(
                                                            att,
                                                            idx === 3,
                                                            remaining > 0 ? `+${remaining}` : '+',
                                                            "aspect-square",
                                                            idx === 3 ? () => openPostDetail(post, 4) : undefined
                                                        )
                                                    ))}
                                                </div>
                                            );
                                        };

                                        return (
                                            <div className="mt-4 space-y-4">
                                                {count > 0 && renderGrid()}
                                                {files.length > 0 && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {files.map((att) => (
                                                            <a key={`file-${att.id}`} href={att.url} target="_blank" rel="noreferrer" className="group block p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                                                <div className="flex items-center space-x-2">
                                                                    <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                                    <span className="text-xs truncate text-black dark:text-gray-300">{att.name}</span>
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 mt-1">{att.type || "file"} • {formatFileSize(att.size || 0)}</div>
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center space-x-6">
                                        <button
                                            onClick={() => handleToggleLike(post)}
                                            disabled={!!likePending[post.id]}
                                            aria-pressed={post.isLiked}
                                            title={post.isLiked ? "Bỏ thích" : "Thích"}
                                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-black dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 ${likePending[post.id] ? "pointer-events-none opacity-60" : ""
                                                }`}
                                        >
                                            {(() => {
                                                const currentLikeStatus = likeStatus[post.id] !== undefined ? likeStatus[post.id] : post.isLiked;
                                                return currentLikeStatus ? <Heart className="h-5 w-5 fill-current text-red-500" /> : <Heart className="h-5 w-5 text-gray-400" />;
                                            })()}
                                            <span className="text-sm font-medium">{post.isLiked ? "Bỏ thích" : "Thích"}</span>
                                            {post.likeCount > 0 && <span className="text-sm text-gray-600 dark:text-gray-400">({post.likeCount})</span>}
                                        </button>
                                        <button
                                            onClick={() => toggleComments(post)}
                                            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-black dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-200"
                                        >
                                            <MessageCircle className="h-5 w-5" />
                                            <span className="text-sm font-medium">Bình luận</span>
                                            {post.commentCount > 0 && <span className="text-sm text-gray-600 dark:text-gray-400">({post.commentCount})</span>}
                                        </button>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {(post as any).author?.userId === (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("auth-storage") || "{}")?.state?.user?.id : undefined) && (
                                            <Badge variant="outline" className="bg-blue-100 dark:bg-blue-600/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-500/30 text-xs px-3 py-1">
                                                Bài của bạn
                                            </Badge>
                                        )}
                                        {(post as any).author?.userId === (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("auth-storage") || "{}")?.state?.user?.id : undefined) && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-2 rounded-lg text-black dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-44 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border border-gray-200 dark:border-gray-700">
                                                    <DropdownMenuItem onClick={() => setEditingPost(post)} className="focus:bg-gray-100 dark:focus:bg-gray-700">
                                                        Chỉnh sửa bài viết
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setDeletingPost(post)} className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/30">
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
                <DialogContent className="w-[88vw] max-w-3xl h-[80vh] p-0 overflow-hidden">
                    <div className="h-full flex flex-col min-h-0">
                        <div className="px-6 pt-4 pb-2 border-b border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur shrink-0">
                            <DialogHeader>
                                <DialogTitle>Chi tiết bài viết</DialogTitle>
                                <DialogDescription className="sr-only">Cửa sổ hiển thị nội dung bài viết và các bình luận.</DialogDescription>
                            </DialogHeader>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 pb-4">
                            {detailLoading ? (
                                <div className="flex items-center text-gray-500">
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Đang tải...
                                </div>
                            ) : detailPost ? (
                                <div className="space-y-4">
                                    {(() => {
                                        const authorName =
                                            (detailPost.author && (detailPost.author.fullName || (detailPost.author as any).displayName)) ||
                                            (detailPost as any).authorName ||
                                            (detailPost as any).authorDisplayName ||
                                            "Người dùng";
                                        const avatarUrl = isValidHttpUrl(detailPost.author?.avatarUrl) ? detailPost.author?.avatarUrl : undefined;
                                        const createdAt = detailPost.createdAt || (detailPost as any).CreatedAt || (detailPost as any).created_date || detailPost.updatedAt || (detailPost as any).UpdatedAt;
                                        // Resolve role label if available
                                        const rawRole =
                                            (detailPost.author && ((detailPost.author as any).role || (detailPost.author as any).memberRole || (detailPost.author as any).groupRole || (detailPost.author as any).roleName)) ||
                                            (detailPost as any).authorRole || (detailPost as any).memberRole || (detailPost as any).role || (detailPost as any).roleName || "";
                                        const isOwner =
                                            (detailPost.author && ((((detailPost.author as any).isOwner) || ((detailPost.author as any).isHost) || ((detailPost.author as any).isGroupOwner)))) ||
                                            (detailPost as any).isOwner || (detailPost as any).isHost || (detailPost as any).isGroupOwner || false;
                                        const isAdmin =
                                            (detailPost.author && ((((detailPost.author as any).isAdmin) || ((detailPost.author as any).isModerator) || ((detailPost.author as any).isManager)))) ||
                                            (detailPost as any).isAdmin || (detailPost as any).isModerator || (detailPost as any).isManager || false;
                                        let roleLabel = "";
                                        const roleStr = String(rawRole || "").toLowerCase();
                                        if (isOwner || roleStr.includes("owner") || roleStr.includes("host") || roleStr.includes("chủ")) roleLabel = "Chủ nhóm";
                                        else if (isAdmin || roleStr.includes("admin") || roleStr.includes("moderator") || roleStr.includes("mod") || roleStr.includes("quản trị")) roleLabel = "Quản trị";
                                        else if (roleStr.includes("member") || roleStr.includes("thành viên") || (detailPost as any).isMember) roleLabel = "Thành viên";
                                        return (
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-9 w-9 shrink-0">
                                                    <AvatarImage src={avatarUrl} alt={authorName} />
                                                    <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="font-semibold flex items-center flex-wrap gap-2 text-white/95">
                                                        <span>{authorName}</span>
                                                        <span className="px-2 py-0.5 rounded-full text-xs bg-purple-600 text-white">{roleLabel}</span>
                                                        {createdAt ? (
                                                            <span className="text-xs text-gray-300">• {formatDateAbsolute(createdAt)}</span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    <div>
                                        <div className="text-lg font-medium mb-2">{detailPost.title}</div>
                                        <div
                                            className="text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none [&_p]:text-inherit [&_div]:text-inherit"
                                            dangerouslySetInnerHTML={{ __html: detailPost.contentMarkdown || detailPost.content || "" }}
                                        />
                                        {Array.isArray(detailPost.attachments) && detailPost.attachments.length > 0 && (
                                            <div className="mt-4">
                                                {(() => {
                                                    const media = (detailPost.attachments || []).filter((a: any) => {
                                                        const type = (a.type || "").toLowerCase();
                                                        const url = a.url || "";
                                                        const name = (a.name || "").toLowerCase();
                                                        const isImg = type.includes("image") || /(\.png|\.jpe?g|\.gif|\.webp|\.bmp|\.svg)$/i.test(url) || /(\.png|\.jpe?g|\.gif|\.webp|\.bmp|\.svg)$/i.test(name);
                                                        const isVid = type.includes("video") || /(\.mp4|\.webm|\.ogg|\.mkv)$/i.test(url) || /(\.mp4|\.webm|\.ogg|\.mkv)$/i.test(name);
                                                        return isImg || isVid;
                                                    });
                                                    const files = (detailPost.attachments || []).filter((a: any) => {
                                                        const type = (a.type || "").toLowerCase();
                                                        const url = a.url || "";
                                                        const name = (a.name || "").toLowerCase();
                                                        const isImage = type.includes("image") || /(\.png|\.jpe?g|\.gif|\.webp|\.bmp|\.svg)$/i.test(url) || /(\.png|\.jpe?g|\.gif|\.webp|\.bmp|\.svg)$/i.test(name);
                                                        const isVideo = type.includes("video") || /(\.mp4|\.webm|\.ogg|\.mkv)$/i.test(url) || /(\.mp4|\.webm|\.ogg|\.mkv)$/i.test(name);
                                                        return !isImage && !isVideo;
                                                    });

                                                    const att = media[detailIndex] || {};
                                                    const type = (att.type || "").toLowerCase();
                                                    const url = att.url || "";
                                                    const name = (att.name || "").toLowerCase();
                                                    const isImage = type.includes("image") || /(\.png|\.jpe?g|\.gif|\.webp|\.bmp|\.svg)$/i.test(url) || /(\.png|\.jpe?g|\.gif|\.webp|\.bmp|\.svg)$/i.test(name);
                                                    const isVideo = type.includes("video") || /(\.mp4|\.webm|\.ogg|\.mkv)$/i.test(url) || /(\.mp4|\.webm|\.ogg|\.mkv)$/i.test(name);
                                                    return (
                                                        <>
                                                            {media.length > 0 && (
                                                                <div ref={attachmentsRef} className="relative w-full max-h-[60vh] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-black/5 dark:bg-white/5">
                                                                    {isImage && att.url && (
                                                                        <img src={att.url} alt={att.name} className="max-h-[60vh] max-w-full w-auto object-contain" />
                                                                    )}
                                                                    {isVideo && att.url && (
                                                                        <video controls className="max-h-[60vh] max-w-full w-auto" preload="metadata">
                                                                            <source src={att.url} />
                                                                        </video>
                                                                    )}
                                                                    {att.url && (
                                                                        <a href={att.url} download className="absolute top-2 right-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white" title="Tải xuống">
                                                                            <Download className="h-5 w-5" />
                                                                        </a>
                                                                    )}
                                                                    <button onClick={goPrevAttachment} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white"><ChevronLeft className="h-5 w-5" /></button>
                                                                    <button onClick={goNextAttachment} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white"><ChevronRight className="h-5 w-5" /></button>
                                                                    <div className="absolute right-2 bottom-2 text-xs px-2 py-1 rounded bg-black/50 text-white">{Math.min(detailIndex + 1, media.length)}/{media.length}</div>
                                                                </div>
                                                            )}
                                                            {files.length > 0 && (
                                                                <div className="mt-3">
                                                                    <div className="text-sm font-medium mb-2">Tệp đính kèm ({files.length})</div>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                        {files.map((f: any, idx: number) => (
                                                                            <a key={`file-${idx}`} href={f.url} download target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                                                <div className="flex items-center space-x-2 min-w-0">
                                                                                    <FileText className="h-4 w-4" />
                                                                                    <div className="flex flex-col min-w-0">
                                                                                        <span className="text-sm truncate">{f.name || 'Tệp đính kèm'}</span>
                                                                                        {f.size ? <span className="text-xs text-gray-500 truncate">{Math.round((f.size / 1024 / 1024) * 10) / 10} MB</span> : null}
                                                                                    </div>
                                                                                </div>
                                                                                <Download className="h-4 w-4 text-blue-600" />
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-6 pt-2">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    setDetailPost((prev: any) => (prev ? { ...prev, isLiked: !prev.isLiked, likeCount: (prev.likeCount || 0) + (prev.isLiked ? -1 : 1) } : prev));
                                                    const res = await togglePostLike((detailPost.postId || detailPost.id).toString());
                                                    if (!res.success) {
                                                        setDetailPost((prev: any) => (prev ? { ...prev, isLiked: !prev.isLiked, likeCount: (prev.likeCount || 0) + (prev.isLiked ? -1 : 1) } : prev));
                                                        toast.error(res.message || "Không thể thích/bỏ thích");
                                                    }
                                                } catch (e: any) {
                                                    handleApiError(e, "Không thể thích/bỏ thích");
                                                }
                                            }}
                                            className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors"
                                        >
                                            {detailPost.isLiked ? <Heart className="h-5 w-5 fill-current text-red-500" /> : <Heart className="h-5 w-5 text-gray-400" />}
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
                                            const tree = buildCommentTree(detailPost.comments || []);
                                            return tree.length === 0 ? <div className="text-sm text-gray-500">Chưa có bình luận nào</div> : renderComments(tree);
                                        })()}
                                        <div className="flex items-center space-x-2">
                                            <Input value={detailNewComment} onChange={(e) => setDetailNewComment(e.target.value)} placeholder="Viết bình luận..." className="flex-1" />
                                            <Button
                                                size="sm"
                                                onClick={async () => {
                                                    const content = detailNewComment.trim();
                                                    if (!content) return;
                                                    try {
                                                        const tempId = Math.floor(Math.random() * 1e9);
                                                        setDetailPost((prev: any) =>
                                                            prev
                                                                ? {
                                                                    ...prev,
                                                                    comments: [
                                                                        ...prev.comments,
                                                                        { commentId: tempId, content, author: prev.author, createdAt: new Date().toISOString(), parentCommentId: null },
                                                                    ],
                                                                }
                                                                : prev
                                                        );
                                                        const res = await addPostComment((detailPost.postId || detailPost.id).toString(), { content });
                                                        if (res.success) {
                                                            const detail = await getPostDetail((detailPost.postId || detailPost.id).toString());
                                                            if (detail.success) setDetailPost(detail.data);
                                                            setDetailNewComment("");
                                                        } else toast.error(res.message || "Không thể bình luận");
                                                    } catch (err: any) {
                                                        handleApiError(err, "Không thể bình luận");
                                                    }
                                                }}
                                            >
                                                Gửi
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">Không có dữ liệu</div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingPost} onOpenChange={(open) => { if (!open) setEditingPost(null); }}>
                <DialogContent className="max-w-2xl h-[80vh] p-0 overflow-hidden">
                    <div className="h-full flex flex-col min-w-0 min-h-0">
                        <div className="px-6 pt-4 pb-2 border-b border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur shrink-0">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-semibold truncate" title="Chỉnh sửa bài viết">Chỉnh sửa bài viết</DialogTitle>
                                <DialogDescription className="sr-only">Biểu mẫu chỉnh sửa tiêu đề và nội dung bài viết.</DialogDescription>
                            </DialogHeader>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-3 min-w-0 min-h-0">
                            <Input
                                placeholder="Tiêu đề bài viết"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-base focus:border-gray-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-gray-100 dark:focus:ring-blue-900/20 transition-all duration-200 text-black dark:text-white text-left"
                            />
                            {/* Existing attachments preview with delete controls */}
                            {editingPost?.attachments && editingPost.attachments.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-xs text-black dark:text-gray-300">Tệp hiện có ({editingPost.attachments.length})</div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {editingPost.attachments.map((att: any) => {
                                            const type = (att.type || "").toLowerCase();
                                            const url = att.url || "";
                                            const isImage = type.includes("image") || /(\.png|\.jpe?g|\.gif|\.webp|\.bmp|\.svg)$/i.test(url);
                                            const isVideo = type.includes("video") || /(\.mp4|\.webm|\.ogg|\.mkv)$/i.test(url);
                                            const onDelete = async () => {
                                                if (!editingPost) return;
                                                if (!confirm("Xóa tệp đính kèm này?")) return;
                                                try {
                                                    const { deletePostAttachment } = await import("@/lib/customer-api-client");
                                                    const res = await deletePostAttachment((editingPost.postId || editingPost.id).toString(), att.id || att.fileId);
                                                    if (res.success) {
                                                        setEditingPost({
                                                            ...editingPost,
                                                            attachments: editingPost.attachments.filter((x: any) => (x.id || x.fileId) !== (att.id || att.fileId)),
                                                        } as any);
                                                    } else {
                                                        toast.error(res.message || "Không thể xóa tệp");
                                                    }
                                                } catch (e: any) {
                                                    handleApiError(e, "Không thể xóa tệp");
                                                }
                                            };
                                            if (isImage && att.url) return (
                                                <div key={`exist-img-${att.id}`} className="relative">
                                                    <a href={att.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
                                                        <img src={att.url} className="w-full h-32 object-cover" />
                                                    </a>
                                                    <button type="button" onClick={onDelete} className="absolute top-1 right-1 h-6 w-6 inline-flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            );
                                            if (isVideo && att.url) return (
                                                <div key={`exist-vid-${att.id}`} className="relative">
                                                    <video controls className="w-full h-32 rounded-lg border border-gray-200 dark:border-gray-600">
                                                        <source src={att.url} />
                                                    </video>
                                                    <button type="button" onClick={onDelete} className="absolute top-1 right-1 h-6 w-6 inline-flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            );
                                            return (
                                                <div key={`exist-file-${att.id}`} className="relative">
                                                    <a href={att.url} target="_blank" rel="noreferrer" className="group block p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                                                        <div className="flex items-center space-x-2">
                                                            <FileText className="h-4 w-4" />
                                                            <span className="text-xs truncate">{att.name}</span>
                                                        </div>
                                                    </a>
                                                    <button type="button" onClick={onDelete} className="absolute top-1 right-1 h-6 w-6 inline-flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {/* removed top add-file section as requested */}
                            <RichTextEditor
                                content={editingContent}
                                onChange={setEditingContent}
                                placeholder="Nội dung bài viết..."
                                className="w-full text-left [&_.ProseMirror]:text-left [&_.ProseMirror]:leading-relaxed"
                            />
                            {editingFiles.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {editingFiles.map((f, idx) => {
                                        const isImage = (f.type || "").startsWith("image");
                                        const isVideo = (f.type || "").startsWith("video");
                                        const url = URL.createObjectURL(f);
                                        return (
                                            <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                                                {isImage && <img src={url} className="w-full h-32 object-cover" />}
                                                {isVideo && <video src={url} className="w-full h-32" controls />}
                                                {!isImage && !isVideo && <div className="p-3 text-xs">{f.name}</div>}
                                                <button onClick={() => setEditingFiles((prev) => prev.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <div className="flex justify-end items-center gap-2 pt-2">
                                <input type="file" id="edit-file-upload-footer" multiple className="hidden" onChange={(e) => { const files = Array.from(e.target.files || []); setEditingFiles((prev) => [...prev, ...files]); }} />
                                <Button type="button" variant="outline" onClick={() => document.getElementById("edit-file-upload-footer")?.click()}>
                                    <FileText className="h-4 w-4 mr-2" /> Thêm tệp
                                </Button>
                                <Button variant="outline" onClick={() => setEditingPost(null)}>
                                    Hủy
                                </Button>
                                <Button
                                    onClick={async () => {
                                        if (!editingPost) return;
                                        const updated = { title: editingTitle.trim(), content: editingContent.trim() };
                                        if (!updated.title || !updated.content) {
                                            toast.error("Tiêu đề và nội dung không được để trống");
                                            return;
                                        }
                                        const prevPosts = posts;
                                        setPosts((prev) => prev.map((p) => (p.id === editingPost.id ? { ...p, title: updated.title, content: updated.content, contentMarkdown: updated.content } : p)));
                                        try {
                                            const res = await updatePost(editingPost.postId, { title: updated.title, contentMarkdown: updated.content });
                                            if (!res.success) {
                                                setPosts(prevPosts);
                                                toast.error(res.message || "Không thể cập nhật bài viết");
                                                return;
                                            }
                                            if (editingFiles.length > 0) {
                                                const up = await uploadPostAttachments(editingPost.postId, editingFiles);
                                                if (!up?.success) toast.error(up?.message || "Tải tệp đính kèm (khi chỉnh sửa) thất bại");
                                            }
                                            toast.success("Cập nhật bài viết thành công");
                                            fetchPosts(1, true);
                                        } catch (e: any) {
                                            setPosts(prevPosts);
                                            handleApiError(e, "Không thể cập nhật bài viết");
                                            return;
                                        } finally {
                                            setEditingPost(null);
                                            setEditingTitle("");
                                            setEditingContent("");
                                            setEditingFiles([]);
                                            unlockScroll();
                                        }
                                    }}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                >
                                    Lưu thay đổi
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingPost} onOpenChange={(open) => { if (!open) setDeletingPost(null); }}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc muốn xóa bài viết này?</AlertDialogTitle>
                        <AlertDialogDescription>Hành động này không thể hoàn tác. Bài viết sẽ bị xóa khỏi cộng đồng.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={async () => {
                            if (!deletingPost) return;
                            const previous = posts;
                            setPosts((prev) => prev.filter((p) => p.id !== deletingPost.id));
                            setDeletingPost(null);
                            try {
                                const res = await deletePost(deletingPost.postId);
                                if (!res.success) throw new Error(res.message || "Xóa thất bại");
                                toast.success("Đã xóa bài viết");
                            } catch (e: any) {
                                setPosts(previous);
                                handleApiError(e, "Xóa bài viết thất bại");
                            } finally {
                                setDeletingPost(null);
                                unlockScroll();
                            }
                        }} className="bg-red-600 hover:bg-red-700 text-white">
                            Xóa bài viết
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

