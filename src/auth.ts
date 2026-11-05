import "server-only";
import NextAuth from "next-auth";
import { getAdminDb } from "@/db/admin";
import { createAdapter } from "@/server/auth/adapter";
import { buildAuthConfig } from "@/server/auth/config";
import { consumeSignInAttempt } from "@/server/auth/rate-limit";
import { getMailer } from "@/server/email/mailer";

// The config is built lazily so importing this module (for example during `next build`) needs no database.
export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const db = getAdminDb();
  return buildAuthConfig({
    adapter: createAdapter(db),
    consume: (email) => consumeSignInAttempt(db, email, new Date()),
    mailer: getMailer(process.env),
    secure: process.env.NODE_ENV === "production",
  });
});
