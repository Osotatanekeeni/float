// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let pathname = "/home";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { BottomNav } from "./bottom-nav";

beforeEach(() => {
  pathname = "/home";
});

describe("BottomNav (CLAUDE.md: icon tabs, never text-only)", () => {
  it("is a named navigation landmark with five links", () => {
    render(<BottomNav />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getAllByRole("link")).toHaveLength(5);
  });

  it("gives every tab a Lucide icon hidden from assistive tech plus a visible short label", () => {
    render(<BottomNav />);
    for (const label of ["Home", "Timeline", "Add", "Accounts", "More"]) {
      const link = screen.getByRole("link", { name: label });
      const svg = link.querySelector("svg");
      expect(svg, label).not.toBeNull();
      expect(svg).toHaveAttribute("aria-hidden", "true");
      const text = within(link).getByText(label);
      expect(text.className).toContain("text-[0.6875rem]"); // 11px
    }
  });

  it("marks the current tab with aria-current and a non-colour cue", () => {
    pathname = "/timeline";
    render(<BottomNav />);
    const current = screen.getByRole("link", { name: "Timeline" });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current.className).toContain("font-semibold");
    for (const label of ["Home", "Add", "Accounts", "More"]) {
      expect(screen.getByRole("link", { name: label })).not.toHaveAttribute("aria-current");
    }
  });

  it("treats nested routes as the same tab", () => {
    pathname = "/accounts/abc-123";
    render(<BottomNav />);
    expect(screen.getByRole("link", { name: "Accounts" })).toHaveAttribute("aria-current", "page");
  });

  it("highlights More for the pages that live under it", () => {
    pathname = "/settings";
    render(<BottomNav />);
    expect(screen.getByRole("link", { name: "More" })).toHaveAttribute("aria-current", "page");
  });

  it("makes every tab at least 44px tall and respects the bottom safe area (FLT-PWA-07)", () => {
    render(<BottomNav />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav.className).toContain("pb-safe");
    expect(nav.className).toContain("fixed");
    for (const link of screen.getAllByRole("link")) expect(link.className).toContain("min-h-14");
  });

  it("is hidden from tablet width up, where the sidebar takes over", () => {
    render(<BottomNav />);
    expect(screen.getByRole("navigation", { name: "Main" }).className).toContain("md:hidden");
  });

  it("makes Add visually primary without relying on colour alone", () => {
    render(<BottomNav />);
    const add = screen.getByRole("link", { name: "Add" });
    expect(add.querySelector("[data-primary]")).not.toBeNull();
  });
});
