// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import CheckEmailPage from "./page";

describe("check-email page", () => {
  it("has a single level-one heading, so screen-reader users can orient themselves", () => {
    render(<CheckEmailPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: /check your email/i })).toBeInTheDocument();
  });

  it("tells people the link is single-use and when it expires", () => {
    render(<CheckEmailPage />);
    expect(screen.getByText(/works once and expires in 15 minutes/i)).toBeInTheDocument();
  });

  it("passes axe", async () => {
    const { container } = render(<CheckEmailPage />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
