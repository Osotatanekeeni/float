"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActive, sidebarSections } from "./items";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Sidebar"
      className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-5 overflow-y-auto border-r border-line bg-surface px-3 py-5 md:flex"
    >
      <p className="px-3 text-xl font-bold text-brand">float</p>
      {sidebarSections.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          <p className="px-3 text-xs font-medium tracking-wide text-ink-muted uppercase">{section.title}</p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map(({ label, href, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-input px-3 text-sm transition-colors duration-150",
                      active ? "bg-brand-soft font-semibold text-brand" : "text-ink-2 hover:bg-surface-3",
                    )}
                  >
                    <Icon aria-hidden className="size-4 shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
