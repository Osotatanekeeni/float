import { NetworkOnly } from "serwist";
import { describe, expect, it } from "vitest";
import { OFFLINE_URL, runtimeCaching } from "./caching";

type Matcher = (ctx: { request: Request; url: URL; sameOrigin: boolean }) => boolean;

function cachedBy(path: string, destination = "") {
  const url = new URL(path, "https://float.example");
  const request = { url: url.href, destination, method: "GET", mode: destination === "document" ? "navigate" : "cors" } as unknown as Request;
  return runtimeCaching.filter((entry) => (entry.matcher as Matcher)({ request, url, sameOrigin: true }));
}

// PRD section 6 caching strategy + DESIGN.md 10: cache the shell and static assets only. Financial
// data must never land in the service worker cache, where it would survive sign-out.
describe("service worker runtime caching", () => {
  it("caches hashed build assets, fonts and images", () => {
    expect(cachedBy("/_next/static/chunks/app-1a2b3c.js", "script").length).toBeGreaterThan(0);
    expect(cachedBy("/_next/static/media/dm-sans.woff2", "font").length).toBeGreaterThan(0);
    expect(cachedBy("/icons/icon-192.png", "image").length).toBeGreaterThan(0);
  });

  it("never caches API responses", () => {
    for (const path of ["/api/me", "/api/snapshot", "/api/accounts?cursor=x", "/api/auth/session", "/api/ai/explain"]) {
      expect(cachedBy(path), path).toHaveLength(0);
    }
  });

  it("never caches page documents (they can carry personal data): navigations are network-only", () => {
    for (const path of ["/home", "/accounts/abc", "/sign-in"]) {
      const handlers = cachedBy(path, "document").map((entry) => entry.handler);
      expect(handlers.length, `${path} has a route, so the offline fallback can attach to it`).toBeGreaterThan(0);
      for (const handler of handlers) expect(handler, path).toBeInstanceOf(NetworkOnly);
    }
  });

  it("serves the offline page at a stable public URL", () => {
    expect(OFFLINE_URL).toBe("/~offline");
  });
});
