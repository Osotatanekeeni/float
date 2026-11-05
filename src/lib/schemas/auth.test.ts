import { describe, expect, it } from "vitest";
import { signInSchema } from "./auth";

describe("signInSchema (shared by the form and the server action)", () => {
  it("trims and lower-cases the email", () => {
    expect(signInSchema.parse({ email: "  Tolu@Example.COM " }).email).toBe("tolu@example.com");
  });

  it("rejects malformed and empty emails", () => {
    for (const email of ["", "tolu", "tolu@", "@example.com", "a b@example.com"]) {
      expect(signInSchema.safeParse({ email }).success, email).toBe(false);
    }
  });

  it("rejects absurdly long input", () => {
    expect(signInSchema.safeParse({ email: `${"a".repeat(250)}@example.com` }).success).toBe(false);
  });

  it("ignores unexpected fields", () => {
    expect(signInSchema.parse({ email: "t@example.com", admin: true })).toEqual({ email: "t@example.com" });
  });
});
