"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Users, MapPin, Calendar, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CommunityPostsInterface } from "./CommunityPostsInterface";

interface PublicGroup {
    id: string;
    name: string;
    description: string;
    avatarUrl?: string;
    memberCount: number;
    category: string;
    location?: string;
    lastActivity: string;
    isJoined: boolean;
}

interface PublicGroupsContentProps {
    selectedCommunity: string | null;
}

export function PublicGroupsContent({ selectedCommunity }: PublicGroupsContentProps) {
    const [groups, setGroups] = useState<PublicGroup[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedGroup, setSelectedGroup] = useState<PublicGroup | null>(null);
    const groupsPerPage = 10;

    // Mock data - sẽ thay thế bằng API call
    useEffect(() => {
        const mockGroups: PublicGroup[] = [
            {
                id: "1",
                name: "Nhóm Lập trình Frontend",
                description: "Chia sẻ kiến thức về React, Vue, Angular và các công nghệ frontend",
                avatarUrl: "/api/placeholder/60/60",
                memberCount: 245,
                category: "Công nghệ",
                location: "Hà Nội",
                lastActivity: "2 giờ trước",
                isJoined: false
            },
            {
                id: "2",
                name: "Nhóm Marketing Digital",
                description: "Thảo luận về các chiến lược marketing online và quảng cáo",
                avatarUrl: "/api/placeholder/60/60",
                memberCount: 189,
                category: "Marketing",
                location: "TP.HCM",
                lastActivity: "1 ngày trước",
                isJoined: true
            },
            {
                id: "3",
                name: "Nhóm Thiết kế UI/UX",
                description: "Chia sẻ kinh nghiệm thiết kế giao diện người dùng",
                avatarUrl: "/api/placeholder/60/60",
                memberCount: 156,
                category: "Thiết kế",
                location: "Đà Nẵng",
                lastActivity: "3 ngày trước",
                isJoined: false
            },
            {
                id: "4",
                name: "Nhóm Khởi nghiệp",
                description: "Kết nối các startup và chia sẻ kinh nghiệm kinh doanh",
                avatarUrl: "/api/placeholder/60/60",
                memberCount: 312,
                category: "Kinh doanh",
                location: "Hà Nội",
                lastActivity: "5 giờ trước",
                isJoined: false
            },
            {
                id: "5",
                name: "Nhóm Ngoại ngữ",
                description: "Học tập và thực hành tiếng Anh, tiếng Nhật, tiếng Hàn",
                avatarUrl: "/api/placeholder/60/60",
                memberCount: 278,
                category: "Giáo dục",
                location: "TP.HCM",
                lastActivity: "1 ngày trước",
                isJoined: false
            }
        ];
        setGroups(mockGroups);
        setTotalPages(Math.ceil(mockGroups.length / groupsPerPage));
    }, []);

    // Filter groups based on search term and category
    const filteredGroups = groups.filter(group => {
        const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "all" || group.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Paginate groups
    const startIndex = (currentPage - 1) * groupsPerPage;
    const paginatedGroups = filteredGroups.slice(startIndex, startIndex + groupsPerPage);

    // Handle group selection
    const handleGroupSelect = (group: PublicGroup) => {
        setSelectedGroup(group);
    };

    // Handle back to groups list
    const handleBackToGroups = () => {
        setSelectedGroup(null);
    };

    // Handle group join/leave
    const handleGroupAction = async (groupId: string, action: "join" | "leave") => {
        try {
            // TODO: Gọi API join/leave group
            // if (action === "join") {
            //     await joinGroup(groupId);
            // } else {
            //     await leaveGroup(groupId);
            // }

            // Update local state
            setGroups(prev => prev.map(group =>
                group.id === groupId
                    ? { ...group, isJoined: action === "join" }
                    : group
            ));

        } catch (error) {
            console.error(`Error ${action}ing group:`, error);
        }
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const categories = [
        { value: "all", label: "Tất cả" },
        { value: "Công nghệ", label: "Công nghệ" },
        { value: "Marketing", label: "Marketing" },
        { value: "Thiết kế", label: "Thiết kế" },
        { value: "Kinh doanh", label: "Kinh doanh" },
        { value: "Giáo dục", label: "Giáo dục" }
    ];

    // Nếu đã chọn nhóm, hiển thị giao diện đăng bài
    if (selectedGroup) {
        return (
            <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
                {/* Header với nút quay lại */}
                <div className="p-6 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center space-x-4 mb-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBackToGroups}
                            className="flex items-center space-x-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Quay lại</span>
                        </Button>

                        <div className="flex items-center space-x-3">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={selectedGroup.avatarUrl} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                                    {selectedGroup.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {selectedGroup.name}
                                </h1>
                                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span>{selectedGroup.description}</span>
                                    <div className="flex items-center space-x-1">
                                        <Users className="h-3 w-3" />
                                        <span>{selectedGroup.memberCount.toLocaleString()} thành viên</span>
                                    </div>
                                    <Badge variant="outline">{selectedGroup.category}</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Giao diện đăng bài của nhóm */}
                <CommunityPostsInterface
                    groupId={selectedGroup.id}
                    groupName={selectedGroup.name}
                    groupAvatar={selectedGroup.avatarUrl}
                />
            </div>
        );
    }

    // Giao diện danh sách nhóm công khai (mặc định)
    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="p-6 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Nhóm công khai
                    </h1>
                    {selectedCommunity && (
                        <Badge variant="secondary">
                            Cộng đồng: {selectedCommunity}
                        </Badge>
                    )}
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm kiếm nhóm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Category Filter */}
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                    {category.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardHeader>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : paginatedGroups.length > 0 ? (
                    <>
                        {/* Groups Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {paginatedGroups.map((group) => (
                                <Card
                                    key={group.id}
                                    className="hover:shadow-lg transition-shadow cursor-pointer"
                                    onClick={() => handleGroupSelect(group)}
                                >
                                    <CardHeader>
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={group.avatarUrl} />
                                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                                                    {group.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                    {group.name}
                                                </h3>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {group.category}
                                                    </Badge>
                                                    {group.location && (
                                                        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                                                            <MapPin className="h-3 w-3" />
                                                            <span>{group.location}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-3">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                            {group.description}
                                        </p>

                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center space-x-1">
                                                <Users className="h-3 w-3" />
                                                <span>{group.memberCount.toLocaleString()} thành viên</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>{group.lastActivity}</span>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleGroupAction(group.id, group.isJoined ? "leave" : "join");
                                            }}
                                            variant={group.isJoined ? "outline" : "default"}
                                            className="w-full"
                                            size="sm"
                                        >
                                            {group.isJoined ? "Rời nhóm" : "Tham gia nhóm"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Trang trước
                                </Button>

                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(page)}
                                            className="w-8 h-8 p-0"
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Trang sau
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <Search className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Không tìm thấy nhóm nào
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm || selectedCategory !== "all"
                                ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"
                                : "Chưa có nhóm công khai nào được tạo"
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
