"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Image,
    FileText,
    Link,
    Smile,
    Send,
    Heart,
    MessageCircle,
    Share2,
    MoreHorizontal,
    ThumbsUp,
    Bookmark
} from "lucide-react";
import { toast } from "sonner";

interface Post {
    id: string;
    content: string;
    author: {
        id: string;
        name: string;
        avatarUrl?: string;
    };
    createdAt: string;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    isLiked: boolean;
    isBookmarked: boolean;
    images?: string[];
    attachments?: Array<{
        id: string;
        name: string;
        type: string;
        size: number;
        url: string;
    }>;
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
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [showCreatePost, setShowCreatePost] = useState(false);

    // Mock data - sẽ thay thế bằng API call
    useEffect(() => {
        const mockPosts: Post[] = [
            {
                id: "1",
                content: "Chào mừng tất cả thành viên mới tham gia nhóm! Hãy chia sẻ kinh nghiệm và kiến thức của bạn với cộng đồng nhé. 🚀",
                author: {
                    id: "1",
                    name: "Nguyễn Văn A",
                    avatarUrl: "/api/placeholder/32/32"
                },
                createdAt: "2 giờ trước",
                likeCount: 15,
                commentCount: 8,
                shareCount: 3,
                isLiked: false,
                isBookmarked: false,
                images: ["/api/placeholder/400/300"]
            },
            {
                id: "2",
                content: "Mình vừa hoàn thành một dự án React mới. Có ai muốn xem demo và góp ý không? Link demo: https://example.com",
                author: {
                    id: "2",
                    name: "Trần Thị B",
                    avatarUrl: "/api/placeholder/32/32"
                },
                createdAt: "5 giờ trước",
                likeCount: 23,
                commentCount: 12,
                shareCount: 7,
                isLiked: true,
                isBookmarked: false
            },
            {
                id: "3",
                content: "Tài liệu học tập về UI/UX Design cho người mới bắt đầu. File PDF đính kèm bên dưới.",
                author: {
                    id: "3",
                    name: "Lê Văn C",
                    avatarUrl: "/api/placeholder/32/32"
                },
                createdAt: "1 ngày trước",
                likeCount: 31,
                commentCount: 18,
                shareCount: 12,
                isLiked: false,
                isBookmarked: true,
                attachments: [
                    {
                        id: "1",
                        name: "UI_UX_Guide.pdf",
                        type: "pdf",
                        size: 2048576,
                        url: "/api/placeholder/file"
                    }
                ]
            }
        ];
        setPosts(mockPosts);
    }, [groupId]);

    // Handle create post
    const handleCreatePost = async () => {
        if (!newPostContent.trim()) {
            toast.error("Vui lòng nhập nội dung bài viết");
            return;
        }

        setIsCreatingPost(true);

        try {
            // TODO: Gọi API tạo bài viết
            // const response = await createPost(groupId, { content: newPostContent, files: selectedFiles });

            // Mock response
            const newPost: Post = {
                id: Date.now().toString(),
                content: newPostContent.trim(),
                author: {
                    id: "current-user",
                    name: "Bạn",
                    avatarUrl: "/api/placeholder/32/32"
                },
                createdAt: "Vừa xong",
                likeCount: 0,
                commentCount: 0,
                shareCount: 0,
                isLiked: false,
                isBookmarked: false,
                images: selectedFiles.length > 0 ? selectedFiles.map(file => URL.createObjectURL(file)) : undefined
            };

            setPosts(prev => [newPost, ...prev]);
            setNewPostContent("");
            setSelectedFiles([]);
            setShowCreatePost(false);
            toast.success("Đăng bài thành công!");

        } catch (error) {
            console.error("Error creating post:", error);
            toast.error("Không thể đăng bài. Vui lòng thử lại.");
        } finally {
            setIsCreatingPost(false);
        }
    };

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    // Handle remove file
    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Handle post actions
    const handlePostAction = async (postId: string, action: "like" | "bookmark") => {
        try {
            // TODO: Gọi API thực hiện action
            // await performPostAction(postId, action);

            // Update local state
            setPosts(prev => prev.map(post => {
                if (post.id === postId) {
                    if (action === "like") {
                        return {
                            ...post,
                            isLiked: !post.isLiked,
                            likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1
                        };
                    } else if (action === "bookmark") {
                        return {
                            ...post,
                            isBookmarked: !post.isBookmarked
                        };
                    }
                }
                return post;
            }));

        } catch (error) {
            console.error(`Error performing ${action}:`, error);
        }
    };

