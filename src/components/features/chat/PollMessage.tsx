"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { BarChart3, CheckCircle, Clock, Eye } from "lucide-react";
import { Message } from "@/types/customer.types";
import { getPollDetails, castVote } from "@/lib/customer-api-client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface PollMessageProps {
    message: Message;
    isOwnMessage: boolean;
    conversationId: number;
}

interface PollDetailData {
    pollId: number;
    question: string;
    isClosed: boolean;
    closesAt: string | null;
    totalVoteCount: number;
    options: Array<{
        optionId: number;
        optionText: string;
        voteCount: number;
        voters: Array<{
            userId: string;
            fullName: string;
            avatarUrl: string;
        }>;
        hasVotedByCurrentUser: boolean;
    }>;
}

export function PollMessage({ message, isOwnMessage, conversationId }: PollMessageProps) {
    const [pollData, setPollData] = useState<PollDetailData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailData, setDetailData] = useState<PollDetailData | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    useEffect(() => {
        const loadPollData = async () => {
            try {
                // Check if content is a PollID (numeric string)
                const pollId = parseInt(message.content);
                if (!isNaN(pollId)) {
                    const response = await getPollDetails(conversationId, pollId);
                    if (response.success && response.data) {
                        setPollData(response.data);
                    }
                }
            } catch (error) {
            } finally {
                setIsLoading(false);
            }
        };

        loadPollData();
    }, [message.content, conversationId]);

    const handleViewDetail = async () => {
        if (!pollData) return;

        setIsLoadingDetail(true);
        try {
            const response = await getPollDetails(conversationId, pollData.pollId);
            if (response.success && response.data) {
                setDetailData(response.data);
                setShowDetailModal(true);
            } else {
                toast.error("Không thể tải thông tin chi tiết cuộc bình chọn");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi tải thông tin chi tiết");
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const handleVote = async (optionId: number) => {
        if (!pollData || isClosed) return;

        try {
            const response = await castVote(conversationId, pollData.pollId, optionId);
            if (response.success) {
                // Refresh poll data to show updated results
                const updatedResponse = await getPollDetails(conversationId, pollData.pollId);
                if (updatedResponse.success && updatedResponse.data) {
                    setPollData(updatedResponse.data);
                }
            } else {
                toast.error(response.message || "Không thể bình chọn");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi bình chọn");
        }
    };

    if (isLoading) {
        return (
            <div className={cn(
                "w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-6 space-y-5",
                isOwnMessage ? "text-left" : "text-left"
            )}>
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-xl shadow-lg animate-pulse">
                        <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            Cuộc bình chọn
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
                            <div className="absolute inset-0 animate-ping rounded-full h-8 w-8 border-2 border-blue-400 opacity-20"></div>
                        </div>
                        <span className="text-base font-medium">Đang tải cuộc bình chọn...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!pollData) {
        return (
            <div className={cn(
                "w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-6",
                isOwnMessage ? "text-left" : "text-left"
            )}>
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    Không thể tải thông tin cuộc bình chọn
                </div>
            </div>
        );
    }

    const totalVotes = pollData.totalVoteCount;
    const isClosed = pollData.isClosed;

    return (
        <>
            <div className={cn(
                "w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-6 space-y-5 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl",
                isOwnMessage ? "text-left" : "text-left"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-xl shadow-lg transform transition-transform duration-200 hover:scale-110">
                            <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                Cuộc bình chọn
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {totalVotes} phiếu bầu
                            </div>
                        </div>
                    </div>

                    {/* View Detail Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleViewDetail}
                        disabled={isLoadingDetail}
                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-all duration-200 hover:scale-110"
                        title="Xem chi tiết"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>

                {/* Question */}
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-relaxed bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
                    {pollData.question}
                </div>

                {/* Options */}
                <div className="space-y-3">
                    {pollData.options.map((option, index) => {
                        const percentage = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
                        const isLeading = option.voteCount > 0 && option.voteCount === Math.max(...pollData.options.map(opt => opt.voteCount));

                        return (
                            <div
                                key={option.optionId}
                                className={cn(
                                    "relative p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:shadow-lg",
                                    option.hasVotedByCurrentUser
                                        ? "border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20 shadow-lg scale-[1.02]"
                                        : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-700 dark:hover:to-blue-900/20",
                                    isClosed && "opacity-75 hover:scale-100 cursor-not-allowed"
                                )}
                                onClick={() => !isClosed && handleVote(option.optionId)}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                            {option.optionText}
                                        </span>
                                        {option.hasVotedByCurrentUser && (
                                            <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg transform transition-all duration-200 animate-pulse" />
                                        )}
                                    </div>
                                    {isLeading && option.voteCount > 0 && (
                                        <Badge className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 animate-bounce">
                                            🏆 Dẫn đầu
                                        </Badge>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                <div className="relative mb-2">
                                    <Progress
                                        value={percentage}
                                        className="h-4 bg-gray-200 dark:bg-gray-600"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 drop-shadow-sm">
                                            {percentage.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>

                                {/* Vote Count */}
                                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    {option.voteCount} phiếu bầu
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Tổng cộng: {totalVotes} phiếu bầu
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        {pollData.closesAt ? (
                            <span>Đóng lúc {new Date(pollData.closesAt).toLocaleString('vi-VN')}</span>
                        ) : (
                            <span>Không giới hạn thời gian</span>
                        )}
                    </div>
                </div>

                {isClosed && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 bg-gradient-to-r from-gray-50 to-red-50 dark:from-gray-700 dark:to-red-900/20 rounded-xl border border-gray-200 dark:border-gray-600">
                        🕐 Cuộc bình chọn đã kết thúc
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <BarChart3 className="h-6 w-6 text-blue-600" />
                            Chi tiết cuộc bình chọn
                        </DialogTitle>
                        <DialogDescription>
                            Thông tin chi tiết về cuộc bình chọn và kết quả.
                        </DialogDescription>
                    </DialogHeader>

                    {detailData && (
                        <div className="space-y-6">
                            {/* Question */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                    Câu hỏi:
                                </h3>
                                <p className="text-xl font-medium text-gray-800 dark:text-gray-200">
                                    {detailData.question}
                                </p>
                            </div>

                            {/* Statistics */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200 dark:border-green-700">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {detailData.totalVoteCount}
                                    </div>
                                    <div className="text-sm text-green-700 dark:text-green-300">
                                        Tổng phiếu bầu
                                    </div>
                                </div>
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700">
                                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {detailData.options.length}
                                    </div>
                                    <div className="text-sm text-purple-700 dark:text-purple-300">
                                        Lựa chọn
                                    </div>
                                </div>
                            </div>

                            {/* Options with Voters */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Kết quả chi tiết:
                                </h3>
                                {detailData.options.map((option, index) => {
                                    const percentage = detailData.totalVoteCount > 0
                                        ? (option.voteCount / detailData.totalVoteCount) * 100
                                        : 0;
                                    const isLeading = option.voteCount > 0 &&
                                        option.voteCount === Math.max(...detailData.options.map(opt => opt.voteCount));

                                    return (
                                        <div
                                            key={option.optionId}
                                            className={cn(
                                                "p-6 rounded-xl border-2 transition-all duration-300",
                                                option.hasVotedByCurrentUser
                                                    ? "border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20 shadow-lg"
                                                    : "border-gray-200 dark:border-gray-600",
                                                isLeading && "ring-2 ring-green-500 ring-opacity-50"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                        {option.optionText}
                                                    </span>
                                                    {option.hasVotedByCurrentUser && (
                                                        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                                            Bạn đã chọn
                                                        </Badge>
                                                    )}
                                                </div>
                                                {isLeading && option.voteCount > 0 && (
                                                    <Badge className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700">
                                                        🏆 Dẫn đầu
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Progress and Stats */}
                                            <div className="mb-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                        {option.voteCount} phiếu bầu
                                                    </span>
                                                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                                        {percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={percentage}
                                                    className="h-3 bg-gray-200 dark:bg-gray-600"
                                                />
                                            </div>

                                            {/* Voters */}
                                            {option.voters.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                        Người đã bình chọn ({option.voters.length}):
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {option.voters.map((voter) => (
                                                            <div
                                                                key={voter.userId}
                                                                className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
                                                            >
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarImage src={voter.avatarUrl} />
                                                                    <AvatarFallback className="text-xs">
                                                                        {voter.fullName.split(' ').map(n => n[0]).join('')}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    {voter.fullName}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Poll Status */}
                            <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Trạng thái:
                                        </span>
                                    </div>
                                    <Badge className={cn(
                                        detailData.isClosed
                                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                            : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                    )}>
                                        {detailData.isClosed ? "Đã kết thúc" : "Đang diễn ra"}
                                    </Badge>
                                </div>
                                {detailData.closesAt && (
                                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                        Thời gian kết thúc: {new Date(detailData.closesAt).toLocaleString('vi-VN')}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
