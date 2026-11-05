// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusPill, type PillState } from "./status-pill";

const states: PillState[] = [
  "available",
  "income",
  "planned",
  "caution",
  "shortfall",
  "info",
];

describe("StatusPill", () => {
  it("always shows a text label, never colour alone (DESIGN.md rule)", () => {
    render(<StatusPill state="caution">Below buffer</StatusPill>);
    expect(screen.getByText("Below buffer")).toBeVisible();
  });

  it("carries an icon on every state, hidden from assistive tech", () => {
    for (const state of states) {
      const { container, unmount } = render(<StatusPill state={state}>{state}</StatusPill>);
      const svg = container.querySelector("svg");
      expect(svg, state).not.toBeNull();
      expect(svg).toHaveAttribute("aria-hidden", "true");
      unmount();
    }
  });

  it("uses a distinct icon per state so meaning survives without colour", () => {
    const shapes = states.map((state) => {
      const { container, unmount } = render(<StatusPill state={state}>{state}</StatusPill>);
      const html = container.querySelector("svg")!.innerHTML;
      unmount();
      return html;
    });
    expect(new Set(shapes).size).toBe(states.length);
  });

  it("applies the status colour tokens for its state", () => {
    render(<StatusPill state="shortfall">Shortfall</StatusPill>);
    const pill = screen.getByText("Shortfall").closest("span")!;
    expect(pill.className).toContain("bg-status-shortfall");
    expect(pill.className).toContain("text-status-shortfall-ink");
  });
});
