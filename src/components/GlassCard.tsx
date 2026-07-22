import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
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
          "relative overflow-hidden rounded-2xl border border-border/60",
          "bg-card/70 backdrop-blur-xl",
          "shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_32px_-12px_rgba(15,23,42,0.12)]",
          "dark:bg-card/50 dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_8px_32px_-12px_rgba(0,0,0,0.6)]",
          "transition-shadow hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-12px_rgba(15,23,42,0.18)]",
          accent &&
            "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:content-['']",
          accent && accentClass[accent],
          className,
        )}
        {...rest}
      >
        {(title || action) && (
          <div className={cn("flex items-center justify-between gap-3", padded ? "px-5 pt-5" : "")}>
            {title && (
              <div className="text-sm font-semibold tracking-tight text-foreground">{title}</div>
            )}
            {action && <div className="flex items-center gap-1">{action}</div>}
          </div>
        )}
        <div className={cn(padded ? "p-5" : "")}>{children}</div>
      </div>
    );
  },
);
GlassCard.displayName = "GlassCard";
