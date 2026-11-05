import { describe, expect, it } from "vitest";
import { bottomTabs, moreLinks, sidebarSections } from "./items";

// CLAUDE.md: mobile tabs are Home, Timeline, Add, Accounts, More, each an icon with a short label.
describe("navigation model", () => {
  it("has the five mobile tabs in order, the centre one being Add", () => {
    expect(bottomTabs.map((t) => t.label)).toEqual(["Home", "Timeline", "Add", "Accounts", "More"]);
    expect(bottomTabs[2].primary).toBe(true);
  });

  it("gives every tab an icon, a real route and a short label", () => {
    for (const tab of bottomTabs) {
      expect(tab.icon, tab.label).toBeTruthy();
      expect(tab.href).toMatch(/^\/[a-z-]+$/);
      expect(tab.label.length).toBeLessThanOrEqual(9);
    }
  });

  it("puts Forecast, What-if, Categories and Settings under More (DESIGN.md 4)", () => {
    expect(moreLinks.map((l) => l.label)).toEqual(["Forecast", "What-if simulator", "Categories", "Settings"]);
  });

  it("builds the desktop sidebar in DESIGN.md's sections", () => {
    expect(sidebarSections.map((s) => s.title)).toEqual(["Overview", "Money", "Planning", "Personal"]);
    const byTitle = Object.fromEntries(sidebarSections.map((s) => [s.title, s.items.map((i) => i.label)]));
    expect(byTitle).toEqual({
      Overview: ["Home"],
      Money: ["Accounts", "Transactions", "Income", "Expenses", "Commitments"],
      Planning: ["Cash-flow timeline", "Forecast", "What-if simulator"],
      Personal: ["Categories", "Settings"],
    });
  });

  it("uses unique routes", () => {
    const hrefs = sidebarSections.flatMap((s) => s.items.map((i) => i.href));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
