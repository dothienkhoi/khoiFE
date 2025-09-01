"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Plus,
    Users,
    MessageCircle,
    Settings,
    Calendar,
    Link,
    Megaphone,
    FileText,
    Heart,
    GraduationCap,
    Tag,
    Edit3,
    Filter,
    MoreHorizontal,
    Building,
    Award,
    Home,
    Lock,
    Globe,
    X,
    Upload,
    Search,
    Bell,
    AlertTriangle,
    LogOut,
    Trash2,
    ChevronDown,
    ChevronUp,
    UserPlus,
    User
} from "lucide-react";
import { useCustomerStore } from "@/store/customerStore";
import { cn } from "@/lib/utils";
import { customerApiClient } from "@/lib/customer-api-client";

// Types for posts
interface Post {
    postId: number;
    title: string;
    contentMarkdown: string;
    author: {
        userId: string;
        fullName: string;
        avatarUrl: string;
    };
    likeCount: number;
    isLikedByCurrentUser: boolean;
    comments: Comment[];
    createdAt: string;
    attachments: any[];
}

// API Response types
interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    errors: any;
    statusCode: number;
}

interface CreatePostRequest {
    title: string;
    contentMarkdown: string;
}

interface Comment {
    commentId: number;
    content: string;
    author: {
        userId: string;
        fullName: string;
        avatarUrl: string;
    };
    createdAt: string;
    parentCommentId: number | null;
    replies: Comment[];
}

// Mock communities data for demonstration
const mockCommunities = [
    {
        id: '4',
        name: 'Quang',
        icon: Users,
        iconColor: 'text-yellow-500',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        memberCount: 8,
        isSelected: true,
        channels: ['general']
    },
    {
        id: '5',
        name: 'Cộng đồng Post',
        icon: Users,
        iconColor: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        memberCount: 15,
        isSelected: false,
        channels: ['posts', 'sharing', 'discussion']
    }
];






