// lib/utils/messageUtils.ts

/**
 * Get message preview text based on message type and content
 * @param messageType - Type of message (Text, Image, File, System, Poll)
 * @param content - Message content
 * @param senderName - Name of the sender
 * @returns Formatted preview text
 */
export const getMessagePreview = (messageType: string, content: string, senderName: string): string => {
    switch (messageType) {
        case 'Image':
            return `${senderName} đã gửi một hình ảnh`;
        case 'File':
            return `${senderName} đã gửi một tệp`;
        case 'System':
            return content;
        case 'Poll':
            return `${senderName} đã tạo một cuộc thăm dò`;
        case 'Text':
        default:
            return content;
    }
};

/**
 * Get message type from file type
 * @param fileType - MIME type of the file
 * @returns Message type string
 */
export const getMessageTypeFromFile = (fileType: string): 'Image' | 'File' => {
    if (fileType.startsWith('image/')) {
        return 'Image';
    }
    return 'File';
};

/**
 * Get file extension from filename
 * @param filename - Name of the file
 * @returns File extension without dot
 */
export const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Get file type display name
 * @param filename - Name of the file
 * @param fileType - MIME type of the file
 * @returns Display name for file type
 */
export const getFileTypeDisplayName = (filename: string, fileType: string): string => {
    if (fileType.startsWith('image/')) {
        return 'Hình ảnh';
    }

    const extension = getFileExtension(filename);
    const extensionMap: Record<string, string> = {
        'pdf': 'Tài liệu PDF',
        'doc': 'Tài liệu Word',
        'docx': 'Tài liệu Word',
        'xls': 'Bảng tính Excel',
        'xlsx': 'Bảng tính Excel',
        'ppt': 'Trình chiếu PowerPoint',
        'pptx': 'Trình chiếu PowerPoint',
        'txt': 'Tệp văn bản',
        'zip': 'Tệp nén',
        'rar': 'Tệp nén',
        'mp3': 'Tệp âm thanh',
        'mp4': 'Tệp video',
        'avi': 'Tệp video',
        'mov': 'Tệp video'
    };

    return extensionMap[extension] || 'Tệp';
};
