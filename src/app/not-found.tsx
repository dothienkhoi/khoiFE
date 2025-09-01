// app/not-found.tsx
import Link from "next/link";
import Image from "next/image"; // Import component Image
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6a11cb] to-[#2575fc] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center animate-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            404 - Không Tìm Thấy Trang
          </CardTitle>
          <CardDescription className="mt-2 text-lg">
            Rất tiếc, trang bạn tìm kiếm không tồn tại.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* === THÊM LẠI PHẦN IMAGE CỦA BẠN VÀO ĐÂY === */}
          <div className="my-8">
            <Image
              src="/images/error/404.svg"
              alt="404 Not Found"
              className="dark:hidden mx-auto"
              width={400}
              height={128}
            />
            <Image
              src="/images/error/404-dark.svg"
              alt="404 Not Found"
              className="hidden dark:block mx-auto"
              width={400}
              height={128}
            />
          </div>
          {/* ============================================== */}
          <Button asChild className="mt-8">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Quay về Trang Chủ
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
