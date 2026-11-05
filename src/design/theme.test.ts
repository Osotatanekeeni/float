import { describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY, parsePreference, resolveTheme, themeInitScript } from "./theme";

describe("theme preference", () => {
  it("parses only known stored values, defaulting to system", () => {
    expect(parsePreference("light")).toBe("light");
    expect(parsePreference("dark")).toBe("dark");
    expect(parsePreference("system")).toBe("system");
    expect(parsePreference("purple")).toBe("system");
    expect(parsePreference(null)).toBe("system");
  });

  it("resolves system to the operating-system choice", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("ships an init script that sets data-theme before paint and survives blocked storage", () => {
    expect(themeInitScript).toContain(THEME_STORAGE_KEY);
    expect(themeInitScript).toContain("data-theme");
    expect(themeInitScript).toContain("prefers-color-scheme");
    expect(themeInitScript).toMatch(/try\s*{/);
    expect(() => new Function(themeInitScript)).not.toThrow();
  });
});
