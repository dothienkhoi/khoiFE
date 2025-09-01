"use client";

import { AdminNotificationDto, AdminNotificationType } from "@/types/api.types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import {
  UserPlus,
  AlertTriangle,
  Users,
  AlertCircle,
  LucideProps,
} from "lucide-react";
import React from "react";

interface NotificationItemProps {
  notification: AdminNotificationDto;
  onMarkAsRead: (id: number) => void;
}

// Configuration map for notifications
// This is more maintainable and separates concerns
const notificationConfig: Record<
  AdminNotificationType,
  { icon: React.FC<LucideProps>; className: string }
> = {
  NewUserRegistered: {
    icon: UserPlus,
    className: "text-success-foreground",
  },
  ContentReported: {
    icon: AlertTriangle,
    className: "text-destructive",
  },
  NewGroupCreated: {
    icon: Users,
    className: "text-primary",
  },
  BackgroundJobFailed: {
    icon: AlertCircle,
    className: "text-warning-foreground",
  },
  GeneralAnnouncement: {
    icon: AlertCircle,
    className: "text-primary",
  },
};

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  const timeAgo = formatDistanceToNow(parseISO(notification.timestamp), {
    addSuffix: true,
    locale: vi,
  });

  const config = notificationConfig[notification.notificationType] || {
    icon: AlertCircle,
    className: "text-muted-foreground",
  };
  const IconComponent = config.icon;

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer",
        notification.isRead
          ? "hover:bg-muted/50"
          : "bg-primary/10 hover:bg-primary/20 dark:bg-primary/10 dark:hover:bg-primary/20"
      )}
      onClick={handleClick}
    >
      {/* Notification Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <IconComponent className={cn("h-4 w-4", config.className)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "text-sm leading-relaxed",
            notification.isRead ? "text-muted-foreground" : "text-foreground font-medium"
          )}>
            {notification.message}
          </p>
          
          {/* Unread indicator */}
          {!notification.isRead && (
            <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
          )}
        </div>

        {/* Timestamp and triggered by user */}
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <span>{timeAgo}</span>
          {notification.triggeredByUserName && (
            <>
              <span>•</span>
              <span>by {notification.triggeredByUserName}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Wrap in Link if linkTo is provided
  if (notification.linkTo) {
    return (
      <Link href={notification.linkTo} className="block" legacyBehavior={false}>
        {content}
      </Link>
    );
  }

  return content;
}
