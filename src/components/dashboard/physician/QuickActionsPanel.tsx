import { Link } from "@tanstack/react-router";
import {
  UserPlus,
  Search,
  FlaskConical,
  ScanLine,
  Scissors,
  Pill,
  StickyNote,
  Phone,
  Share2,
  Zap,
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

const actions = [
  { label: "New patient", icon: UserPlus, to: "/patients/new" as const, color: "text-accent-info" },
  { label: "Search patient", icon: Search, to: "/patients" as const, color: "text-accent-summary" },
  { label: "Order laboratory test", icon: FlaskConical, color: "text-accent-observations" },
  { label: "Order imaging", icon: ScanLine, color: "text-accent-encounters" },
  { label: "Order procedure", icon: Scissors, color: "text-accent-procedures" },
  { label: "Prescribe medication", icon: Pill, color: "text-accent-medications" },
  { label: "Add clinical note", icon: StickyNote, color: "text-accent-notes" },
  { label: "Telephone encounter", icon: Phone, color: "text-accent-info" },
  { label: "Create referral", icon: Share2, color: "text-accent-diagnoses" },
];

export function QuickActionsPanel() {
  return (
    <GlassCard
      accent="info"
      title={
        <span className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent-info" /> Quick actions
        </span>
      }
    >
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
        {actions.map((a) => {
          const inner = (
            <div className="group flex h-full flex-col items-center gap-2 rounded-xl border border-border/40 bg-background/40 p-3 text-center transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-lg">
              <div className={`rounded-lg bg-muted/40 p-2 ${a.color}`}>
                <a.icon className="h-4 w-4" />
              </div>
              <div className="text-[11px] font-medium leading-tight">{a.label}</div>
            </div>
          );
          return a.to ? (
            <Link key={a.label} to={a.to}>{inner}</Link>
          ) : (
            <button key={a.label} type="button" className="text-left">{inner}</button>
          );
        })}
      </div>
    </GlassCard>
  );
}
