// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ devSignInAction: vi.fn() }));
import { DevSignIn } from "./dev-sign-in";

afterEach(() => vi.unstubAllEnvs());

describe("DevSignIn", () => {
  it("offers a clearly labelled development-only button under next dev", () => {
    vi.stubEnv("NODE_ENV", "development");
    render(<DevSignIn />);
    expect(screen.getByRole("button", { name: /continue as dev user/i })).toBeInTheDocument();
    expect(screen.getByText(/development only/i)).toBeInTheDocument();
  });

  it("renders nothing in production, so the button cannot ship", () => {
    vi.stubEnv("NODE_ENV", "production");
    const { container } = render(<DevSignIn />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing in test", () => {
    vi.stubEnv("NODE_ENV", "test");
    const { container } = render(<DevSignIn />);
    expect(container).toBeEmptyDOMElement();
  });
});
