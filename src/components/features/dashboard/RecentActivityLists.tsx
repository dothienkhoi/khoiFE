import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RecentUser, RecentGroup } from "@/types/api.types";
import { format, parseISO } from "date-fns";
import { Users, MessageCircle } from "lucide-react";

interface RecentActivityListsProps {
  recentUsers: RecentUser[];
  recentGroups: RecentGroup[];
}

export function RecentActivityLists({ recentUsers, recentGroups }: RecentActivityListsProps) {
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "dd/MM/yyyy HH:mm");
  };

  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Recent Users */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-base font-medium">
            Người dùng mới nhất
          </CardTitle>
          <Users className="ml-auto h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentUsers.length > 0 ? (
              recentUsers.map((user) => (
                <div key={user.userId} className="flex items-center space-x-4">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Chưa có người dùng mới
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Groups */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-base font-medium">
            Nhóm mới nhất
          </CardTitle>
          <MessageCircle className="ml-auto h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentGroups.length > 0 ? (
              recentGroups.map((group) => (
                <div key={group.groupId} className="flex items-center space-x-4">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs">
                      {getInitials(group.groupName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {group.groupName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(group.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Chưa có nhóm mới
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
