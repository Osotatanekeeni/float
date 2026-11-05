import { MailCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Check your email" };

export default function CheckEmailPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-12">
      <p className="text-[length:var(--text-hero)] font-bold text-brand">float</p>
      <Card>
        <CardHeader>
          <MailCheck aria-hidden className="size-6 text-brand" />
          <CardTitle as="h1">Check your email</CardTitle>
          <CardDescription>
            We sent a sign-in link. It works once and expires in 15 minutes. If nothing arrives, check your spam
            folder or try again.
          </CardDescription>
        </CardHeader>
        <Button asChild variant="outline">
          <Link href="/sign-in">Use a different email</Link>
        </Button>
      </Card>
    </main>
  );
}
