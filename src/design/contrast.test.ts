import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";
import { darkTokens, lightTokens, statusTokens, type ThemeTokens } from "./tokens";

describe("contrastRatio()", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
    expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.48, 1);
  });
});

const AA_TEXT = 4.5;
const AA_UI = 3;

const surfaces = (t: ThemeTokens) => [t.appBackground, t.surface, t.surfaceSecondary, t.surfaceTertiary];

describe.each([
  ["light", lightTokens],
  ["dark", darkTokens],
] as const)("%s theme text contrast (WCAG 2.2 AA)", (_name, t) => {
  it("primary and secondary text reach 4.5:1 on every surface", () => {
    for (const bg of surfaces(t)) {
      expect(contrastRatio(t.textPrimary, bg)).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrastRatio(t.textSecondary, bg)).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  it("muted text reaches 4.5:1 on every surface", () => {
    for (const bg of surfaces(t)) {
      expect(contrastRatio(t.textMuted, bg)).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  it("brand text reaches 4.5:1 on surfaces and on brand-soft", () => {
    for (const bg of [...surfaces(t), t.brandSoft]) {
      expect(contrastRatio(t.brandPrimary, bg)).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  it("primary button label reaches 4.5:1 on the brand colour and its hover", () => {
    expect(contrastRatio(t.onBrand, t.brandPrimary)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(t.onBrand, t.brandHover)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("strong borders and focus ring reach 3:1 against the app background (non-text UI)", () => {
    expect(contrastRatio(t.focusRing, t.appBackground)).toBeGreaterThanOrEqual(AA_UI);
    expect(contrastRatio(t.focusRing, t.surface)).toBeGreaterThanOrEqual(AA_UI);
  });
});

describe("financial status colours", () => {
  const themes = [
    ["light", statusTokens.light],
    ["dark", statusTokens.dark],
  ] as const;

  const states = ["available", "income", "planned", "caution", "shortfall", "info"] as const;

  it.each(themes.flatMap(([name, set]) => states.map((s) => [name, s, set[s]] as const)))(
    "%s %s: text reaches 4.5:1 on its background",
    (_theme, _state, pair) => {
      expect(contrastRatio(pair.text, pair.background)).toBeGreaterThanOrEqual(AA_TEXT);
    },
  );

  it("defines every state in both themes", () => {
    for (const [, set] of themes) expect(Object.keys(set).sort()).toEqual([...states].sort());
  });
});

describe("token values from DESIGN.md and the CLAUDE.md contrast fixes", () => {
  it("keeps the brand palette", () => {
    expect(lightTokens.brandPrimary).toBe("#235E62");
    expect(lightTokens.appBackground).toBe("#F8F7F1");
    expect(darkTokens.appBackground).toBe("#152321");
    expect(darkTokens.brandPrimary).toBe("#9BCFC1");
  });

  it("uses the corrected muted text colours", () => {
    expect(lightTokens.textMuted).toBe("#5E6862");
    expect(darkTokens.textMuted).toBe("#9AAFA6");
  });

  it("keeps sage and the accent decorative, with a text-safe accent for light surfaces", () => {
    expect(lightTokens.sage).toBe("#75A99A");
    expect(lightTokens.accent).toBe("#D6AA69");
    expect(lightTokens.accentText).toBe("#8A6326");
    expect(contrastRatio(lightTokens.accentText, lightTokens.surface)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});
