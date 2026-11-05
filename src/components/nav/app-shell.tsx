import { Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

/** Sidebar and top bar from tablet width up; fixed icon tabs on phones (DESIGN.md 4, mobile first). */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-input focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <header className="hidden items-center justify-end gap-3 border-b border-line bg-surface px-6 py-3 md:flex">
          <Button asChild size="default">
            <Link href="/add" aria-label="Quick add">
              <Plus aria-hidden />
              Add
            </Link>
          </Button>
          <ThemeToggle />
        </header>
        <main id="main" className="flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
