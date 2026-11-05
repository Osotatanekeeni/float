// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Plus } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders its label and fires onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Add income</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Add income" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is at least 44px tall for touch (CLAUDE.md mobile-first)", () => {
    render(<Button>Add expense</Button>);
    expect(screen.getByRole("button")).toHaveClass("min-h-11");
  });

  it("supports every DESIGN.md variant", () => {
    for (const variant of ["primary", "secondary", "outline", "ghost", "destructive"] as const) {
      const { unmount } = render(<Button variant={variant}>{variant}</Button>);
      expect(screen.getByRole("button", { name: variant })).toHaveAttribute("data-variant", variant);
      unmount();
    }
  });

  it("while loading: is busy, disabled, ignores clicks and keeps its label", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Reserve money
      </Button>,
    );
    const button = screen.getByRole("button", { name: /reserve money/i });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("an icon-only button is named by aria-label and hides the decorative icon", () => {
    render(
      <Button size="icon" aria-label="Quick add">
        <Plus data-testid="icon" aria-hidden />
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Quick add" })).toHaveClass("min-w-11");
    expect(screen.getByTestId("icon")).toHaveAttribute("aria-hidden", "true");
  });

  it("defaults to type=button so it never submits a form by accident", () => {
    render(<Button>Edit commitment</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("asChild renders the child element instead of a button", () => {
    render(
      <Button asChild>
        <a href="#forecast">View forecast</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "View forecast" })).toHaveAttribute("href", "#forecast");
  });
});
