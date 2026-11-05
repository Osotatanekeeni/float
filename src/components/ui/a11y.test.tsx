// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Input } from "./input";
import { Label } from "./label";
import { StatusPill } from "./status-pill";

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  );
});

describe("core components pass axe", () => {
  it("has no violations for a representative form and card", async () => {
    const { container } = render(
      <main>
        <h1>Design system</h1>
        <Card>
          <CardHeader>
            <CardTitle>Add income</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" inputMode="decimal" aria-invalid="true" aria-describedby="amount-error" />
            <p id="amount-error">Enter an amount greater than zero.</p>
            <StatusPill state="income">Confirmed</StatusPill>
            <Button>Add income</Button>
            <Button size="icon" aria-label="Close">
              x
            </Button>
            <ThemeToggle />
          </CardContent>
        </Card>
      </main>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
