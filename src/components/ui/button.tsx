import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-input px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-brand text-on-brand hover:bg-brand-hover",
        secondary: "bg-brand-soft text-brand hover:bg-surface-3",
        outline: "border border-line-strong bg-surface text-ink hover:bg-surface-2",
        ghost: "text-ink-2 hover:bg-surface-3",
        destructive: "bg-status-shortfall text-status-shortfall-ink border border-status-shortfall-ink/30 hover:bg-status-shortfall/70",
      },
      size: {
        default: "",
        lg: "min-h-12 px-5 text-base",
        icon: "min-w-11 px-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

function Button({ className, variant = "primary", size, asChild, loading, disabled, children, type, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return (
      <Slot data-variant={variant} className={classes} {...(props as object)}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      type={type ?? "button"}
      data-variant={variant}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 aria-hidden className="animate-spin" /> : null}
      {children}
    </button>
  );
}

export { Button, buttonVariants };
