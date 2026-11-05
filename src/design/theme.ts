export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "float-theme";

export function parsePreference(value: string | null | undefined): ThemePreference {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === "system") return systemPrefersDark ? "dark" : "light";
  return preference;
}

// Runs inline in <head> before first paint so there is no flash of the wrong theme.
// Storage can throw in private windows, so the read is wrapped and falls back to the system choice.
export const themeInitScript = `(function(){var p="system";try{p=localStorage.getItem("${THEME_STORAGE_KEY}")||"system"}catch(e){}var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var t=p==="light"||p==="dark"?p:d?"dark":"light";document.documentElement.setAttribute("data-theme",t)})();`;
