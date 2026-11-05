// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import OfflinePage from "./page";

// FLT-PWA-05: no browser error pages offline
describe("offline fallback page", () => {
  it("says plainly that the device is offline and nothing was lost", () => {
    render(<OfflinePage />);
    expect(screen.getByRole("heading", { level: 1, name: /you are offline/i })).toBeInTheDocument();
    expect(screen.getByText(/nothing has been lost/i)).toBeInTheDocument();
  });

  it("offers a retry action", () => {
    render(<OfflinePage />);
    expect(screen.getByRole("button", { name: /try again/i })).toHaveAttribute("type", "button");
  });

  it("does not need the network or a session to render", () => {
    expect(() => render(<OfflinePage />)).not.toThrow();
  });

  it("passes axe", async () => {
    const { container } = render(<OfflinePage />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
