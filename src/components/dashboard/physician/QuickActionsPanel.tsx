import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  UserPlus,
  Search,
  FlaskConical,
  ScanLine,
  Pill,
  StickyNote,
  Share2,
  Zap,
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { QuickActionDialog, type QuickActionKind } from "@/components/QuickActionDialog";
import { PatientSearchDialog } from "@/components/PatientSearchDialog";

type Action =
  | { kind: "link"; label: string; icon: any; to: "/patients/new" | "/patients"; color: string }
  | { kind: "dialog"; label: string; icon: any; action: QuickActionKind; color: string }
  | { kind: "search"; label: string; icon: any; color: string }
  | { kind: "todo"; label: string; icon: any; color: string };

const actions: Action[] = [
  { kind: "link", label: "New patient", icon: UserPlus, to: "/patients/new", color: "text-accent-info" },
  { kind: "search", label: "Search patient", icon: Search, color: "text-accent-summary" },
  { kind: "dialog", label: "Order laboratory test", icon: FlaskConical, action: "lab", color: "text-accent-observations" },
  { kind: "dialog", label: "Order imaging", icon: ScanLine, action: "lab", color: "text-accent-encounters" },
  { kind: "dialog", label: "Prescribe medication", icon: Pill, action: "medication", color: "text-accent-medications" },
  { kind: "dialog", label: "Add clinical note", icon: StickyNote, action: "note", color: "text-accent-notes" },
  { kind: "todo", label: "Create referral", icon: Share2, color: "text-accent-diagnoses" },
];

export function QuickActionsPanel() {
  const [dialog, setDialog] = useState<QuickActionKind>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <GlassCard
      accent="info"
      title={
        <span className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent-info" /> Quick actions
        </span>
      }
    >
      <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
        {actions.map((a) => {
          const inner = (
            <div className="group flex h-full flex-col items-center gap-2 rounded-xl border border-border/40 bg-background/50 p-3.5 text-center transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-lg">
              <div className={`rounded-lg bg-muted/50 p-2.5 ${a.color}`}>
                <a.icon className="h-5 w-5" />
              </div>
              <div className="text-xs font-medium leading-tight">{a.label}</div>
            </div>
          );
          if (a.kind === "link") return <Link key={a.label} to={a.to}>{inner}</Link>;
          if (a.kind === "search")
            return (
              <button key={a.label} type="button" className="text-left" onClick={() => setSearchOpen(true)}>
                {inner}
              </button>
            );
          if (a.kind === "dialog")
            return (
              <button
                key={a.label}
                type="button"
                className="text-left"
                onClick={() => setDialog(a.action)}
              >
                {inner}
              </button>
            );
          return (
            <button key={a.label} type="button" className="text-left" aria-disabled>
              {inner}
            </button>
          );
        })}
      </div>

      <QuickActionDialog kind={dialog} onClose={() => setDialog(null)} />
      <PatientSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </GlassCard>
  );
}
