import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/auth";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInForm } from "./sign-in-form";
import { DevSignIn } from "./dev-sign-in";
import { SignInNotice } from "./sign-in-notice";

export const metadata: Metadata = { title: "Sign in" };

async function RedirectIfSignedIn() {
  await connection(); // the session is per request; opt out of prerendering before auth() touches crypto
  if ((await auth())?.user) redirect("/home");
  return null;
}

export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-12">
      <p className="text-[length:var(--text-hero)] font-bold text-brand">float</p>
      <Card>
        <CardHeader>
          <CardTitle as="h1">Sign in</CardTitle>
          <CardDescription>
            Enter your email and we will send you a link. There is no password to remember.
          </CardDescription>
        </CardHeader>
        <Suspense>
          <SignInNotice />
        </Suspense>
        <SignInForm />
        <DevSignIn />
      </Card>
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
    </main>
  );
}
