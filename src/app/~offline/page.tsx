import { WifiOff } from "lucide-react";
import type { Metadata } from "next";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { RetryButton } from "./retry-button";

export const metadata: Metadata = { title: "Offline" };

// Precached by the service worker and shown for any page that cannot be loaded without a connection.
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-12">
      <p className="text-[length:var(--text-hero)] font-bold text-brand">float</p>
      <Card>
        <CardHeader>
          <WifiOff aria-hidden className="size-6 text-brand" />
          <h1 className="text-lg font-semibold text-ink md:text-xl">You are offline</h1>
          <CardDescription>
            This page needs a connection. Nothing has been lost: anything you saved is on the server, and
            nothing you were about to save has been shown as saved.
          </CardDescription>
        </CardHeader>
        <RetryButton />
      </Card>
    </main>
  );
}
