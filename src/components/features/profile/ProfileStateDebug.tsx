"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Bug } from "lucide-react";
import { useProfile } from "@/components/providers/ProfileProvider";

export function ProfileStateDebug() {
    const { userProfile, isLoading, error, isRefreshing } = useProfile();

    if (process.env.NODE_ENV === "production") {
        return null;
    }

    return (
        <Card className="border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
                    <Bug className="h-4 w-4" />
                    Profile State Debug
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <span className="font-medium">Status:</span>
                        <Badge
                            variant={isLoading ? "secondary" : error ? "destructive" : "default"}
                            className="ml-2 text-xs"
                        >
                            {isLoading ? "Loading" : error ? "Error" : "Ready"}
                        </Badge>
                    </div>
                    <div>
                        <span className="font-medium">Refreshing:</span>
                        <Badge variant={isRefreshing ? "default" : "secondary"} className="ml-2 text-xs">
                            {isRefreshing ? "Yes" : "No"}
                        </Badge>
                    </div>
                </div>

                {userProfile && (
                    <div className="space-y-2">
                        <div>
                            <span className="font-medium">firstName:</span>
                            <span className="ml-2 text-muted-foreground">
                                {userProfile.firstName || "null"}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium">lastName:</span>
                            <span className="ml-2 text-muted-foreground">
                                {userProfile.lastName || "null"}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium">dateOfBirth:</span>
                            <span className="ml-2 text-muted-foreground">
                                {userProfile.dateOfBirth || "null"}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium">bio:</span>
                            <span className="ml-2 text-muted-foreground">
                                {userProfile.bio || "null"}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium">twoFactorEnabled:</span>
                            <span className="ml-2 text-muted-foreground">
                                {userProfile.twoFactorEnabled ? "true" : "false"}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium">fullName:</span>
                            <span className="ml-2 text-muted-foreground">
                                {userProfile.fullName || "null"}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium">email:</span>
                            <span className="ml-2 text-muted-foreground">
                                {userProfile.email || "null"}
                            </span>
                        </div>
                    </div>
                )}

                <div className="pt-2 border-t">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full text-xs p-2 bg-red-100 hover:bg-red-200 rounded border border-red-300"
                    >
                        <RefreshCw className="h-3 w-3 mr-1 inline" />
                        Reload Page
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}
