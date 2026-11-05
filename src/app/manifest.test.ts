import { describe, expect, it } from "vitest";
import manifest from "./manifest";
import { lightTokens } from "@/design/tokens";

// FLT-PWA-01
describe("web app manifest", () => {
  const m = manifest();

  it("is named Float, starts at /home and runs standalone", () => {
    expect(m.name).toBe("Float");
    expect(m.short_name).toBe("Float");
    expect(m.start_url).toBe("/home");
    expect(m.display).toBe("standalone");
    expect(m.scope).toBe("/");
  });

  it("uses the design tokens for its colours", () => {
    expect(m.theme_color).toBe(lightTokens.appBackground);
    expect(m.background_color).toBe(lightTokens.appBackground);
  });

  it("has maskable and plain icons at 192 and 512 px", () => {
    const icons = m.icons ?? [];
    for (const size of ["192x192", "512x512"]) {
      expect(icons.some((i) => i.sizes === size && i.purpose === "maskable"), `maskable ${size}`).toBe(true);
      expect(icons.some((i) => i.sizes === size && i.purpose === "any"), `any ${size}`).toBe(true);
    }
    for (const icon of icons) expect(icon.type).toBe("image/png");
  });

  it('offers the "Add expense" and "Can I afford..." shortcuts', () => {
    const names = (m.shortcuts ?? []).map((s) => s.name);
    expect(names).toEqual(["Add expense", "Can I afford..."]);
    for (const shortcut of m.shortcuts ?? []) expect(shortcut.url.startsWith("/")).toBe(true);
  });

  it("declares a language and finance category", () => {
    expect(m.lang).toBe("en");
    expect(m.categories).toContain("finance");
  });
});
