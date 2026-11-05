export const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"] as const;

const PUBLIC_EXACT = new Set(["/", "/sign-in", "/design-system", "/~offline", "/manifest.webmanifest"]);
const PUBLIC_PREFIXES = ["/sign-in/", "/api/auth/", "/serwist/"];

export type AccessDecision = "allow" | "redirect" | "unauthorized";

/**
 * First, cheap gate used by proxy.ts: anything not on the public list needs a session cookie.
 * It only checks the cookie exists; the page or handler still verifies the session in the database
 * (requireUserId / withAuth), which is what actually authorises. Deny by default means a new route
 * is protected even if its author forgets.
 */
export function accessDecision(pathname: string, cookieNames: ReadonlySet<string>): AccessDecision {
  const path = pathname.includes("..") ? "/__invalid" : pathname;
  if (PUBLIC_EXACT.has(path) || PUBLIC_PREFIXES.some((p) => path.startsWith(p))) return "allow";
  if (SESSION_COOKIE_NAMES.some((name) => cookieNames.has(name))) return "allow";
  return path === "/api" || path.startsWith("/api/") ? "unauthorized" : "redirect";
}
