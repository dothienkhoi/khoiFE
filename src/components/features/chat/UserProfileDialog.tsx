import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface UserProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        id: string;
        displayName: string;
        avatar?: string;
        isOnline?: boolean;
    } | null;
}

const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
    isOpen,
    onClose,
    user
}) => {
    if (!user) return null;

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        Thông tin người dùng
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 overflow-y-auto max-h-[70vh]">
                    {/* Avatar và tên */}
                    <div className="text-center">
                        <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-gray-200 dark:ring-gray-700">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-gradient-to-r from-[#1447e6] to-[#ad46ff] text-white font-bold text-3xl">
                                {getInitials(user.displayName)}
                            </AvatarFallback>
                        </Avatar>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {user.displayName}
                        </h3>
                        <div className="flex items-center justify-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${user.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {user.isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
                            </span>
                        </div>
                    </div>

                    {/* Nút hành động */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            className="flex-1"
                            variant="outline"
                            onClick={() => {
                                // TODO: Implement start video call
                                onClose();
                            }}
                        >
                            Gọi video
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={() => {
                                // TODO: Implement start voice call
                                onClose();
                            }}
                        >
                            Gọi thoại
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UserProfileDialog;
