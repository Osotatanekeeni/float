import { describe, expect, it } from "vitest";
import { normalizeConnectionString } from "./client";

const base = "postgresql://user:pw@ep-x-pooler.neon.tech/db";

describe("normalizeConnectionString", () => {
  it("states verify-full explicitly for the aliases pg currently maps to it", () => {
    for (const mode of ["require", "prefer", "verify-ca"]) {
      expect(normalizeConnectionString(`${base}?sslmode=${mode}`)).toBe(`${base}?sslmode=verify-full`);
    }
  });

  it("keeps other parameters and an already explicit mode", () => {
    expect(normalizeConnectionString(`${base}?sslmode=require&channel_binding=require`)).toBe(
      `${base}?sslmode=verify-full&channel_binding=require`,
    );
    expect(normalizeConnectionString(`${base}?sslmode=verify-full`)).toBe(`${base}?sslmode=verify-full`);
  });

  it("never weakens a connection that disables TLS, and leaves urls without sslmode alone", () => {
    expect(normalizeConnectionString(`${base}?sslmode=disable`)).toBe(`${base}?sslmode=disable`);
    expect(normalizeConnectionString(base)).toBe(base);
  });
});
