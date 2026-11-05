// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/home" }));

import { AppShell } from "./app-shell";

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  );
});

describe("AppShell", () => {
  it("provides one main landmark holding the page, a skip link, the sidebar and the bottom nav", () => {
    render(
      <AppShell>
        <h1>Page</h1>
      </AppShell>,
    );
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("main")).toContainElement(screen.getByRole("heading", { name: "Page" }));
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
    expect(screen.getByRole("navigation", { name: "Sidebar" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
  });

  it("reserves room above the fixed bottom nav on phones, including the safe area", () => {
    render(<AppShell>content</AppShell>);
    expect(screen.getByRole("main").parentElement!.className).toMatch(/pb-\[calc\(.*safe-area-inset-bottom.*\)\]/);
  });

  it("puts the theme toggle and a quick-add link in the desktop top bar", () => {
    render(<AppShell>content</AppShell>);
    expect(screen.getByRole("group", { name: "Theme" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Quick add" })).toHaveAttribute("href", "/add");
  });
});
