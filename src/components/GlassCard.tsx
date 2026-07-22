import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  accent?:
    | "info"
    | "summary"
    | "observations"
    | "encounters"
    | "diagnoses"
    | "conditions"
    | "medications"
    | "allergies"
    | "procedures"
    | "billing"
    | "notes"
    | "history";
  title?: ReactNode;
  action?: ReactNode;
  padded?: boolean;
}

const accentClass: Record<string, string> = {
  info: "before:bg-accent-info",
  summary: "before:bg-accent-summary",
  observations: "before:bg-accent-observations",
  encounters: "before:bg-accent-encounters",
  diagnoses: "before:bg-accent-diagnoses",
  conditions: "before:bg-accent-conditions",
  medications: "before:bg-accent-medications",
  allergies: "before:bg-accent-allergies",
  procedures: "before:bg-accent-procedures",
  billing: "before:bg-accent-billing",
  notes: "before:bg-accent-notes",
  history: "before:bg-accent-history",
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, accent, title, action, padded = true, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass-surface relative overflow-hidden rounded-2xl",
          "transition-[transform,box-shadow] duration-200 ease-out",
          "hover:shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_14px_44px_oklch(0.2077_0.0398_265.76/0.08)]",
          "dark:hover:shadow-[0_1px_0_oklch(1_0_0/0.04)_inset,0_14px_44px_oklch(0_0_0/0.35)]",
          accent &&
            "before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:opacity-80 before:content-['']",
          accent && accentClass[accent],
          className,
        )}
        {...rest}
      >
        {(title || action) && (
          <div className={cn("flex items-center justify-between gap-3", padded ? "px-6 pt-5" : "")}>
            {title && (
              <div className="text-[13px] font-semibold tracking-tight text-foreground/90">
                {title}
              </div>
            )}
            {action && <div className="flex items-center gap-1">{action}</div>}
          </div>
        )}
        <div className={cn(padded ? "px-6 pb-6 pt-4" : "")}>{children}</div>
      </div>
    );
  },
);
GlassCard.displayName = "GlassCard";
