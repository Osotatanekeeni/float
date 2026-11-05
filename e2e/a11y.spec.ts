import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// WCAG 2.2 AA with real rendered colours (jsdom cannot measure contrast), in both themes.
const pages = ["/sign-in", "/sign-in/check-email", "/design-system", "/~offline", "/home", "/timeline", "/more"];

for (const theme of ["light", "dark"] as const) {
  for (const path of pages) {
    test(`axe: ${path} (${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("float-theme", t), theme);
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.locator("h1, [role=heading]").first()).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
    });
  }
}
