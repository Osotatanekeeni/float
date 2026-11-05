import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-4 py-12">
      <h1 className="text-[length:var(--text-hero)] font-bold text-brand md:text-[2.5rem]">float</h1>
      <p className="text-base text-ink-2">
        Your bank balance tells you what you have. Float tells you what you can spend.
      </p>
      <div>
        <Button asChild>
          <Link href="/design-system">View the design system</Link>
        </Button>
      </div>
    </main>
  );
}
