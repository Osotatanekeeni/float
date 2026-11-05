// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let pathname = "/home";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { Sidebar } from "./sidebar";

beforeEach(() => {
  pathname = "/home";
});

describe("Sidebar (DESIGN.md 4, about 224px)", () => {
  it("is a named landmark with four labelled sections", () => {
    render(<Sidebar />);
    const nav = screen.getByRole("navigation", { name: "Sidebar" });
    for (const title of ["Overview", "Money", "Planning", "Personal"]) {
      expect(within(nav).getByText(title)).toBeInTheDocument();
    }
    expect(within(nav).getAllByRole("link")).toHaveLength(11);
  });

  it("shows an icon and text for each link, with the icon hidden from assistive tech", () => {
    render(<Sidebar />);
    for (const link of screen.getAllByRole("link")) {
      expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      expect(link.textContent?.trim().length).toBeGreaterThan(0);
    }
  });

  it("marks the current page", () => {
    pathname = "/forecast";
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: "Forecast" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });

  it("is hidden below tablet width and 224px wide above it", () => {
    render(<Sidebar />);
    const cls = screen.getByRole("navigation", { name: "Sidebar" }).className;
    expect(cls).toContain("hidden");
    expect(cls).toContain("md:flex");
    expect(cls).toContain("w-56");
  });
});
