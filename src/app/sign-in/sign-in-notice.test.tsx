// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let query = "";
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(query) }));

import { SignInNotice } from "./sign-in-notice";

beforeEach(() => {
  query = "";
});

describe("SignInNotice (Auth.js redirects here with ?error=...)", () => {
  it("renders nothing when there is no error", () => {
    const { container } = render(<SignInNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it("explains an expired or already-used link and offers a way forward", () => {
    query = "error=Verification";
    render(<SignInNotice />);
    expect(screen.getByRole("alert")).toHaveTextContent(/expired or was already used/i);
    expect(screen.getByRole("alert")).toHaveTextContent(/request a new/i);
  });

  it("gives a generic message for any other error, never echoing the query value", () => {
    query = "error=Configuration%3Cscript%3E";
    render(<SignInNotice />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/could not sign you in/i);
    expect(alert.textContent).not.toMatch(/Configuration|script/);
  });
});
