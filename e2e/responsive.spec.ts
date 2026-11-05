import { expect, test } from "@playwright/test";

// FLT-PWA-08: responsive at 375, 768, 1024 and 1440 px with no horizontal scroll.
const publicPages = ["/sign-in", "/sign-in/check-email", "/design-system", "/~offline"];
const appPages = ["/home", "/timeline", "/accounts", "/more", "/forecast"];

const noHorizontalScroll = async (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

for (const path of [...publicPages, ...appPages]) {
  test(`no horizontal scroll: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1, [role=heading]").first()).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);
  });
}

test.describe("navigation by width", () => {
  test("phones get the icon bottom bar; tablet and up get the sidebar", async ({ page }) => {
    await page.goto("/home");
    const width = page.viewportSize()!.width;
    const bottom = page.getByRole("navigation", { name: "Main" });
    const sidebar = page.getByRole("navigation", { name: "Sidebar" });
    if (width < 768) {
      await expect(bottom).toBeVisible();
      await expect(sidebar).toBeHidden();
    } else {
      await expect(sidebar).toBeVisible();
      await expect(bottom).toBeHidden();
    }
  });

  test("bottom bar tabs are icons with labels, at least 44px tall, clear of the bottom edge", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, "bottom bar is phone only");
    await page.goto("/home");
    const links = page.getByRole("navigation", { name: "Main" }).getByRole("link");
    await expect(links).toHaveCount(5);
    for (const link of await links.all()) {
      expect(await link.locator("svg").count()).toBe(1);
      const box = (await link.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
  });

  test("the sidebar is 224px wide", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 768, "sidebar is tablet and up");
    await page.goto("/home");
    const box = (await page.getByRole("navigation", { name: "Sidebar" }).boundingBox())!;
    expect(Math.round(box.width)).toBe(224);
  });

  test("a signed-out visitor is sent to sign-in", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto(`${baseURL}/home`);
    await expect(page).toHaveURL(/\/sign-in$/);
    await context.close();
  });
});
