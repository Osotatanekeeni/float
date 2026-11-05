import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "min-h-11 w-full rounded-input border border-line-strong bg-surface px-3 text-base text-ink placeholder:text-ink-muted md:text-sm",
        "aria-[invalid=true]:border-status-shortfall-ink disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