export function CommunitiesHeader() {
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCommunityMenu, setShowCommunityMenu] = useState<string | null>(null);
    const [showInviteMembers, setShowInviteMembers] = useState(false);
    const [selectedCommunityForInvite, setSelectedCommunityForInvite] = useState<any>(null);
    const [inviteInput, setInviteInput] = useState('');
    const [invitees, setInvitees] = useState<string[]>([]);
    const [showShareLink, setShowShareLink] = useState(false);
    const [selectedCommunityForShare, setSelectedCommunityForShare] = useState<any>(null);
    const [showManageCommunity, setShowManageCommunity] = useState(false);
    const [selectedCommunityForManage, setSelectedCommunityForManage] = useState<any>(null);
    const [showEditCommunity, setShowEditCommunity] = useState(false);
    const [selectedCommunityForEdit, setSelectedCommunityForEdit] = useState<any>(null);
    const [showLeaveCommunity, setShowLeaveCommunity] = useState(false);
    const [selectedCommunityForLeave, setSelectedCommunityForLeave] = useState<any>(null);
    const [showDeleteCommunity, setShowDeleteCommunity] = useState(false);
    const [selectedCommunityForDelete, setSelectedCommunityForDelete] = useState<any>(null);

    const handleCommunityClick = (community: any) => {
        // Update selected state
        mockCommunities.forEach(c => c.isSelected = c.id === community.id);
        // Dispatch event to notify content component
        window.dispatchEvent(new CustomEvent('communitySelected', {
            detail: { community }
        }));
    };

    const filteredCommunities = mockCommunities.filter(community =>
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.channels.some(channel =>
            channel.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    const handleMenuToggle = (communityId: string) => {
        setShowCommunityMenu(showCommunityMenu === communityId ? null : communityId);
    };

    const handleShareLink = (community: any) => {
        setSelectedCommunityForShare(community);
        setShowShareLink(true);
        setShowCommunityMenu(null);
    };

    const handleInviteMembers = (community: any) => {
        setSelectedCommunityForInvite(community);
        setShowInviteMembers(true);
        setShowCommunityMenu(null);
        setInvitees([]);
        setInviteInput('');
    };

    const handleManageCommunity = (community: any) => {
        setSelectedCommunityForManage(community);
        setShowManageCommunity(true);
        setShowCommunityMenu(null);
    };

    const handleEditCommunity = (community: any) => {
        setSelectedCommunityForEdit(community);
        setShowEditCommunity(true);
        setShowCommunityMenu(null);
    };

    const handleLeaveCommunity = (community: any) => {
        setSelectedCommunityForLeave(community);
        setShowLeaveCommunity(true);
        setShowCommunityMenu(null);
    };

    const handleDeleteCommunity = (community: any) => {
        setSelectedCommunityForDelete(community);
        setShowDeleteCommunity(true);
        setShowCommunityMenu(null);
    };

    return (
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cộng đồng</h2>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8", showSearch && "bg-purple-100 dark:bg-purple-900/20 text-purple-600")}
                            onClick={() => setShowSearch(!showSearch)}
                        >
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Search Section */}
                {showSearch && (
                    <div className="mt-3 mb-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên nhóm..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                        {searchQuery && (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Tìm thấy {filteredCommunities.length} nhóm
                            </div>
                        )}
                    </div>
                )}


            </div>

            <ScrollArea className="h-[calc(100vh-120px)]">
                <div className="p-2 space-y-1">
                    {filteredCommunities.map((community) => (
                        <div
                            key={community.id}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
                                community.isSelected
                                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                            )}
                            onClick={() => handleCommunityClick(community)}
                        >
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", community.bgColor)}>
                                <community.icon className={cn("w-4 h-4", community.iconColor)} />
                            </div>
                            <span className="font-medium text-sm">{community.name}</span>
                            <div className="relative ml-auto">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMenuToggle(community.id);
                                    }}
                                >
                                    <MoreHorizontal className="h-3 w-3" />
                                </Button>

                                {/* Community Options Menu */}
                                {showCommunityMenu === community.id && (
                                    <div className="absolute right-0 top-8 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 community-menu">
                                        <div className="p-2 space-y-1">
                                            {/* Share join link */}
                                            <button
                                                onClick={() => handleShareLink(community)}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                            >
                                                <Link className="w-4 h-4" />
                                                Chia sẻ link tham gia
                                            </button>

                                            {/* Invite members */}
                                            <button
                                                onClick={() => handleInviteMembers(community)}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                            >
                                                <Users className="w-4 h-4" />
                                                Mời thành viên
                                            </button>

                                            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                                            {/* Manage community */}
                                            <button
                                                onClick={() => handleManageCommunity(community)}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                            >
                                                <Settings className="w-4 h-4" />
                                                Quản lý cộng đồng
                                            </button>

                                            {/* Edit community */}
                                            <button
                                                onClick={() => handleEditCommunity(community)}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                                Chỉnh sửa cộng đồng
                                            </button>

                                            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                                            {/* Leave community */}
                                            <button
                                                onClick={() => handleLeaveCommunity(community)}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Rời khỏi cộng đồng
                                            </button>

                                            {/* Delete community */}
                                            <button
                                                onClick={() => handleDeleteCommunity(community)}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Xóa cộng đồng
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredCommunities.length === 0 && searchQuery && (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            <p className="text-sm">Không tìm thấy nhóm nào</p>
                            <p className="text-xs mt-1">Thử tìm kiếm với từ khóa khác</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Invite Members Modal */}
            {showInviteMembers && selectedCommunityForInvite && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Mời thành viên vào "{selectedCommunityForInvite.name}"
                            </h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowInviteMembers(false);
                                    setSelectedCommunityForInvite(null);
                                    setInvitees([]);
                                    setInviteInput('');
                                }}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {/* Instructions */}
                            <div className="mb-6">
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    Nhập tên, email hoặc số điện thoại của những người bạn muốn thêm vào cộng đồng này.
                                    Bạn có thể mời tối đa 30 người cùng lúc. ⓘ
                                </p>
                            </div>

                            {/* Input Field */}
                            <div className="mb-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Nhập tên, email hoặc số điện thoại"
                                        value={inviteInput}
                                        onChange={(e) => setInviteInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && inviteInput.trim()) {
                                                if (invitees.length < 30) {
                                                    setInvitees([...invitees, inviteInput.trim()]);
                                                    setInviteInput('');
                                                }
                                            }
                                        }}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            if (inviteInput.trim() && invitees.length < 30) {
                                                setInvitees([...invitees, inviteInput.trim()]);
                                                setInviteInput('');
                                            }
                                        }}
                                        disabled={!inviteInput.trim() || invitees.length >= 30}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 text-sm"
                                    >
                                        Thêm
                                    </Button>
                                </div>
                            </div>

                            {/* Invitee Counter */}
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {invitees.length} trong số 30 người được mời
                                </p>
                            </div>

                            {/* Invitees List */}
                            {invitees.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Danh sách người được mời:
                                    </h3>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {invitees.map((invitee, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2"
                                            >
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {invitee}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setInvitees(invitees.filter((_, i) => i !== index))}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setInvitees([]);
                                        setInviteInput('');
                                        setShowInviteMembers(false);
                                        setSelectedCommunityForInvite(null);
                                    }}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                                    disabled={invitees.length === 0}
                                    onClick={() => {
                                        console.log('Sending invitations to:', invitees);
                                        alert(`Đã gửi lời mời đến ${invitees.length} người!`);
                                        setInvitees([]);
                                        setInviteInput('');
                                        setShowInviteMembers(false);
                                        setSelectedCommunityForInvite(null);
                                    }}
                                >
                                    Mời ({invitees.length})
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Link Modal */}
            {showShareLink && selectedCommunityForShare && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Link đến cộng đồng "{selectedCommunityForShare.name}" đã được sao chép
                                </h2>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowShareLink(false);
                                    setSelectedCommunityForShare(null);
                                }}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {/* Link Input Field */}
                            <div className="mb-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={`https://fastbite.com/communities/${selectedCommunityForShare.name.toLowerCase().replace(/\s+/g, '-')}`}
                                        readOnly
                                        className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-mono text-sm"
                                    />
                                    <Button
                                        onClick={() => {
                                            const link = `https://fastbite.com/communities/${selectedCommunityForShare.name.toLowerCase().replace(/\s+/g, '-')}`;
                                            navigator.clipboard.writeText(link);
                                            alert('Đã sao chép link thành công!');
                                        }}
                                        className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-3 rounded-lg font-medium"
                                    >
                                        Sao chép
                                    </Button>
                                </div>
                            </div>

                            {/* Edit Link Settings */}
                            <div className="text-left">
                                <button
                                    onClick={() => alert('Mở cài đặt link cho: ' + selectedCommunityForShare.name)}
                                    className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium"
                                >
                                    Chỉnh sửa cài đặt link
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Community Modal */}
            {showManageCommunity && selectedCommunityForManage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", selectedCommunityForManage.bgColor)}>
                                    <selectedCommunityForManage.icon className={cn("w-5 h-5", selectedCommunityForManage.iconColor)} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        Quản lý cộng đồng "{selectedCommunityForManage.name}"
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Quản lý thành viên và cài đặt cộng đồng
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowManageCommunity(false);
                                    setSelectedCommunityForManage(null);
                                }}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            {/* Members Management */}
                            <div className="space-y-6">
                                {/* Owners Section */}
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Owners (1)
                                        </h3>
                                        <ChevronDown className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-semibold text-sm">QĐ</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">Quang Lê Đăng</p>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                        <User className="w-4 h-4" />
                                                        <span>Set nickname</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">Owner</span>
                                                <ChevronDown className="w-4 h-4 text-gray-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Members Section */}
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Members (0)
                                        </h3>
                                        <ChevronUp className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                        <p>Chưa có thành viên nào</p>
                                    </div>
                                </div>

                                {/* Add Member Button */}
                                <div className="text-center">
                                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Thêm thành viên
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Community Modal */}
            {showEditCommunity && selectedCommunityForEdit && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Chỉnh sửa cộng đồng
                            </h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowEditCommunity(false);
                                    setSelectedCommunityForEdit(null);
                                }}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            <div className="space-y-6">
                                {/* Community Icon Section */}
                                <div className="flex items-start gap-6">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className={cn("w-20 h-20 rounded-lg flex items-center justify-center border-2 border-gray-200 dark:border-gray-700", selectedCommunityForEdit.bgColor)}>
                                            <selectedCommunityForEdit.icon className={cn("w-10 h-10", selectedCommunityForEdit.iconColor)} />
                                        </div>
                                        <Button variant="outline" size="sm" className="text-sm">
                                            <Edit3 className="w-4 h-4 mr-2" />
                                            Chỉnh sửa
                                        </Button>
                                    </div>

                                    {/* Community Name & Description */}
                                    <div className="flex-1 space-y-4">
                                        {/* Community Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Tên cộng đồng
                                            </label>
                                            <input
                                                type="text"
                                                defaultValue={selectedCommunityForEdit.name}
                                                className="w-full px-3 py-2 border-b-2 border-purple-500 bg-transparent text-gray-900 dark:text-white text-lg focus:outline-none focus:border-purple-600"
                                                placeholder="Nhập tên cộng đồng"
                                            />
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Mô tả (tùy chọn)
                                            </label>
                                            <textarea
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                placeholder="Viết mô tả ngắn về cộng đồng của bạn để mọi người biết nó về cái gì."
                                            />
                                        </div>
                                    </div>
                                </div>


                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowEditCommunity(false);
                                    setSelectedCommunityForEdit(null);
                                }}
                                className="bg-gray-600 hover:bg-gray-700 text-white border-gray-600"
                            >
                                Hủy
                            </Button>
                            <Button
                                className="bg-gray-400 text-white cursor-not-allowed"
                                disabled
                            >
                                Lưu
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Community Modal */}
            {showLeaveCommunity && selectedCommunityForLeave && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Rời khỏi cộng đồng "{selectedCommunityForLeave.name}"?
                            </h2>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            <p className="text-gray-700 dark:text-gray-300 mb-6">
                                Tất cả nội dung cộng đồng sẽ bị xóa khi bạn rời khỏi. Nhưng bạn có thể yêu cầu xuất dữ liệu cộng đồng trước khi rời khỏi.{' '}
                                <span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                                    Tìm hiểu cách thực hiện
                                </span>
                                .
                            </p>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowLeaveCommunity(false);
                                        setSelectedCommunityForLeave(null);
                                    }}
                                    className="bg-gray-600 hover:bg-gray-700 text-white border-gray-600"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={() => {
                                        // Thực hiện logic rời khỏi cộng đồng ở đây
                                        console.log(`Đã rời khỏi cộng đồng: ${selectedCommunityForLeave.name}`);
                                        setShowLeaveCommunity(false);
                                        setSelectedCommunityForLeave(null);
                                    }}
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    Rời khỏi
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Community Modal */}
            {showDeleteCommunity && selectedCommunityForDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Xóa cộng đồng "{selectedCommunityForDelete.name}"?
                            </h2>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            <p className="text-gray-700 dark:text-gray-300 mb-6">
                                Bạn sẽ không còn quyền truy cập vào cộng đồng hoặc nội dung của nó. Nhưng bạn có thể yêu cầu xuất dữ liệu của mình trước khi xóa.{' '}
                                <span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                                    Tìm hiểu cách thực hiện
                                </span>
                                .
                            </p>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowDeleteCommunity(false);
                                        setSelectedCommunityForDelete(null);
                                    }}
                                    className="bg-gray-600 hover:bg-gray-700 text-white border-gray-600"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={() => {
                                        // Thực hiện logic xóa cộng đồng ở đây
                                        console.log(`Đã xóa cộng đồng: ${selectedCommunityForDelete.name}`);
                                        setShowDeleteCommunity(false);
                                        setSelectedCommunityForDelete(null);
                                    }}
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    Xóa vĩnh viễn
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Post Card Component
function PostCard({
    post,
    onToggleLike,
    posts,
    setPosts
}: {
    post: Post;
    onToggleLike: (postId: number) => Promise<void>;
    posts: Post[];
    setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
}) {
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            const response = await customerApiClient.post(`/posts/${post.postId}/comments`, {
                content: newComment
            });
            const responseData = response.data as ApiResponse<any>;

            if (responseData.success) {
                // Add new comment from API response
                const newCommentData: Comment = {
                    commentId: responseData.data.commentId || Date.now(),
                    content: newComment,
                    author: {
                        userId: responseData.data.author?.userId || "current-user-id",
                        fullName: responseData.data.author?.fullName || "Current User",
                        avatarUrl: responseData.data.author?.avatarUrl || "https://res.cloudinary.com/dzcowhtul/image/upload/v1756633082/avatars/group_gyxnm1.png"
                    },
                    createdAt: responseData.data.createdAt || new Date().toISOString(),
                    parentCommentId: null,
                    replies: []
                };

                // Update post comments
                const updatedPost = { ...post };
                updatedPost.comments.push(newCommentData);

                // Update posts state
                setPosts(posts.map(p => p.postId === post.postId ? updatedPost : p));

                // Reset comment input
                setNewComment('');

                console.log('Comment added successfully');
            } else {
                console.error('Failed to add comment:', responseData.message);
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            {/* Post Header */}
            <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-10 h-10">
                    <AvatarImage src={post.author.avatarUrl} />
                    <AvatarFallback className="bg-purple-600 text-white">
                        {post.author.fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{post.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {post.author.fullName} • {formatDate(post.createdAt)}
                    </p>
                </div>
            </div>

            {/* Post Content */}
            <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300">{post.contentMarkdown}</p>
            </div>

            {/* Post Actions */}
            <div className="flex items-center gap-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                    onClick={() => onToggleLike(post.postId)}
                    className={`flex items-center gap-2 text-sm transition-colors ${post.isLikedByCurrentUser
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                        }`}
                >
                    <Heart className={`w-4 h-4 ${post.isLikedByCurrentUser ? 'fill-current' : ''}`} />
                    <span>{post.likeCount}</span>
                </button>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.comments.length}</span>
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="space-y-3 mb-4">
                        {post.comments.map((comment) => (
                            <div key={comment.commentId} className="flex gap-3">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={comment.author.avatarUrl} />
                                    <AvatarFallback className="bg-gray-500 text-white text-xs">
                                        {comment.author.fullName.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                            {comment.author.fullName}
                                        </p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            {comment.content}
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {formatDate(comment.createdAt)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Comment */}
                    <div className="flex gap-3">
                        <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-purple-600 text-white text-xs">QD</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Thêm bình luận..."
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <Button
                                onClick={handleAddComment}
                                disabled={!newComment.trim()}
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                Gửi
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function CommunitiesContent() {
    const [selectedCommunity, setSelectedCommunity] = useState(mockCommunities[0]); // Default to Quang
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');

    // Listen for community selection events
    useEffect(() => {
        const handleCommunitySelected = (event: CustomEvent) => {
            setSelectedCommunity(event.detail.community);
        };

        window.addEventListener('communitySelected', handleCommunitySelected as EventListener);
        return () => {
            window.removeEventListener('communitySelected', handleCommunitySelected as EventListener);
        };
    }, []);

    // Load posts when community changes
    useEffect(() => {
        if (selectedCommunity) {
            loadPosts();
        }
    }, [selectedCommunity]);

    const loadPosts = async () => {
        if (!selectedCommunity) return;

        setLoading(true);
        try {
            const response = await customerApiClient.get(`/groups/${selectedCommunity.id}/posts`);
            const responseData = response.data as ApiResponse<any>;

            if (responseData.success) {
                const mappedPosts: Post[] = (responseData.data.items || []).map((item: any) => ({
                    postId: item.postId || item.id,
                    title: item.title || "Không có tiêu đề",
                    contentMarkdown: item.contentMarkdown || item.content || "",
                    author: {
                        userId: item.author?.userId || item.authorId || "unknown",
                        fullName: item.author?.fullName || item.authorName || "Unknown User",
                        avatarUrl: item.author?.avatarUrl || item.authorAvatar || ""
                    },
                    likeCount: item.likeCount || 0,
                    isLikedByCurrentUser: item.isLikedByCurrentUser || false,
                    comments: item.comments || [],
                    createdAt: item.createdAt || new Date().toISOString(),
                    attachments: item.attachments || []
                }));

                setPosts(mappedPosts);
                console.log('Posts loaded successfully:', mappedPosts);
            } else {
                console.error('Failed to load posts:', responseData.message);
                setPosts([]);
            }
        } catch (error: any) {
            console.error('Error loading posts:', error);
            // Fallback to mock data for development
            const mockPosts: Post[] = [
                {
                    postId: 14,
                    title: "Quang",
                    contentMarkdown: "bài hay quá",
                    author: {
                        userId: "9a606b08-6b9f-4c79-bbef-08dddd93dca6",
                        fullName: "Quang Lê",
                        avatarUrl: "https://res.cloudinary.com/dzcowhtul/image/upload/v1756633082/avatars/group_gyxnm1.png"
                    },
                    likeCount: 1,
                    isLikedByCurrentUser: true,
                    comments: [
                        {
                            commentId: 30,
                            content: "hay quá",
                            author: {
                                userId: "9a606b08-6b9f-4c79-bbef-08dddd93dca6",
                                fullName: "Quang Lê",
                                avatarUrl: "https://res.cloudinary.com/dzcowhtul/image/upload/v1756633082/avatars/group_gyxnm1.png"
                            },
                            createdAt: "2025-08-31T10:50:21.7110533Z",
                            parentCommentId: null,
                            replies: []
                        }
                    ],
                    createdAt: "2025-08-31T10:48:42.27099677",
                    attachments: []
                }
            ];
            setPosts(mockPosts);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async () => {
        if (!newPostTitle.trim() || !newPostContent.trim() || !selectedCommunity) return;

        try {
            const response = await customerApiClient.post(`/groups/${selectedCommunity.id}/posts`, {
                title: newPostTitle,
                contentMarkdown: newPostContent
            });
            const responseData = response.data as ApiResponse<any>;

            if (responseData.success) {
                const newPost: Post = {
                    postId: responseData.data.postId || Date.now(),
                    title: responseData.data.title || newPostTitle,
                    contentMarkdown: responseData.data.contentMarkdown || newPostContent,
                    author: {
                        userId: responseData.data.author?.userId || "current-user-id",
                        fullName: responseData.data.author?.fullName || "Current User",
                        avatarUrl: responseData.data.author?.avatarUrl || "https://res.cloudinary.com/dzcowhtul/image/upload/v1756633082/avatars/group_gyxnm1.png"
                    },
                    likeCount: responseData.data.likeCount || 0,
                    isLikedByCurrentUser: false,
                    comments: [],
                    createdAt: responseData.data.createdAt || new Date().toISOString(),
                    attachments: []
                };

                setPosts([newPost, ...posts]);
                setNewPostTitle('');
                setNewPostContent('');
                setShowCreatePost(false);
                console.log('Post created successfully:', responseData.message);
            } else {
                console.error('Failed to create post:', responseData.message);
            }
        } catch (error: any) {
            console.error('Error creating post:', error);
            // Fallback to mock data for development
            const mockPost: Post = {
                postId: Date.now(),
                title: newPostTitle,
                contentMarkdown: newPostContent,
                author: {
                    userId: "current-user-id",
                    fullName: "Current User",
                    avatarUrl: "https://res.cloudinary.com/dzcowhtul/image/upload/v1756633082/avatars/group_gyxnm1.png"
                },
                likeCount: 0,
                isLikedByCurrentUser: false,
                comments: [],
                createdAt: new Date().toISOString(),
                attachments: []
            };

            setPosts([mockPost, ...posts]);
            setNewPostTitle('');
            setNewPostContent('');
            setShowCreatePost(false);
            console.log('Mock post created successfully');
        }
    };

    const handleToggleLike = async (postId: number) => {
        try {
            const response = await customerApiClient.post(`/posts/${postId}/toggle-like`);
            const responseData = response.data as ApiResponse<any>;

            if (responseData.success) {
                setPosts(posts.map(post =>
                    post.postId === postId
                        ? {
                            ...post,
                            isLikedByCurrentUser: !post.isLikedByCurrentUser,
                            likeCount: post.isLikedByCurrentUser ? post.likeCount - 1 : post.likeCount + 1
                        }
                        : post
                ));
                console.log('Like toggled successfully');
            } else {
                console.error('Failed to toggle like:', responseData.message);
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    return (
        <div className="flex-1 bg-white dark:bg-gray-900">
            {selectedCommunity ? (
                <div className="h-full flex flex-col">


                    {/* Community Header */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", selectedCommunity.bgColor)}>
                                    <selectedCommunity.icon className={cn("w-6 h-6", selectedCommunity.iconColor)} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCommunity.name}</h1>
                                    <p className="text-gray-600 dark:text-gray-400">{selectedCommunity.memberCount} thành viên</p>
                                </div>
                            </div>


                        </div>
                    </div>

                    {/* Post Creation Section */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <Avatar className="w-10 h-10">
                                    <AvatarFallback className="bg-purple-600 text-white">QD</AvatarFallback>
                                </Avatar>
                                <span className="text-gray-600 dark:text-gray-400">Đăng bài trong kênh</span>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowCreatePost(true)}
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Bài đăng
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Posts Section */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                                <p className="mt-2 text-gray-600 dark:text-gray-400">Đang tải bài viết...</p>
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="p-6 text-center">
                                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <FileText className="h-10 w-10 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Chưa có bài viết nào</h3>
                                <p className="text-gray-500 dark:text-gray-400">Hãy tạo bài viết đầu tiên để bắt đầu cuộc trò chuyện!</p>
                            </div>
                        ) : (
                            <div className="space-y-4 p-6">
                                {posts.map((post) => (
                                    <PostCard
                                        key={post.postId}
                                        post={post}
                                        onToggleLike={handleToggleLike}
                                        posts={posts}
                                        setPosts={setPosts}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Users className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Chọn một cộng đồng</h3>
                        <p className="text-gray-500 dark:text-gray-400">Chọn cộng đồng từ danh sách bên trái để bắt đầu</p>
                    </div>
                </div>
            )}
        </div>
    );
}
