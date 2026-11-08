"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { getAdminDb } from "@/db/admin";
import { signInSchema } from "@/lib/schemas/auth";
import { sessionCookieName } from "@/server/auth/config";
import { assertDevLoginEnabled, createDevSession } from "@/server/auth/dev-login";
import { requireUserId } from "@/server/auth/guard";
import { isOverSignInLimit } from "@/server/auth/rate-limit";
import { signOutEverywhere } from "@/server/auth/sessions";

export type SignInResult =
  | { ok: false; error: "invalid"; fields: { email: string } }
  | { ok: false; error: "rate_limited"; retryAfterSeconds: number }
  | { ok: false; error: "failed" };

export async function requestMagicLink(input: unknown): Promise<SignInResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid", fields: { email: "Enter a valid email address" } };

  // redirect: false so a refused or failed send comes back as a URL we can inspect, instead of Auth.js
  // redirecting to an error page with no explanation.
  const url = await signIn("email", { email: parsed.data.email, redirect: false, redirectTo: "/home" });
  if (typeof url === "string" && !url.includes("error=")) redirect("/sign-in/check-email");

  const limit = await isOverSignInLimit(getAdminDb(), parsed.data.email, new Date());
  if (limit.limited) return { ok: false, error: "rate_limited", retryAfterSeconds: limit.retryAfterSeconds };
  return { ok: false, error: "failed" };
}

export async function signOutAction() {
  await signOut({ redirectTo: "/sign-in" });
}

export async function signOutEverywhereAction() {
  const userId = await requireUserId(auth);
  await signOutEverywhere(getAdminDb(), userId);
  redirect("/sign-in");
}

/** Development shortcut (see dev-login.ts). Throws anywhere but local `next dev`. */
export async function devSignInAction() {
  assertDevLoginEnabled(process.env);
  const { token, expires } = await createDevSession(getAdminDb(), new Date());
  (await cookies()).set(sessionCookieName(false), token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    expires,
  });
  redirect("/home");
}
