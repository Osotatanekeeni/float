import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { darkTokens, lightTokens, statusTokens, type StatusState } from "./tokens";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No ${selector} block in globals.css`);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  return Object.fromEntries(
    [...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().toUpperCase()]),
  );
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const states: StatusState[] = ["available", "income", "planned", "caution", "shortfall", "info"];

describe.each([
  ["light", ':root, [data-theme="light"]', lightTokens, statusTokens.light],
  ["dark", '[data-theme="dark"]', darkTokens, statusTokens.dark],
] as const)("globals.css %s variables match tokens.ts", (_name, selector, tokens, status) => {
  const vars = block(selector);

  it("defines every theme token", () => {
    for (const [key, value] of Object.entries(tokens)) {
      expect(vars[`--${kebab(key)}`], `--${kebab(key)}`).toBe(value.toUpperCase());
    }
  });

  it("defines every status colour pair", () => {
    for (const state of states) {
      expect(vars[`--status-${state}-bg`]).toBe(status[state].background.toUpperCase());
      expect(vars[`--status-${state}-text`]).toBe(status[state].text.toUpperCase());
    }
  });
});

describe("globals.css", () => {
  it("does not ship the create-next-app defaults", () => {
    expect(css).not.toMatch(/--background:\s*#ffffff/i);
    expect(css).not.toMatch(/geist/i);
    expect(css).not.toMatch(/Arial/);
  });

  it("respects reduced motion", () => {
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});
