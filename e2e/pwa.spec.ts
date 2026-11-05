import { expect, test } from "@playwright/test";

// FLT-PWA-01, 02, 05. Chromium only: the service worker and install checks do not vary by viewport.
test.describe("PWA", () => {
  test.skip(({ viewport }) => viewport?.width !== 1024, "run once, not per viewport");

  test("serves an installable manifest whose icons all load", async ({ page, request, baseURL }) => {
    await page.goto("/~offline"); // public and never redirects, unlike /sign-in for a signed-in user
    const href = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(href).toBeTruthy();
    const manifest = await (await request.get(new URL(href!, baseURL).toString())).json();
    expect(manifest).toMatchObject({ name: "Float", start_url: "/home", display: "standalone" });
    for (const icon of manifest.icons) {
      const res = await request.get(new URL(icon.src, baseURL).toString());
      expect(res.status(), icon.src).toBe(200);
      expect(res.headers()["content-type"]).toContain("image/png");
    }
    expect(manifest.icons.some((i: { purpose: string; sizes: string }) => i.purpose === "maskable" && i.sizes === "512x512")).toBe(true);
  });

  test("registers a service worker that takes control", async ({ page }) => {
    await page.goto("/~offline"); // public and never redirects, unlike /sign-in for a signed-in user
    const controlled = await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }));
      }
      return Boolean(navigator.serviceWorker.controller);
    });
    expect(controlled).toBe(true);
  });

  test("shows the offline page, not a browser error, for a page that was never loaded", async ({ page, context }) => {
    await page.goto("/~offline"); // public and never redirects, unlike /sign-in for a signed-in user
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }));
      }
    });
    await context.setOffline(true);
    await page.goto("/design-system");
    await expect(page.getByRole("heading", { level: 1, name: /you are offline/i })).toBeVisible();
    await context.setOffline(false);
  });

  test("never serves API responses from a cache while offline", async ({ page, context }) => {
    await page.goto("/home");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      await fetch("/api/me"); // online: caches nothing if the policy holds
    });
    await context.setOffline(true);
    const outcome = await page.evaluate(() => fetch("/api/me").then((r) => `served ${r.status}`, () => "network error"));
    expect(outcome).toBe("network error");
    const cached = await page.evaluate(async () => {
      const names = await caches.keys();
      const hits: string[] = [];
      for (const name of names) for (const req of await (await caches.open(name)).keys()) if (new URL(req.url).pathname.startsWith("/api/")) hits.push(req.url);
      return hits;
    });
    expect(cached).toEqual([]);
    await context.setOffline(false);
  });
});
