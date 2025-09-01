"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MessageList } from "../chat/MessageList";
import { useCustomerStore } from "@/store/customerStore";
import { chatHubUtils } from "@/components/providers/ChatHubProvider";
import { sendConversationMessage, uploadFilesToConversation, getGroupConversationId, getGroupDetails, getGroupMembers } from "@/lib/customer-api-client";
import { Message, GroupMember } from "@/types/customer.types";
import { Paperclip, Send, Image, Download, X, Users, Settings, ArrowLeft, MoreHorizontal, UserPlus, Edit, LogOut, Link, Copy, BarChart3, FileText, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { InviteMembersDialog } from "./InviteMembersDialog";
import { CreatePollDialog } from "./CreatePollDialog";
import { FilePreviewGallery } from "../chat/FilePreviewGallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupPosts } from "./GroupPosts";

interface GroupChatInterfaceProps {
    groupId: string;
    groupName: string;
    groupDescription?: string;
    groupAvatar?: string;
    memberCount?: number;
}

export function GroupChatInterface({
    groupId,
    groupName,
    groupDescription,
    groupAvatar,
    memberCount = 0
}: GroupChatInterfaceProps) {
    const router = useRouter();
    const { activeChatId, activeChatType, conversations, clearActiveChat, clearMessages } = useCustomerStore();
    const [messageInput, setMessageInput] = useState("");
    const [showAttachmentPopup, setShowAttachmentPopup] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [filePreviews, setFilePreviews] = useState<{ url: string; name: string; size: number; type: string }[]>([]);
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [isLoadingConversation, setIsLoadingConversation] = useState(true);
    const [groupDetails, setGroupDetails] = useState<any>(null);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [isLoadingGroupInfo, setIsLoadingGroupInfo] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [showEditGroup, setShowEditGroup] = useState(false);
    const [showInviteMembers, setShowInviteMembers] = useState(false);
    const [showLeaveGroup, setShowLeaveGroup] = useState(false);
    const [showCreatePoll, setShowCreatePoll] = useState(false);
    const [editGroupName, setEditGroupName] = useState("");
    const [editGroupDescription, setEditGroupDescription] = useState("");
    const [editGroupIsPrivate, setEditGroupIsPrivate] = useState(false);
    const [activeTab, setActiveTab] = useState("chat");


    // Close attachment popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.attachment-popup-container')) {
                setShowAttachmentPopup(false);
            }
        };

        if (showAttachmentPopup) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAttachmentPopup]);

    // Load conversation ID and group info when component mounts
    useEffect(() => {
        if (groupId) {
            loadGroupConversation();
            loadGroupInfo(); // Load group info immediately
        }
    }, [groupId]);

    // Populate edit form when group details are loaded
    useEffect(() => {
        if (groupDetails) {
            setEditGroupName(groupDetails.groupName || groupName);
            setEditGroupDescription(groupDetails.description || groupDescription || "");
            setEditGroupIsPrivate(groupDetails.groupType === "Private");
            // Generate invite link (mock for now)
            // setInviteLink(`${window.location.origin}/groups/join/${groupId}`); // This line is removed
        }
    }, [groupDetails, groupName, groupDescription, groupId]);

    // Listen for tab switch events
    useEffect(() => {
        const handleSwitchToPostsTab = (event: CustomEvent) => {
            if (event.detail.groupId === groupId) {
                setActiveTab("posts");
            }
        };

        const handleSwitchToChatTab = (event: CustomEvent) => {
            if (event.detail.groupId === groupId) {
                setActiveTab("chat");
            }
        };

        window.addEventListener('switchToPostsTab', handleSwitchToPostsTab as EventListener);
        window.addEventListener('switchToChatTab', handleSwitchToChatTab as EventListener);

        return () => {
            window.removeEventListener('switchToPostsTab', handleSwitchToPostsTab as EventListener);
            window.removeEventListener('switchToChatTab', handleSwitchToChatTab as EventListener);
        };
    }, [groupId]);

    // Join/leave group conversation when conversationId is available


    useEffect(() => {
        if (conversationId) {
            // Clear previous conversation messages when switching
            if (activeChatId !== groupId) {
                clearMessages(conversationId);
            }

            chatHubUtils.joinConversation(conversationId);

            return () => {
                chatHubUtils.leaveConversation(conversationId);
            };
        }
    }, [conversationId, activeChatId, groupId, clearMessages]);

    const loadGroupConversation = async () => {
        setIsLoadingConversation(true);
        try {
            const response = await getGroupConversationId(groupId, groupName);
            if (response.success && response.data) {
                setConversationId(response.data.conversationId);

            } else {
                toast.error(response.message || "Không thể tải cuộc hội thoại nhóm");
                // Fallback to extracted number from groupId
                const fallbackId = Number(groupId.replace(/\D/g, '')) || 1;
                setConversationId(fallbackId);
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi tải cuộc hội thoại");
            // Fallback to extracted number from groupId
            const fallbackId = Number(groupId.replace(/\D/g, '')) || 1;
            setConversationId(fallbackId);
        } finally {
            setIsLoadingConversation(false);
        }
    };

    const loadGroupInfo = async () => {
        setIsLoadingGroupInfo(true);
        try {
            // Load group details and members in parallel
            const [detailsResponse, membersResponse] = await Promise.all([
                getGroupDetails(groupId),
                getGroupMembers(groupId)
            ]);

            if (detailsResponse.success) {
                setGroupDetails(detailsResponse.data);
            } else {
                toast.error(`Không thể tải thông tin nhóm: ${detailsResponse.message}`);
            }

            if (membersResponse.success) {
                // Handle different data structures from API
                let members: any[] = [];
                if (Array.isArray(membersResponse.data)) {
                    members = membersResponse.data;
                } else if (membersResponse.data && typeof membersResponse.data === 'object' && 'items' in membersResponse.data && Array.isArray((membersResponse.data as any).items)) {
                    members = (membersResponse.data as any).items;
                } else {
                    members = [];
                }

                setGroupMembers(members);
            } else {
                toast.error(`Không thể tải danh sách thành viên: ${membersResponse.message}`);
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi tải thông tin nhóm");
        } finally {
            setIsLoadingGroupInfo(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;

        const newFiles = Array.from(files);

        // Validate file size (25MB limit as per API docs)
        const maxSize = 25 * 1024 * 1024; // 25MB
        const validFiles = newFiles.filter(file => {
            if (file.size > maxSize) {
                alert(`File "${file.name}" quá lớn. Kích thước tối đa là 25MB.`);
                return false;
            }
            return true;
        });

        // Create preview URLs for images
        const newPreviews = validFiles.map(file => ({
            url: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
            name: file.name,
            size: file.size,
            type: file.type
        }));

        setSelectedFiles(prev => [...prev, ...validFiles]);
        setFilePreviews(prev => [...prev, ...newPreviews]);
        setShowAttachmentPopup(false);
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setFilePreviews(prev => {
            const newPreviews = prev.filter((_, i) => i !== index);
            // Clean up URL for removed image
            if (prev[index]?.url) {
                URL.revokeObjectURL(prev[index].url);
            }
            return newPreviews;
        });
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() && selectedFiles.length === 0) return;
        if (!conversationId) return;

        const content = messageInput.trim();

        // Clear input immediately for better UX
        setMessageInput("");
        setIsUploading(true);

        try {
            let response;

            if (selectedFiles.length > 0) {
                // Upload files to conversation
                response = await uploadFilesToConversation(conversationId, selectedFiles);

                if (response.success) {
                    // Add messages to store
                    response.data.forEach(message => {
                        useCustomerStore.getState().addMessage(conversationId, message as unknown as Message);
                    });
                } else {
                    toast.error("Không thể gửi file");
                }
            } else if (content) {
                // Send text message using the same API as personal chat
                response = await sendConversationMessage(conversationId, {
                    content: content,
                });

                if (response.success) {
                    const msg = response.data as Message;
                    if (!msg || !msg.id || !msg.content || !msg.sender) {
                        console.error("Invalid message structure:", msg);
                        return;
                    }
                    useCustomerStore.getState().addMessage(conversationId, msg);
                } else {
                    toast.error("Không thể gửi tin nhắn");
                }
            }

            // Clear selected files after successful send
            setSelectedFiles([]);
            // Clean up preview URLs
            filePreviews.forEach(preview => {
                if (preview.url) {
                    URL.revokeObjectURL(preview.url);
                }
            });
            setFilePreviews([]);
        } catch (err) {
            console.error("Send message error:", err);
            // Restore the message input if failed
            setMessageInput(content);
        } finally {
            setIsUploading(false);
        }
    };

    const handleBackToGroups = () => {
        clearActiveChat();
        router.push('/groups');
    };

    const handleSaveGroupEdit = () => {
        // TODO: Implement group edit API
        toast.success("Đã lưu thay đổi!");
        setShowEditGroup(false);
    };

    const handleLeaveGroup = () => {
        // TODO: Implement leave group API
        toast.success("Đã rời khỏi nhóm!");
        setShowLeaveGroup(false);
        clearActiveChat();
        router.push('/groups');
    };

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1">
                    <TabsTrigger value="chat" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Trò chuyện
                    </TabsTrigger>
                    <TabsTrigger value="posts" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                        <FileText className="h-4 w-4 mr-2" />
                        Bài đăng
                    </TabsTrigger>
                </TabsList>

                {/* Debug info - remove this later */}
                <div className="text-xs text-muted-foreground p-2 bg-yellow-50 dark:bg-yellow-900/20">
                    Active Tab: {activeTab} | Group ID: {groupId}
                </div>

                {/* Chat Tab */}
                <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
                    {/* Messages */}
                    <div className="flex-1 overflow-hidden">
                        {isLoadingConversation ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                    <p className="text-sm text-muted-foreground">Đang tải cuộc hội thoại...</p>
                                </div>
                            </div>
                        ) : conversationId ? (
                            <MessageList
                                conversationId={conversationId}
                                partnerName={groupName}
                                partnerAvatar={groupAvatar}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">Không thể tải cuộc hội thoại</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* File Preview */}
                    {selectedFiles.length > 0 && (
                        <FilePreviewGallery
                            files={filePreviews}
                            onRemoveFile={removeFile}
                            onRemoveAll={() => {
                                setSelectedFiles([]);
                                filePreviews.forEach(preview => {
                                    if (preview.url) {
                                        URL.revokeObjectURL(preview.url);
                                    }
                                });
                                setFilePreviews([]);
                            }}
                        />
                    )}

                    {/* Message input */}
                    <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
                        <div className="flex items-end gap-2">
                            {/* Message Input */}
                            <div className="relative flex-1">
                                <Input
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder={`Nhập tin nhắn vào ${groupName}...`}
                                    className="min-h-[40px] resize-none"
                                    disabled={isUploading}
                                />
                            </div>

                            {/* Attachment button */}
                            <div className="relative attachment-popup-container">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAttachmentPopup(!showAttachmentPopup)}
                                    className="h-10 w-10 p-0"
                                    disabled={isUploading}
                                >
                                    <Paperclip className="h-4 w-4" />
                                </Button>

                                {/* Enhanced Attachment Popup */}
                                {showAttachmentPopup && (
                                    <div className="absolute bottom-full right-0 mb-3 p-4 bg-background border rounded-xl shadow-2xl z-50 min-w-[320px]">
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-sm text-foreground">Đính kèm tệp</h3>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 hover:bg-muted"
                                                onClick={() => setShowAttachmentPopup(false)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        {/* Attachment Options Grid */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start gap-3 h-auto p-4 hover:scale-105 transition-all duration-200 bg-blue-50 dark:bg-blue-950/20 hover:shadow-md border border-transparent hover:border-border"
                                                onClick={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = 'image/*';
                                                    input.multiple = true;
                                                    input.onchange = (e) => handleFileSelect((e.target as HTMLInputElement).files);
                                                    input.click();
                                                }}
                                            >
                                                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                                                    <Image className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-medium text-sm text-blue-600 dark:text-blue-400">
                                                        Hình ảnh
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Chia sẻ ảnh
                                                    </div>
                                                </div>
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start gap-3 h-auto p-4 hover:scale-105 transition-all duration-200 bg-gray-50 dark:bg-gray-950/20 hover:shadow-md border border-transparent hover:border-border"
                                                onClick={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.multiple = true;
                                                    input.onchange = (e) => handleFileSelect((e.target as HTMLInputElement).files);
                                                    input.click();
                                                }}
                                            >
                                                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-950/20">
                                                    <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-medium text-sm text-gray-600 dark:text-gray-400">
                                                        File khác
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Gửi file bất kỳ
                                                    </div>
                                                </div>
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start gap-3 h-auto p-4 hover:scale-105 transition-all duration-200 bg-green-50 dark:bg-green-950/20 hover:shadow-md border border-transparent hover:border-border"
                                                onClick={() => {
                                                    setShowAttachmentPopup(false);
                                                    setShowCreatePoll(true);
                                                }}
                                            >
                                                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
                                                    <BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-medium text-sm text-green-600 dark:text-green-400">
                                                        Tạo cuộc bình chọn
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Tạo bình chọn mới
                                                    </div>
                                                </div>
                                            </Button>
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-4 pt-3 border-t border-border">
                                            <p className="text-xs text-muted-foreground text-center">
                                                Tối đa 25MB cho mỗi file
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Send button */}
                            <Button
                                onClick={handleSendMessage}
                                disabled={(!messageInput.trim() && selectedFiles.length === 0) || isUploading}
                                className="h-10 w-10 p-0"
                            >
                                {isUploading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* Posts Tab */}
                <TabsContent value="posts" className="flex-1 mt-0">
                    <GroupPosts groupId={groupId} groupName={groupName} />
                </TabsContent>
            </Tabs>

            {/* Enhanced Group Details Dialog */}
            <Dialog open={showGroupInfo} onOpenChange={setShowGroupInfo}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0 overflow-hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Thông tin nhóm</DialogTitle>
                        <DialogDescription>
                            Chi tiết thông tin về nhóm và thành viên.
                        </DialogDescription>
                    </DialogHeader>
                    {/* Hero Section with Background */}
                    <div className="relative h-48 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent"></div>
                        </div>

                        {/* Header Content */}
                        <div className="relative z-10 h-full flex items-end p-6">
                            <div className="flex items-end gap-6 w-full">
                                <Avatar className="h-24 w-24 border-4 border-white/30 shadow-2xl">
                                    <AvatarImage src={groupAvatar || groupDetails?.groupAvatarUrl} />
                                    <AvatarFallback className="text-3xl font-bold bg-white/20 text-white">
                                        {(groupName || groupDetails?.groupName)?.split(' ').map((n: string) => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 mb-2">
                                    <h2 className="text-3xl font-bold text-white mb-2">{groupName || groupDetails?.groupName}</h2>
                                    <div className="flex items-center gap-4 text-white/90">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            <span className="text-lg">
                                                {groupMembers.length > 0 ? groupMembers.length : (groupDetails?.memberCount || memberCount)} thành viên
                                            </span>
                                        </div>
                                        {groupDetails?.groupType && (
                                            <>
                                                <span className="text-white/50">•</span>
                                                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-sm px-3 py-1">
                                                    {groupDetails.groupType === "Private" ? "🔒 Riêng tư" : "🌐 Công khai"}
                                                </Badge>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 mb-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                                        onClick={() => {
                                            setShowGroupInfo(false);
                                            setShowInviteMembers(true);
                                        }}
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Mời thành viên
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                                        onClick={() => {
                                            setShowGroupInfo(false);
                                            setShowEditGroup(true);
                                        }}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Chỉnh sửa
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="p-6 space-y-8">
                        {/* Group Description */}
                        {(groupDescription || groupDetails?.description) && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30">
                                <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-3">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                    Mô tả nhóm
                                </h3>
                                <p className="text-blue-600 dark:text-blue-200 leading-relaxed text-base">
                                    {groupDescription || groupDetails?.description}
                                </p>
                            </div>
                        )}

                        {/* Group Statistics */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full" />
                                Thống kê nhóm
                            </h3>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl border border-green-100 dark:border-green-900/30 hover:shadow-lg transition-all duration-300">
                                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                                        {groupMembers.length > 0 ? groupMembers.length : (groupDetails?.memberCount || memberCount)}
                                    </div>
                                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">Tổng thành viên</div>
                                </div>
                                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/30 hover:shadow-lg transition-all duration-300">
                                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                                        {Array.isArray(groupMembers) ? groupMembers.filter(m => m.presenceStatus === "Online").length : 0}
                                    </div>
                                    <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Đang online</div>
                                </div>
                                <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-2xl border border-orange-100 dark:border-orange-900/30 hover:shadow-lg transition-all duration-300">
                                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                                        {Array.isArray(groupMembers) ? groupMembers.filter(m => m.role === "admin" || m.role === "Admin").length : 0}
                                    </div>
                                    <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">Quản trị viên</div>
                                </div>
                                <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 rounded-2xl border border-pink-100 dark:border-pink-900/30 hover:shadow-lg transition-all duration-300">
                                    <div className="text-3xl font-bold text-pink-600 dark:text-pink-400 mb-2">
                                        {Array.isArray(groupMembers) ? groupMembers.filter(m => m.role === "moderator" || m.role === "Moderator").length : 0}
                                    </div>
                                    <div className="text-sm text-pink-600 dark:text-pink-400 font-medium">Điều hành viên</div>
                                </div>
                            </div>
                        </div>

                        {/* Members Section */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-600" />
                                    Thành viên nhóm
                                    <Badge variant="outline" className="ml-2 text-sm">
                                        {Array.isArray(groupMembers) ? groupMembers.length : 0} người
                                    </Badge>
                                </h3>

                                {/* Search and Filter */}
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Tìm thành viên..."
                                        className="w-48 h-9 text-sm"
                                    />
                                    <Button variant="outline" size="sm" className="h-9">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {isLoadingGroupInfo ? (
                                <div className="space-y-4">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 animate-pulse">
                                            <div className="h-14 w-14 bg-muted rounded-full" />
                                            <div className="flex-1 space-y-3">
                                                <div className="h-4 bg-muted rounded w-1/3" />
                                                <div className="h-3 bg-muted rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <ScrollArea className="h-96">
                                    <div className="space-y-3">
                                        {Array.isArray(groupMembers) && groupMembers.map((member, index) => (
                                            <div key={member.userId}
                                                className="group flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-border hover:bg-muted/30 transition-all duration-300 hover:shadow-md">
                                                <div className="relative">
                                                    <Avatar className="h-14 w-14 ring-2 ring-offset-2 ring-transparent group-hover:ring-blue-200 dark:group-hover:ring-blue-800 transition-all">
                                                        <AvatarImage src={member.avatarUrl} />
                                                        <AvatarFallback className="font-semibold text-lg">
                                                            {member.fullName.split(' ').map(n => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className={cn(
                                                        "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-background shadow-sm",
                                                        member.presenceStatus === "Online" ? "bg-green-500" : "bg-gray-400"
                                                    )} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <p className="font-semibold text-lg truncate">{member.fullName}</p>
                                                        {(member.role === "admin" || member.role === "Admin") && (
                                                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200">
                                                                👑 Admin
                                                            </Badge>
                                                        )}
                                                        {(member.role === "moderator" || member.role === "Moderator") && (
                                                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200">
                                                                🛡️ Mod
                                                            </Badge>
                                                        )}
                                                        {(member.role === "member" || member.role === "Member") && (
                                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200">
                                                                👤 Thành viên
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="flex justify-center gap-4 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowGroupInfo(false);
                                    setShowInviteMembers(true);
                                }}
                                className="flex items-center gap-2"
                            >
                                <UserPlus className="h-4 w-4" />
                                Mời thành viên mới
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowGroupInfo(false);
                                    setShowEditGroup(true);
                                }}
                                className="flex items-center gap-2"
                            >
                                <Edit className="h-4 w-4" />
                                Chỉnh sửa nhóm
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    setShowGroupInfo(false);
                                    setShowLeaveGroup(true);
                                }}
                                className="flex items-center gap-2"
                            >
                                <LogOut className="h-4 w-4" />
                                Rời nhóm
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Group Dialog */}
            <Dialog open={showEditGroup} onOpenChange={setShowEditGroup}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa nhóm</DialogTitle>
                        <DialogDescription>
                            Cập nhật thông tin nhóm và cài đặt.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Group Avatar */}
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={groupAvatar || groupDetails?.groupAvatarUrl} />
                                <AvatarFallback>
                                    {editGroupName.split(' ').map((n: string) => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <Button variant="outline" size="sm">
                                Thay đổi ảnh đại diện
                            </Button>
                        </div>

                        {/* Group Name */}
                        <div className="space-y-2">
                            <Label htmlFor="groupName">Tên nhóm</Label>
                            <Input
                                id="groupName"
                                value={editGroupName}
                                onChange={(e) => setEditGroupName(e.target.value)}
                                placeholder="Nhập tên nhóm"
                            />
                        </div>

                        {/* Group Description */}
                        <div className="space-y-2">
                            <Label htmlFor="groupDescription">Mô tả nhóm</Label>
                            <Textarea
                                id="groupDescription"
                                value={editGroupDescription}
                                onChange={(e) => setEditGroupDescription(e.target.value)}
                                placeholder="Nhập mô tả nhóm"
                                rows={3}
                            />
                        </div>

                        {/* Group Privacy */}
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="groupPrivacy"
                                checked={editGroupIsPrivate}
                                onCheckedChange={setEditGroupIsPrivate}
                            />
                            <Label htmlFor="groupPrivacy">Nhóm riêng tư</Label>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowEditGroup(false)}>
                                Hủy
                            </Button>
                            <Button onClick={handleSaveGroupEdit}>
                                Lưu thay đổi
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Invite Members Dialog */}
            <InviteMembersDialog
                isOpen={showInviteMembers}
                onClose={() => setShowInviteMembers(false)}
                groupId={groupId}
                groupName={groupName}
            />

            {/* Leave Group Dialog */}
            <Dialog open={showLeaveGroup} onOpenChange={setShowLeaveGroup}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Rời khỏi nhóm</DialogTitle>
                        <DialogDescription>
                            Xác nhận rời khỏi nhóm và các hậu quả.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Bạn có chắc chắn muốn rời khỏi nhóm "{groupName}"?
                            Bạn sẽ không thể xem tin nhắn và tham gia các hoạt động của nhóm nữa.
                        </p>

                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowLeaveGroup(false)}>
                                Hủy
                            </Button>
                            <Button variant="destructive" onClick={handleLeaveGroup}>
                                Rời nhóm
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create Poll Dialog */}
            <CreatePollDialog
                isOpen={showCreatePoll}
                onClose={() => setShowCreatePoll(false)}
                conversationId={conversationId}
            />
        </div>
    );
}
