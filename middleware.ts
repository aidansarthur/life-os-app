import { NextResponse, type NextRequest } from "next/server";
import { AUTH_ACCESS_COOKIE, getUserFromRequest } from "@/lib/auth";

const protectedPaths = ["/", "/health", "/habits", "/school", "/finances", "/goals", "/calendar", "/reports", "/settings"];

function isProtectedPath(pathname: string) {
  return protectedPaths.some((path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)));
}

function isPublicPath(pathname: string) {
  return pathname === "/auth" || pathname.startsWith("/privacy") || pathname.startsWith("/api/auth") || pathname.startsWith("/_next") || pathname === "/favicon.ico";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    if (pathname === "/auth" && request.cookies.has(AUTH_ACCESS_COOKIE)) {
      const user = await getUserFromRequest(request);
      if (user) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    const authUrl = new URL("/auth", request.url);
    authUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(authUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"]
};


