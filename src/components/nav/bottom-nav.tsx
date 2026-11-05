"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { bottomTabs, isTabActive } from "./items";

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {bottomTabs.map(({ label, href, icon: Icon, primary }) => {
          const active = isTabActive(pathname, { label, href, icon: Icon });
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.6875rem] leading-none",
                  active ? "font-semibold text-brand" : "font-medium text-ink-2",
                )}
              >
                {primary ? (
                  <span data-primary className="flex size-9 items-center justify-center rounded-full bg-brand text-on-brand">
                    <Icon aria-hidden className="size-5" />
                  </span>
                ) : (
                  <span
                    className={cn(
                      "flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-150",
                      active ? "bg-brand-soft" : "",
                    )}
                  >
                    <Icon aria-hidden className="size-5" />
                  </span>
                )}
                <span className="text-[0.6875rem]">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
