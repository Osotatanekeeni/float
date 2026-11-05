import { Calendar, CircleAlert, CircleCheck, Info, ArrowDownLeft, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type PillState = "available" | "income" | "planned" | "caution" | "shortfall" | "info";

// Each state has its own icon and a text label, so meaning never depends on colour alone.
const config: Record<PillState, { icon: LucideIcon; classes: string }> = {
  available: { icon: CircleCheck, classes: "bg-status-available text-status-available-ink" },
  income: { icon: ArrowDownLeft, classes: "bg-status-income text-status-income-ink" },
  planned: { icon: Calendar, classes: "bg-status-planned text-status-planned-ink" },
  caution: { icon: TriangleAlert, classes: "bg-status-caution text-status-caution-ink" },
  shortfall: { icon: CircleAlert, classes: "bg-status-shortfall text-status-shortfall-ink" },
  info: { icon: Info, classes: "bg-status-info text-status-info-ink" },
};

export function StatusPill({
  state,
  className,
  children,
  ...props
}: ComponentProps<"span"> & { state: PillState }) {
  const { icon: Icon, classes } = config[state];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", classes, className)}
      {...props}
    >
      <Icon aria-hidden className="size-3.5 shrink-0" />
      {children}
    </span>
  );
}
