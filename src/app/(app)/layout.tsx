import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { auth } from "@/auth";
import { AppShell } from "@/components/nav/app-shell";

// Every page in this group needs a signed-in user. proxy.ts only checks that a cookie exists; this checks
// the session in the database, so a forged or expired cookie is turned away here. Pages that show a
// person's data must still call requireUserId themselves: layouts do not re-run on every navigation.
async function RequireSession() {
  await connection();
  if (!(await auth())?.user) redirect("/sign-in");
  return null;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      {children}
      <Suspense>
        <RequireSession />
      </Suspense>
    </AppShell>
  );
}
