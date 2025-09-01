// components/shared/ErrorDisplay.tsx
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
  error: Error;
  retry?: () => void;
  title?: string;
  subtitle?: string;
}

export function ErrorDisplay({ 
  error, 
  retry, 
  title = "Không thể tải dữ liệu",
  subtitle 
}: ErrorDisplayProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-medium text-destructive mb-2">
            {title}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {error.message || "Đã xảy ra lỗi không xác định"}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mb-4">
              {subtitle}
            </p>
          )}
          {retry && (
            <button
              onClick={retry}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Thử lại
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
