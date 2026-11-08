import { describe, expect, it } from "vitest";
import { DEV_EMAIL, assertDevLoginEnabled, isDevLoginEnabled } from "./dev-login";

// A shortcut that signs anyone in as a fixed user must be impossible outside local development.
describe("dev login guard", () => {
  it("is on only under next dev", () => {
    expect(isDevLoginEnabled({ NODE_ENV: "development" })).toBe(true);
  });

  it("is off in production, test and when the mode is unset", () => {
    for (const NODE_ENV of ["production", "test", undefined]) {
      expect(isDevLoginEnabled({ NODE_ENV }), String(NODE_ENV)).toBe(false);
    }
  });

  it("is off on Vercel even if NODE_ENV were somehow development", () => {
    expect(isDevLoginEnabled({ NODE_ENV: "development", VERCEL: "1" })).toBe(false);
  });

  it("assert throws, without echoing any environment values, when disabled", () => {
    expect(() => assertDevLoginEnabled({ NODE_ENV: "production" })).toThrow(/development/i);
    expect(() => assertDevLoginEnabled({ NODE_ENV: "development" })).not.toThrow();
  });

  it("uses a reserved .test address that can never receive real mail", () => {
    expect(DEV_EMAIL).toMatch(/@float\.test$/);
  });
});
