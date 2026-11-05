"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { parsePreference, resolveTheme, THEME_STORAGE_KEY, type ThemePreference } from "@/design/theme";
import { cn } from "@/lib/utils";

const options: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light theme", icon: Sun },
  { value: "dark", label: "Dark theme", icon: Moon },
  { value: "system", label: "System theme", icon: Monitor },
];

function readStored(): ThemePreference {
  try {
    return parsePreference(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

function apply(preference: ThemePreference) {
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute("data-theme", resolveTheme(preference, dark));
}

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    // Storage is only readable after mount; the inline init script already applied the theme.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreference(readStored());
  }, []);

  useEffect(() => {
    if (preference !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [preference]);

  function choose(next: ThemePreference) {
    setPreference(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Blocked storage: the choice still applies for this visit.
    }
    apply(next);
  }

  return (
    <div role="group" aria-label="Theme" className="inline-flex rounded-input border border-line-strong bg-surface p-0.5">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={preference === value}
          onClick={() => choose(value)}
          className={cn(
            "inline-flex min-h-11 min-w-11 items-center justify-center rounded-[0.5rem] text-ink-2 transition-colors duration-150",
            preference === value ? "bg-brand-soft text-brand" : "hover:bg-surface-3",
          )}
        >
          <Icon aria-hidden className="size-4" />
        </button>
      ))}
    </div>
  );
}
