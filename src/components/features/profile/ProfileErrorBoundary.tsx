"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ProfileErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ProfileErrorBoundaryProps {
    children: React.ReactNode;
}

export class ProfileErrorBoundary extends React.Component<ProfileErrorBoundaryProps, ProfileErrorBoundaryState> {
    constructor(props: ProfileErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ProfileErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Profile Error Boundary caught an error:", error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-4 p-8">
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full mx-auto w-16 h-16 flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                                Đã xảy ra lỗi
                            </h2>
                            <p className="text-sm text-muted-foreground mb-4">
                                Có vẻ như đã xảy ra lỗi khi tải trang hồ sơ. Vui lòng thử lại.
                            </p>
                            {this.state.error && (
                                <details className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                    <summary className="cursor-pointer">Chi tiết lỗi</summary>
                                    <pre className="mt-2 text-left overflow-auto">
                                        {this.state.error.message}
                                    </pre>
                                </details>
                            )}
                        </div>
                        <div className="flex gap-3 justify-center">
                            <Button
                                onClick={this.handleRetry}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Thử lại
                            </Button>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                Tải lại trang
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

