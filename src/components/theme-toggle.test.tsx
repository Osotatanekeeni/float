// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_STORAGE_KEY } from "@/design/theme";
import { ThemeToggle } from "./theme-toggle";

function mockSystemDark(dark: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: dark && query.includes("dark"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  mockSystemDark(false);
});

afterEach(() => vi.unstubAllGlobals());

describe("ThemeToggle", () => {
  it("offers light, dark and system as named buttons", () => {
    render(<ThemeToggle />);
    for (const name of ["Light theme", "Dark theme", "System theme"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("selecting dark sets data-theme and persists the preference", async () => {
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button", { name: "Dark theme" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(screen.getByRole("button", { name: "Dark theme" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Light theme" })).toHaveAttribute("aria-pressed", "false");
  });

  it("system follows the operating system choice", async () => {
    mockSystemDark(true);
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button", { name: "System theme" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("restores the stored preference on mount", async () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    render(<ThemeToggle />);
    expect(await screen.findByRole("button", { name: "Dark theme" })).toHaveAttribute("aria-pressed", "true");
  });

  it("still works when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button", { name: "Dark theme" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });
});
