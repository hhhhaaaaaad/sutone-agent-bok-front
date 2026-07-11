import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const session = request.cookies.get("ai_agent_login")?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");

  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/drafts", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next|static|favicon).*)"],
};
