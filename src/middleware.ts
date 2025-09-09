// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET || "default-secret-key-for-development-only";
  return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get("auth_token")?.value;

  const publicRoutes = [
    "/login",
    "/register",
    "/",
    "/confirm-email",
    "/forgot-password",
  ];

  // Allow access to invite pages without authentication for preview
  if (pathname.startsWith("/invite")) {
    return NextResponse.next();
  }

  if (publicRoutes.includes(pathname) && !authToken) {
    return NextResponse.next();
  }

  if (!authToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(authToken, getJwtSecretKey());
    const role = payload[
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
    ] as string;

    if (pathname.startsWith("/admin") && role !== "Admin") {
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    if (publicRoutes.includes(pathname)) {
      if (role === "Admin") {
        return NextResponse.redirect(new URL("/admin/", request.url));
      } else {
        return NextResponse.redirect(new URL("/chat", request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware JWT verification failed:", error);
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth_token");
    return response;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
