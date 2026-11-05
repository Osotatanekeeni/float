// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { axe } from "vitest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DesignSystemPage from "./page";

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  );
});

describe("/design-system showcase", () => {
  it("shows the same core components in a light and a dark panel", () => {
    const { container } = render(<DesignSystemPage />);
    expect(screen.getByRole("heading", { level: 1, name: /design system/i })).toBeInTheDocument();

    for (const theme of ["light", "dark"] as const) {
      const panel = container.querySelector(`[data-theme="${theme}"]`) as HTMLElement;
      expect(panel, theme).not.toBeNull();
      const scope = within(panel);
      for (const variant of ["primary", "secondary", "outline", "ghost", "destructive"]) {
        expect(panel.querySelector(`[data-variant="${variant}"]`), `${theme} ${variant}`).not.toBeNull();
      }
      expect(scope.getByLabelText("Amount")).toBeInTheDocument();
      expect(scope.getByText(/confirmed income/i)).toBeInTheDocument();
      expect(scope.getByText(/projected shortfall/i)).toBeInTheDocument();
    }
  });

  it("lists every colour token with its hex value", () => {
    render(<DesignSystemPage />);
    expect(screen.getAllByText("#235E62").length).toBeGreaterThan(0);
    expect(screen.getAllByText("#9BCFC1").length).toBeGreaterThan(0);
  });

  it("contains no emoji", () => {
    const { container } = render(<DesignSystemPage />);
    expect(container.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it("passes axe", async () => {
    const { container } = render(<DesignSystemPage />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
