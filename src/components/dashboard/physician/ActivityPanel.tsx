import { useEffect, useState } from "react";
import { Activity, FlaskConical, Pill, StickyNote, UserPlus, Eye, Zap } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { getActivity, subscribeActivity, type ActivityEntry } from "@/lib/activity";

const ICON: Record<ActivityEntry["type"], { icon: any; color: string }> = {
  "lab-order": { icon: FlaskConical, color: "text-accent-observations" },
  "medication-order": { icon: Pill, color: "text-accent-medications" },
  "clinical-note": { icon: StickyNote, color: "text-accent-notes" },
  "patient-create": { icon: UserPlus, color: "text-accent-info" },
  "patient-update": { icon: UserPlus, color: "text-accent-info" },
  "patient-view": { icon: Eye, color: "text-accent-summary" },
  other: { icon: Zap, color: "text-accent-info" },
};

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function ActivityPanel() {
  const [items, setItems] = useState<ActivityEntry[]>([]);
  useEffect(() => {
    setItems(getActivity());
    return subscribeActivity(() => setItems(getActivity()));
  }, []);

  return (
    <GlassCard
      accent="info"
      title={
        <span className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent-info" /> Activity
        </span>
      }
    >
      {items.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">
          No activity yet. Actions across Nexus Pro will show up here.
        </div>
      ) : (
        <ul className="max-h-80 space-y-1 overflow-auto">
          {items.slice(0, 30).map((a) => {
            const Def = ICON[a.type] ?? ICON.other;
            const I = Def.icon;
            return (
              <li
                key={a.id}
                className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/40"
              >
                <span className={`mt-0.5 rounded-md bg-muted/50 p-1.5 ${Def.color}`}>
                  <I className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm">
                    <span className="font-medium">{a.action}</span>{" "}
                    <span className="text-muted-foreground">— {a.description}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {relTime(a.ts)}
                    {a.actor ? ` • ${a.actor}` : ""}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}
