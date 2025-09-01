// components/features/posts/PostsFeed.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Heart,
    MessageCircle,
    Share,
    MoreHorizontal,
    Image as ImageIcon,
    Smile,
    Paperclip
} from "lucide-react";
import { useCustomerStore } from "@/store/customerStore";
import { Post } from "@/types/customer.types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export function PostsFeed() {
    const { posts, likePost, unlikePost, toggleCreatePost } = useCustomerStore();
    const [newPostContent, setNewPostContent] = useState("");

    const handleLike = (postId: string) => {
        const post = posts.find(p => p.id === postId);
        if (post?.isLiked) {
            unlikePost(postId);
        } else {
            likePost(postId);
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Vừa xong';
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
        return format(date, 'dd/MM/yyyy', { locale: vi });
    };

    return (
        <div className="max-w-2xl mx-auto w-full space-y-6">
            {/* Create Post Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face" />
                            <AvatarFallback>CU</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <textarea
                                placeholder="Bạn đang nghĩ gì?"
                                className="w-full resize-none border-none bg-transparent focus:outline-none placeholder:text-muted-foreground"
                                rows={3}
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8">
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Ảnh
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8">
                                <Smile className="h-4 w-4 mr-2" />
                                Cảm xúc
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8">
                                <Paperclip className="h-4 w-4 mr-2" />
                                File
                            </Button>
                        </div>
                        <Button
                            disabled={!newPostContent.trim()}
                            onClick={() => {
                                // Handle create post
                                setNewPostContent("");
                            }}
                        >
                            Đăng
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Posts Feed */}
            <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-6">
                    {posts.map((post) => (
                        <Card key={post.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={post.authorAvatar} />
                                            <AvatarFallback>
                                                {post.authorName.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{post.authorName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatTime(post.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm leading-relaxed">{post.content}</p>

                                {post.images && post.images.length > 0 && (
                                    <div className="space-y-2">
                                        {post.images.map((image, index) => (
                                            <img
                                                key={index}
                                                src={image}
                                                alt={`Post image ${index + 1}`}
                                                className="w-full object-contain max-h-96 rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                                            />
                                        ))}
                                    </div>
                                )}

                                {post.tags && post.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {post.tags.map((tag) => (
                                            <Badge key={tag} variant="secondary" className="text-xs">
                                                #{tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Post Actions */}
                                <div className="flex items-center justify-between pt-4 border-t">
                                    <div className="flex items-center gap-6">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleLike(post.id)}
                                            className={cn(
                                                "flex items-center gap-2",
                                                post.isLiked && "text-red-500"
                                            )}
                                        >
                                            <Heart className={cn("h-4 w-4", post.isLiked && "fill-current")} />
                                            <span>{post.likeCount}</span>
                                        </Button>
                                        <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                            <MessageCircle className="h-4 w-4" />
                                            <span>{post.commentCount}</span>
                                        </Button>
                                        <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                            <Share className="h-4 w-4" />
                                            <span>{post.sharesCount}</span>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}


