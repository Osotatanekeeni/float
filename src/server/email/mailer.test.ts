import { describe, expect, it, vi } from "vitest";
import { createConsoleMailer, createLazyMailer, getMailer } from "./mailer";

const link = { to: "tolu@example.com", url: "http://localhost:3000/api/auth/callback/email?token=abc", expires: new Date("2026-11-05T10:15:00Z") };

describe("console mailer (until Resend is configured)", () => {
  it("prints the sign-in link so a developer can follow it", async () => {
    const write = vi.fn();
    await createConsoleMailer(write).sendMagicLink(link);
    const out = write.mock.calls.flat().join("\n");
    expect(out).toContain(link.url);
    expect(out).toContain(link.to);
    expect(out).toMatch(/not sent|development/i);
  });

  it("is refused in production, so a link can never be written to production logs", () => {
    expect(() => getMailer({ NODE_ENV: "production" })).toThrow(/production/i);
  });

  it("is used in development and test", () => {
    expect(getMailer({ NODE_ENV: "development" })).toBeDefined();
    expect(getMailer({ NODE_ENV: "test" })).toBeDefined();
  });
});

describe("lazy mailer", () => {
  it("does not choose a transport until a link is sent, so building the auth config cannot fail", () => {
    expect(() => createLazyMailer({ NODE_ENV: "production" })).not.toThrow();
  });

  it("fails only when a link is requested in production without a transport", async () => {
    await expect(createLazyMailer({ NODE_ENV: "production" }).sendMagicLink(link)).rejects.toThrow(/production/i);
  });

  it("delegates to the console transport in development", async () => {
    const write = vi.fn();
    const spy = vi.spyOn(console, "info").mockImplementation(write);
    await createLazyMailer({ NODE_ENV: "development" }).sendMagicLink(link);
    expect(write.mock.calls.flat().join("\n")).toContain(link.url);
    spy.mockRestore();
  });
});
