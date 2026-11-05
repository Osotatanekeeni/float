import { describe, expect, it, vi } from "vitest";
import { MAGIC_LINK_MAX_AGE_SECONDS, RateLimitedError, SESSION_MAX_AGE_SECONDS, buildAuthConfig, createSendVerificationRequest } from "./config";

const params = {
  identifier: "tolu@example.com",
  url: "http://localhost:3000/api/auth/callback/email?token=t",
  expires: new Date("2026-11-05T10:15:00Z"),
};

describe("createSendVerificationRequest", () => {
  it("checks the rate limit with the email, then sends the link", async () => {
    const consume = vi.fn().mockResolvedValue({ allowed: true });
    const sendMagicLink = vi.fn().mockResolvedValue(undefined);
    await createSendVerificationRequest({ consume, mailer: { sendMagicLink } })(params as never);
    expect(consume).toHaveBeenCalledWith("tolu@example.com");
    expect(sendMagicLink).toHaveBeenCalledWith({ to: "tolu@example.com", url: params.url, expires: params.expires });
  });

  it("sends nothing and raises RateLimitedError when over the limit", async () => {
    const consume = vi.fn().mockResolvedValue({ allowed: false, retryAfterSeconds: 120 });
    const sendMagicLink = vi.fn();
    const send = createSendVerificationRequest({ consume, mailer: { sendMagicLink } });
    await expect(send(params as never)).rejects.toMatchObject({ name: "RateLimitedError", retryAfterSeconds: 120 });
    await expect(send(params as never)).rejects.toBeInstanceOf(RateLimitedError);
    expect(sendMagicLink).not.toHaveBeenCalled();
  });
});

describe("buildAuthConfig", () => {
  const config = buildAuthConfig({ adapter: {} as never, consume: vi.fn(), mailer: { sendMagicLink: vi.fn() }, secure: true });

  it("uses database sessions so every session can be revoked (sign out everywhere)", () => {
    expect(config.session?.strategy).toBe("database");
  });

  it("expires sessions after 30 idle days and magic links after 15 minutes", () => {
    expect(SESSION_MAX_AGE_SECONDS).toBe(30 * 24 * 60 * 60);
    expect(config.session?.maxAge).toBe(SESSION_MAX_AGE_SECONDS);
    expect(MAGIC_LINK_MAX_AGE_SECONDS).toBe(15 * 60);
  });

  it("slides the idle window forward at most once a day", () => {
    expect(config.session?.updateAge).toBe(24 * 60 * 60);
  });

  it("sets the session cookie HttpOnly, Secure and SameSite=Lax", () => {
    const cookie = config.cookies?.sessionToken;
    expect(cookie?.options).toMatchObject({ httpOnly: true, sameSite: "lax", secure: true, path: "/" });
  });

  it("offers email magic links only (no passwords)", () => {
    const providers = config.providers as { id?: string; type?: string }[];
    expect(providers).toHaveLength(1);
    expect(providers[0]).toMatchObject({ id: "email", type: "email" });
  });

  it("points sign-in at Float's own pages", () => {
    expect(config.pages).toMatchObject({ signIn: "/sign-in", verifyRequest: "/sign-in/check-email", error: "/sign-in" });
  });

  it("exposes the user id on the session (database sessions omit it by default)", async () => {
    const session = await config.callbacks!.session!({
      session: { user: { email: "t@example.com" }, expires: "2026-12-01" },
      user: { id: "u-1", email: "t@example.com" },
    } as never);
    expect((session as { user: { id: string } }).user.id).toBe("u-1");
  });
});
