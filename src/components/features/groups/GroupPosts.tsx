"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Plus,
    FileText,
    Calendar,
    User,
    MoreHorizontal,
    Edit,
    Trash2,
    Heart,
    MessageCircle,
    Share2,
    Image as ImageIcon,
    Paperclip,
    Send,
    X,
    ArrowLeft,
    RefreshCw,
    Filter,
    ThumbsUp,
    Eye
} from "lucide-react";
import { getGroupPosts, createGroupPost, uploadFiles, togglePostLike, addPostComment, getPostDetail } from "@/lib/customer-api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Use the Post interface from types
import { Post, Comment } from "@/types/customer.types";

interface GroupPostsProps {
    groupId: string;
    groupName: string;
}

export function GroupPosts({ groupId, groupName }: GroupPostsProps) {
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newPost, setNewPost] = useState({
        title: "",
        contentMarkdown: "",
        attachmentFileIds: [] as string[]
    });
    const [isCreating, setIsCreating] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [filePreviews, setFilePreviews] = useState<{ url: string; name: string; size: number; type: string }[]>([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(10);
    const [hasMore, setHasMore] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [authorId, setAuthorId] = useState("");
    const [sortBy, setSortBy] = useState("newest");

    // New states for interactions
    const [showCommentDialog, setShowCommentDialog] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string>("");
    const [newComment, setNewComment] = useState("");
    const [isCommenting, setIsCommenting] = useState(false);
    const [showPostDetail, setShowPostDetail] = useState(false);
    const [selectedPostDetail, setSelectedPostDetail] = useState<any>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    // Load posts when component mounts or groupId changes
    useEffect(() => {
        loadPosts();
    }, [groupId, pageNumber, searchTerm, authorId, sortBy]);

    const loadPosts = async () => {
        try {
            setIsLoading(true);
            console.log("Loading posts for group:", groupId);
            const response = await getGroupPosts(groupId, pageNumber, pageSize, searchTerm, authorId);
            console.log("API response:", response);

            if (response.success && response.data) {
                const newPosts = response.data.items || [];

                if (pageNumber === 1) {
                    setPosts(newPosts);
                } else {
                    setPosts(prev => [...prev, ...newPosts]);
                }

                setHasMore(newPosts.length === pageSize);
            } else {
                // Handle specific error cases
                if (response.message?.includes("đăng nhập")) {
                    console.warn("Authentication required, but continuing with empty posts");
                    // Don't redirect, just show empty state
                    setPosts([]);
                } else if (response.message?.includes("quyền truy cập")) {
                    console.warn("Access denied, but continuing with empty posts");
                    // Don't redirect, just show empty state
                    setPosts([]);
                } else {
                    toast.error(response.message || "Không thể tải danh sách bài đăng");
                    setPosts([]);
                }

                // Set empty posts on error
                if (pageNumber === 1) {
                    setPosts([]);
                }
            }
        } catch (error) {
            console.error("Error loading posts:", error);
            toast.error("Có lỗi xảy ra khi tải danh sách bài đăng");

            // Set empty posts on error
            if (pageNumber === 1) {
                setPosts([]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePost = async () => {
        if (!newPost.title.trim() || !newPost.contentMarkdown.trim()) {
            toast.error("Vui lòng nhập tiêu đề và nội dung bài đăng");
            return;
        }

        setIsCreating(true);
        try {
            // Upload files first if any
            const attachmentFileIds = await uploadSelectedFiles();

            const response = await createGroupPost(groupId, {
                title: newPost.title,
                contentMarkdown: newPost.contentMarkdown,
                attachmentFileIds: attachmentFileIds
            });

            if (response.success) {
                toast.success("Tạo bài đăng thành công!");
                setShowCreateDialog(false);
                setNewPost({ title: "", contentMarkdown: "", attachmentFileIds: [] });
                setSelectedFiles([]);
                setFilePreviews([]);
                // Reload posts
                setPageNumber(1);
                loadPosts();
            } else {
                toast.error(response.message || "Không thể tạo bài đăng");
            }
        } catch (error) {

            toast.info("Chức năng này cần API thật để hoạt động");
        } finally {
            setIsCreating(false);
        }
    };

    const uploadSelectedFiles = async (): Promise<string[]> => {
        if (selectedFiles.length === 0) return [];

        try {
            const response = await uploadFiles(selectedFiles);

            if (response.success && response.data) {
                return response.data.fileIds || [];
            }
        } catch (error) {
            console.error("Error uploading files:", error);
            toast.error("Không thể tải lên file đính kèm");
        }

        return [];
    };

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;

        const newFiles = Array.from(files);
        setSelectedFiles(prev => [...prev, ...newFiles]);

        // Create previews
        newFiles.forEach(file => {
            const url = URL.createObjectURL(file);
            setFilePreviews(prev => [...prev, {
                url,
                name: file.name,
                size: file.size,
                type: file.type
            }]);
        });
    };

    const removeFile = (index: number) => {
        const fileToRemove = selectedFiles[index];
        const previewToRemove = filePreviews[index];

        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setFilePreviews(prev => prev.filter((_, i) => i !== index));

        if (previewToRemove.url) {
            URL.revokeObjectURL(previewToRemove.url);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            return "Vừa xong";
        } else if (diffInHours < 24) {
            return `${diffInHours} giờ trước`;
        } else {
            return date.toLocaleDateString('vi-VN');
        }
    };

    const handleLoadMore = () => {
        setPageNumber(prev => prev + 1);
    };

    const handleSearch = () => {
        setPageNumber(1);
        loadPosts();
    };

    const handleBackToGroup = () => {
        // Trigger event to switch back to chat tab
        const event = new CustomEvent('switchToChatTab', {
            detail: { groupId, groupName }
        });
        window.dispatchEvent(event);
    };

    const handleRefresh = () => {
        setPageNumber(1);
        loadPosts();
    };

    // Handle post like/unlike
    const handleToggleLike = async (postId: string) => {
        try {
            const response = await togglePostLike(postId);
            if (response.success) {
                // Update the post's like count in the local state
                setPosts(prev => prev.map(post => {
                    if (post.id === postId) {
                        return {
                            ...post,
                            likeCount: (post.likeCount || 0) + (response.data?.isLiked ? 1 : -1)
                        };
                    }
                    return post;
                }));
                toast.success(response.data?.isLiked ? "Đã thích bài đăng" : "Đã bỏ thích bài đăng");
            } else {
                toast.error(response.message || "Không thể thích/bỏ thích bài đăng");
            }
        } catch (error) {

            toast.info("Chức năng này cần API thật để hoạt động");
        }
    };

    // Handle add comment
    const handleAddComment = async () => {
        if (!newComment.trim()) {
            toast.error("Vui lòng nhập nội dung bình luận");
            return;
        }

        try {
            setIsCommenting(true);
            const response = await addPostComment(selectedPostId, {
                content: newComment.trim()
            });

            if (response.success) {
                // Update the post's comment count in the local state
                setPosts(prev => prev.map(post => {
                    if (post.id === selectedPostId) {
                        return {
                            ...post,
                            commentCount: (post.commentCount || 0) + 1
                        };
                    }
                    return post;
                }));

                setNewComment("");
                setShowCommentDialog(false);
                toast.success("Đã thêm bình luận thành công");
            } else {
                toast.error(response.message || "Không thể thêm bình luận");
            }
        } catch (error) {

            toast.info("Chức năng này cần API thật để hoạt động");
        } finally {
            setIsCommenting(false);
        }
    };

    // Handle view post detail
    const handleViewPostDetail = async (postId: string) => {
        try {
            setIsLoadingDetail(true);
            setSelectedPostId(postId);
            setShowPostDetail(true);

            const response = await getPostDetail(postId);
            if (response.success) {
                setSelectedPostDetail(response.data);
            } else {
                toast.error(response.message || "Không thể lấy chi tiết bài đăng");
                setShowPostDetail(false);
            }
        } catch (error) {

            toast.info("Chức năng này cần API thật để hoạt động");
            setShowPostDetail(false);
        } finally {
            setIsLoadingDetail(false);
        }
    };








    const displayPosts = posts;

    return (
        <div className="flex-1 flex flex-col h-[600px] bg-gray-50 dark:bg-gray-900 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBackToGroup}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Quay lại nhóm
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRefresh}
                        className="h-8 w-8"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>

                <div className="mt-3">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        Bài viết của nhóm {groupName}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Xem tất cả bài viết trong nhóm {groupName}
                    </p>
                </div>
            </div>

            {/* Statistics */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 p-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {displayPosts.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Bài viết
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {displayPosts.reduce((sum, post) => sum + (post.likeCount || 0), 0)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Yêu thích
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {displayPosts.reduce((sum, post) => sum + (post.commentCount || 0), 0)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Bình luận
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter and Search */}
            <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 p-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Tùy chỉnh bảng tin
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Lọc và sắp xếp bài viết theo ý thích của bạn
                        </p>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Tìm kiếm bài viết..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="bg-white dark:bg-gray-900"
                                />
                            </div>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-48 bg-white dark:bg-gray-900">
                                    <SelectValue placeholder="Sắp xếp theo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Mới nhất</SelectItem>
                                    <SelectItem value="oldest">Cũ nhất</SelectItem>
                                    <SelectItem value="mostLiked">Nhiều thích nhất</SelectItem>
                                    <SelectItem value="mostCommented">Nhiều bình luận nhất</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Posts List */}
            <div className="flex-1 p-4 pb-20">
                <div className="space-y-3">
                    {isLoading && pageNumber === 1 ? (
                        // Loading skeleton
                        Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 bg-muted rounded-full" />
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-4 bg-muted rounded w-32" />
                                                <div className="h-4 bg-muted rounded w-16" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-5 bg-muted rounded w-3/4" />
                                                <div className="h-4 bg-muted rounded w-full" />
                                                <div className="h-4 bg-muted rounded w-2/3" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : displayPosts.length === 0 ? (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-12 text-center">
                                <FileText className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    Chưa có bài đăng nào
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                    Hãy tạo bài đăng đầu tiên để bắt đầu cuộc trò chuyện!
                                </p>
                                <Button
                                    onClick={() => setShowCreateDialog(true)}
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tạo bài đăng đầu tiên
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        displayPosts.map((post) => (
                            <Card key={post.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={post.authorAvatar} />
                                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                                {post.authorName.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {post.authorName}
                                                </span>
                                                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                                    Member
                                                </Badge>
                                            </div>

                                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                <span>Nhóm chính</span>
                                                <span className="mx-2">•</span>
                                                <span>{formatDate(post.createdAt)}</span>
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                                    {post.title || "Không có tiêu đề"}
                                                </h3>
                                                <div className="prose prose-sm max-w-none">
                                                    <div
                                                        className="text-gray-700 dark:text-gray-300 leading-relaxed"
                                                        dangerouslySetInnerHTML={{
                                                            __html: (post.contentMarkdown || post.content)?.replace(/\n/g, '<br>') || ''
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Post actions */}
                                            <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                                                    onClick={() => handleToggleLike(post.id)}
                                                >
                                                    <Heart className="h-4 w-4 mr-2" />
                                                    {post.likeCount || 0}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                                                    onClick={() => {
                                                        setSelectedPostId(post.id);
                                                        setShowCommentDialog(true);
                                                    }}
                                                >
                                                    <MessageCircle className="h-4 w-4 mr-2" />
                                                    {post.commentCount || 0}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                                    onClick={() => handleViewPostDetail(post.id)}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Xem chi tiết
                                                </Button>

                                                {post.authorId === "current-user-id" && (
                                                    <>
                                                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20">
                                                            Bài của bạn
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}

                    {/* Load more button */}
                    {hasMore && displayPosts.length > 0 && (
                        <div className="text-center pt-4">
                            <Button
                                variant="outline"
                                onClick={handleLoadMore}
                                disabled={isLoading}
                            >
                                {isLoading ? "Đang tải..." : "Tải thêm bài đăng"}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Create Button */}
            <div className="fixed bottom-4 right-4">
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                        <Button
                            size="lg"
                            className="h-12 w-12 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg"
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto" aria-describedby="create-post-description">
                        <DialogHeader>
                            <DialogTitle>Tạo bài đăng mới</DialogTitle>
                            <div id="create-post-description" className="sr-only">
                                Form tạo bài đăng mới trong nhóm
                            </div>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Tiêu đề</label>
                                <Input
                                    value={newPost.title}
                                    onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Nhập tiêu đề bài đăng..."
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Nội dung</label>
                                <Textarea
                                    value={newPost.contentMarkdown}
                                    onChange={(e) => setNewPost(prev => ({ ...prev, contentMarkdown: e.target.value }))}
                                    placeholder="Viết nội dung bài đăng..."
                                    rows={6}
                                    className="mt-1"
                                />
                            </div>

                            {/* File attachments */}
                            {selectedFiles.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">File đính kèm</label>
                                    <div className="space-y-2">
                                        {filePreviews.map((preview, index) => (
                                            <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm flex-1">{preview.name}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeFile(index)}
                                                    className="h-6 w-6 p-0"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.multiple = true;
                                        input.onchange = (e) => handleFileSelect((e.target as HTMLInputElement).files);
                                        input.click();
                                    }}
                                >
                                    <Paperclip className="h-4 w-4 mr-2" />
                                    Đính kèm file
                                </Button>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowCreateDialog(false)}
                                    disabled={isCreating}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={handleCreatePost}
                                    disabled={isCreating}
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    {isCreating ? "Đang tạo..." : "Tạo bài đăng"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Comment Dialog */}
            <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
                <DialogContent className="sm:max-w-[500px]" aria-describedby="comment-description">
                    <DialogHeader>
                        <DialogTitle>Thêm bình luận</DialogTitle>
                        <div id="comment-description" className="sr-only">
                            Form thêm bình luận cho bài đăng
                        </div>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Nội dung bình luận</label>
                            <Textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Viết bình luận của bạn..."
                                rows={4}
                                className="mt-1"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowCommentDialog(false);
                                    setNewComment("");
                                }}
                                disabled={isCommenting}
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleAddComment}
                                disabled={isCommenting}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {isCommenting ? "Đang gửi..." : "Gửi bình luận"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Post Detail Dialog */}
            <Dialog open={showPostDetail} onOpenChange={setShowPostDetail}>
                <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto" aria-describedby="post-detail-description">
                    <DialogHeader>
                        <DialogTitle>Chi tiết bài đăng</DialogTitle>
                        <div id="post-detail-description" className="sr-only">
                            Chi tiết đầy đủ của bài đăng
                        </div>
                    </DialogHeader>
                    <div className="space-y-4">
                        {isLoadingDetail ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Đang tải chi tiết bài đăng...</p>
                                </div>
                            </div>
                        ) : selectedPostDetail ? (
                            <div className="space-y-4">
                                {/* Post Header */}
                                <div className="flex items-start gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={selectedPostDetail.author?.avatarUrl} />
                                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                            {(selectedPostDetail.author?.displayName || selectedPostDetail.authorName)?.split(' ').map((n: string) => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {selectedPostDetail.author?.displayName || selectedPostDetail.authorName}
                                            </span>
                                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                                Member
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            <span>Nhóm chính</span>
                                            <span className="mx-2">•</span>
                                            <span>{formatDate(selectedPostDetail.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Post Content */}
                                <div className="space-y-3">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        {selectedPostDetail.title}
                                    </h2>
                                    <div className="prose prose-sm max-w-none">
                                        <div
                                            className="text-gray-700 dark:text-gray-300 leading-relaxed"
                                            dangerouslySetInnerHTML={{
                                                __html: (selectedPostDetail.contentMarkdown || selectedPostDetail.content)?.replace(/\n/g, '<br>') || ''
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Post Stats */}
                                <div className="flex items-center gap-6 py-3 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-2">
                                        <Heart className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {selectedPostDetail.likeCount || 0} lượt thích
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MessageCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {selectedPostDetail.commentCount || 0} bình luận
                                        </span>
                                    </div>
                                </div>

                                {/* Comments Section */}
                                {selectedPostDetail.comments && selectedPostDetail.comments.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                            Bình luận ({selectedPostDetail.comments.length})
                                        </h3>
                                        <div className="space-y-3">
                                            {selectedPostDetail.comments.map((comment: any, index: number) => (
                                                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={comment.author?.avatarUrl} />
                                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                                                            {(comment.author?.displayName || comment.authorName)?.split(' ').map((n: string) => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {comment.author?.displayName || comment.authorName}
                                                            </span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {formatDate(comment.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                                            {comment.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-600 dark:text-gray-400">Không thể tải chi tiết bài đăng</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
