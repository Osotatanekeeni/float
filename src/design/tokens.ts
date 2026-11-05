// Source of truth for colour. globals.css mirrors these values; tokens-sync.test.ts keeps them equal.
// Corrections to DESIGN.md come from CLAUDE.md (muted text, decorative sage and accent).

export interface ThemeTokens {
  brandPrimary: string;
  brandSecondary: string;
  brandHover: string;
  brandSoft: string;
  brandSubtle: string;
  onBrand: string;
  appBackground: string;
  surface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentText: string;
  sage: string;
  focusRing: string;
}

export const lightTokens: ThemeTokens = {
  brandPrimary: "#235E62",
  brandSecondary: "#477F77",
  brandHover: "#194A4E",
  brandSoft: "#DCEBE5",
  brandSubtle: "#EFF5F1",
  onBrand: "#FFFFFF",
  appBackground: "#F8F7F1",
  surface: "#FFFFFF",
  surfaceSecondary: "#F0F2EC",
  surfaceTertiary: "#E8ECE5",
  textPrimary: "#292F2D",
  textSecondary: "#59645F",
  textMuted: "#5E6862",
  border: "#E2E6DF",
  borderStrong: "#CBD5CC",
  accent: "#D6AA69",
  accentText: "#8A6326",
  sage: "#75A99A",
  focusRing: "#235E62",
};

export const darkTokens: ThemeTokens = {
  brandPrimary: "#9BCFC1",
  brandSecondary: "#78B5A6",
  brandHover: "#B5DED2",
  brandSoft: "#29413B",
  brandSubtle: "#1D2D29",
  onBrand: "#152321",
  appBackground: "#152321",
  surface: "#1D2D29",
  surfaceSecondary: "#253731",
  surfaceTertiary: "#2B4039",
  textPrimary: "#EAF3EF",
  textSecondary: "#B9CCC5",
  textMuted: "#9AAFA6",
  border: "#30433C",
  borderStrong: "#435A50",
  accent: "#D8B77C",
  accentText: "#D8B77C",
  sage: "#78B5A6",
  focusRing: "#9BCFC1",
};

export interface StatusPair {
  background: string;
  text: string;
}

export type StatusState = "available" | "income" | "planned" | "caution" | "shortfall" | "info";

export const statusTokens: Record<"light" | "dark", Record<StatusState, StatusPair>> = {
  light: {
    available: { background: "#E7F2EC", text: "#326B51" },
    income: { background: "#E9F3EC", text: "#326B51" },
    planned: { background: "#EDF1F4", text: "#566A78" },
    caution: { background: "#FFF3DF", text: "#895C1A" },
    shortfall: { background: "#F9EAE7", text: "#A64D43" },
    info: { background: "#EAF1F5", text: "#416A83" },
  },
  dark: {
    available: { background: "#1F3A30", text: "#8FD1AE" },
    income: { background: "#1E3A2F", text: "#8FD1AE" },
    planned: { background: "#25333D", text: "#A9C0CF" },
    caution: { background: "#3D3220", text: "#E8C583" },
    shortfall: { background: "#432824", text: "#F0A89E" },
    info: { background: "#1F3441", text: "#9CC4DE" },
  },
};
