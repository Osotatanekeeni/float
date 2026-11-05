import type { NextAuthConfig } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import type { Mailer } from "@/server/email/mailer";
import type { RateLimitResult } from "./rate-limit";

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // PRD section 8: 30-day idle expiry
export const MAGIC_LINK_MAX_AGE_SECONDS = 15 * 60;

export class RateLimitedError extends Error {
  override name = "RateLimitedError";
  constructor(readonly retryAfterSeconds: number) {
    super("Too many sign-in attempts");
  }
}

interface Deps {
  consume: (email: string) => Promise<RateLimitResult>;
  mailer: Mailer;
}

/** Runs for every magic-link request, however it arrives, so the limit cannot be bypassed by skipping the form. */
export function createSendVerificationRequest({ consume, mailer }: Deps) {
  return async ({ identifier, url, expires }: { identifier: string; url: string; expires: Date }) => {
    const result = await consume(identifier);
    if (!result.allowed) throw new RateLimitedError(result.retryAfterSeconds);
    await mailer.sendMagicLink({ to: identifier, url, expires });
  };
}

export function buildAuthConfig({ adapter, secure, ...deps }: Deps & { adapter: Adapter; secure: boolean }): NextAuthConfig {
  return {
    adapter,
    // Database sessions, not JWTs, so a session can be revoked and "sign out everywhere" really works.
    session: { strategy: "database", maxAge: SESSION_MAX_AGE_SECONDS, updateAge: 24 * 60 * 60 },
    providers: [
      {
        id: "email",
        type: "email",
        name: "Email",
        server: "",
        from: "Float <no-reply@float.invalid>",
        maxAge: MAGIC_LINK_MAX_AGE_SECONDS,
        options: {},
        sendVerificationRequest: createSendVerificationRequest(deps) as never,
      },
    ],
    cookies: {
      sessionToken: {
        name: secure ? "__Secure-authjs.session-token" : "authjs.session-token",
        options: { httpOnly: true, sameSite: "lax", path: "/", secure },
      },
    },
    callbacks: {
      // Database sessions carry no user id by default; every authorisation check needs it.
      session: ({ session, user }) => ({ ...session, user: { ...session.user, id: user.id } }),
    },
    pages: { signIn: "/sign-in", verifyRequest: "/sign-in/check-email", error: "/sign-in" },
  };
}