    // Format file size
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Create Post Section */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src="/api/placeholder/32/32" />
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                    B
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-3">
                                <Textarea
                                    placeholder={`Bạn muốn chia sẻ gì với ${groupName}?`}
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    className="min-h-[100px] resize-none"
                                />

                                {/* File Preview */}
                                {selectedFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedFiles.map((file, index) => (
                                            <div key={index} className="relative">
                                                {file.type.startsWith('image/') ? (
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={file.name}
                                                        className="w-20 h-20 object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                                        <FileText className="h-8 w-8 text-gray-400" />
                                                    </div>
                                                )}
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                                                    onClick={() => removeFile(index)}
                                                >
                                                    ×
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Post Actions */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            type="file"
                                            multiple
                                            accept="image/*,.pdf,.doc,.docx,.txt"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                        >
                                            <Image className="h-5 w-5 text-gray-500" />
                                        </label>
                                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                            <FileText className="h-5 w-5 text-gray-500" />
                                        </button>
                                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                            <Link className="h-5 w-5 text-gray-500" />
                                        </button>
                                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                            <Smile className="h-5 w-5 text-gray-500" />
                                        </button>
                                    </div>

                                    <Button
                                        onClick={handleCreatePost}
                                        disabled={isCreatingPost || !newPostContent.trim()}
                                        size="sm"
                                    >
                                        {isCreatingPost ? "Đang đăng..." : "Đăng bài"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Posts List */}
                <div className="space-y-6">
                    {posts.map((post) => (
                        <Card key={post.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={post.author.avatarUrl} />
                                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                                {post.author.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {post.author.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {post.createdAt}
                                            </p>
                                        </div>
                                    </div>

                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Post Content */}
                                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                                    {post.content}
                                </p>

                                {/* Post Images */}
                                {post.images && post.images.length > 0 && (
                                    <div className="grid grid-cols-1 gap-2">
                                        {post.images.map((image, index) => (
                                            <img
                                                key={index}
                                                src={image}
                                                alt={`Post image ${index + 1}`}
                                                className="w-full rounded-lg"
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Post Attachments */}
                                {post.attachments && post.attachments.length > 0 && (
                                    <div className="space-y-2">
                                        {post.attachments.map((attachment) => (
                                            <div
                                                key={attachment.id}
                                                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                            >
                                                <FileText className="h-8 w-8 text-gray-400" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                                        {attachment.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {formatFileSize(attachment.size)}
                                                    </p>
                                                </div>
                                                <Button variant="outline" size="sm">
                                                    Tải xuống
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Post Stats */}
                                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center space-x-4">
                                        <span>{post.likeCount} lượt thích</span>
                                        <span>{post.commentCount} bình luận</span>
                                        <span>{post.shareCount} lượt chia sẻ</span>
                                    </div>
                                </div>

                                {/* Post Actions */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center space-x-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handlePostAction(post.id, "like")}
                                            className={`flex items-center space-x-2 ${post.isLiked ? "text-blue-600" : ""
                                                }`}
                                        >
                                            <Heart className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
                                            <span>Thích</span>
                                        </Button>
                                    </div>

                                    <div className="flex items-center space-x-1">
                                        <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                                            <MessageCircle className="h-4 w-4" />
                                            <span>Bình luận</span>
                                        </Button>
                                    </div>

                                    <div className="flex items-center space-x-1">
                                        <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                                            <Share2 className="h-4 w-4" />
                                            <span>Chia sẻ</span>
                                        </Button>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handlePostAction(post.id, "bookmark")}
                                        className={`flex items-center space-x-2 ${post.isBookmarked ? "text-yellow-600" : ""
                                            }`}
                                    >
                                        <Bookmark className={`h-4 w-4 ${post.isBookmarked ? "fill-current" : ""}`} />
                                        <span>Lưu</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
