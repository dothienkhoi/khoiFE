"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Post {
    postId: number;
    title: string;
    contentMarkdown: string;
    author: {
        userId: string;
        fullName: string;
        avatarUrl?: string;
    };
    likeCount: number;
    commentCount: number;
    isLikedByCurrentUser?: boolean;
    createdAt: string;
    attachments?: any[];
}

interface CommunityPostCardProps {
    post: Post;
    onToggleLike: (postId: number) => void;
    onCommentClick: (postId: number) => void;
    onShareClick?: (postId: number) => void;
}

export function CommunityPostCard({
    post,
    onToggleLike,
    onCommentClick,
    onShareClick
}: CommunityPostCardProps) {
    const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser || false);
    const [likeCount, setLikeCount] = useState(post.likeCount);

    const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
        addSuffix: true
    });

    const handleToggleLike = () => {
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
        onToggleLike(post.postId);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-4">
            {/* Header - Author Info */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage
                            src={post.author.avatarUrl}
                            alt={post.author.fullName}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                            {post.author.fullName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                            {post.author.fullName}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {timeAgo}
                        </p>
                    </div>
                </div>

                {/* More Options */}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </div>

            {/* Post Content */}
            <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {post.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {post.contentMarkdown}
                </p>
            </div>

            {/* Attachments (if any) */}
            {post.attachments && post.attachments.length > 0 && (
                <div className="mb-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            📎 {post.attachments.length} tệp đính kèm
                        </p>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-6">
                    {/* Like Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleLike}
                        className={`flex items-center space-x-2 ${isLiked
                                ? "text-red-500 hover:text-red-600"
                                : "text-gray-500 hover:text-red-500"
                            }`}
                    >
                        <Heart
                            className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`}
                        />
                        <span className="text-sm font-medium">
                            {likeCount} {likeCount === 1 ? "thích" : "thích"}
                        </span>
                    </Button>

                    {/* Comment Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCommentClick(post.postId)}
                        className="flex items-center space-x-2 text-gray-500 hover:text-blue-500"
                    >
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                            {post.commentCount} {post.commentCount === 1 ? "bình luận" : "bình luận"}
                        </span>
                    </Button>

                    {/* Share Button */}
                    {onShareClick && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onShareClick(post.postId)}
                            className="flex items-center space-x-2 text-gray-500 hover:text-green-500"
                        >
                            <Share className="h-4 w-4" />
                            <span className="text-sm font-medium">Chia sẻ</span>
                        </Button>
                    )}
                </div>

                {/* Post ID Badge (for debugging) */}
                <Badge variant="outline" className="text-xs">
                    ID: {post.postId}
                </Badge>
            </div>
        </div>
    );
}
