"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { getMyGroups } from "@/lib/customer-api-client";

interface SimpleGroup {
    id: string;
    name: string;
    description?: string;
    avatarUrl?: string | null;
}

export function ProfileGroups() {
    const [isLoading, setIsLoading] = useState(true);
    const [groups, setGroups] = useState<SimpleGroup[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true);
                const response = await getMyGroups();
                if (response.success) {
                    const items = response.data.items.map((g) => ({
                        id: g.groupId,
                        name: g.groupName,
                        description: g.description,
                        avatarUrl: g.avatarUrl,
                    }));
                    setGroups(items);
                }
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    return (
        <Card className="border-0 shadow-md profile-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Users className="h-5 w-5" />
                    Nhóm của tôi
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Bạn chưa tham gia nhóm nào.</p>
                ) : (
                    <div className="space-y-3">
                        {groups.map((g) => (
                            <div key={g.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={g.avatarUrl || undefined} />
                                    <AvatarFallback className="bg-gradient-to-r from-[#ad46ff] to-[#1447e6] text-white font-semibold">
                                        {g.name?.charAt(0).toUpperCase() || "G"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{g.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{g.description || ""}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


