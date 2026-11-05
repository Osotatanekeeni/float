import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api-error";
import { accessDecision } from "@/server/auth/access";

export function proxy(request: NextRequest) {
  const cookies = new Set(request.cookies.getAll().map((c) => c.name));
  const decision = accessDecision(request.nextUrl.pathname, cookies);
  if (decision === "unauthorized") return apiError(401, "unauthenticated", "Sign in to continue");
  if (decision === "redirect") return NextResponse.redirect(new URL("/sign-in", request.url));
  return NextResponse.next();
}

export const config = {
  // Skip Next internals and static files; PWA assets (manifest, service worker, icons) are public.
  matcher: ["/((?!_next/|favicon.ico|manifest.webmanifest|sw.js|serwist/|icons/|.*\\.(?:png|svg|jpg|ico|webp|txt|json|js|css|woff2?)$).*)"],
};
