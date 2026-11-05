import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { signOutAction, signOutEverywhereAction } from "@/app/sign-in/actions";

export const metadata: Metadata = { title: "Home" };

async function Signed() {
  await connection(); // the session is per request; opt out of prerendering before auth() touches crypto
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  return (
    <>
      <p className="text-ink-2">
        Signed in as <span className="font-medium text-ink">{session.user.email}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <form action={signOutAction}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
        <form action={signOutEverywhereAction}>
          <Button type="submit" variant="ghost">
            Sign out on all devices
          </Button>
        </form>
      </div>
    </>
  );
}

// Placeholder: the Safe-to-Spend home arrives with the core screens (M2).
export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <h1 className="text-2xl font-bold text-brand">Home</h1>
      <Suspense fallback={<p className="text-ink-muted">Loading</p>}>
        <Signed />
      </Suspense>
    </div>
  );
}
