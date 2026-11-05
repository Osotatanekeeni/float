import { CacheFirst, ExpirationPlugin, NetworkOnly, StaleWhileRevalidate, type RuntimeCaching } from "serwist";

export const OFFLINE_URL = "/~offline";

const day = 24 * 60 * 60;

// Static assets only. API responses and page documents can carry personal financial data, and a service
// worker cache would keep them after sign-out, so neither is cached here (the offline snapshot, later,
// lives in IndexedDB where sign-out can clear it). Navigations fall back to the offline page instead.
export const runtimeCaching: RuntimeCaching[] = [
  {
    // Nothing is stored; the route exists so that a failed navigation reaches the offline fallback, which
    // Serwist only applies to requests that some route handled.
    matcher: ({ request }) => request.mode === "navigate",
    handler: new NetworkOnly(),
  },
  {
    matcher: ({ url }) => url.pathname.startsWith("/_next/static/"),
    handler: new CacheFirst({
      cacheName: "float-build-assets",
      plugins: [new ExpirationPlugin({ maxEntries: 128, maxAgeSeconds: 365 * day })],
    }),
  },
  {
    matcher: ({ request, url }) =>
      !url.pathname.startsWith("/api/") && (request.destination === "font" || request.destination === "image"),
    handler: new StaleWhileRevalidate({
      cacheName: "float-static-media",
      plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 30 * day })],
    }),
  },
];
