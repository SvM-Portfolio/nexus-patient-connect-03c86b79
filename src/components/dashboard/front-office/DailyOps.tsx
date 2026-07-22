import { Sparkles } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

const items = [
  { title: "Front desk huddle 8:30am", tag: "Team" },
  { title: "Provider Dr. Nguyen out until 1pm", tag: "Coverage" },
  { title: "Payer portal maintenance 12–1pm", tag: "System" },
];

export function DailyOps() {
  return (
    <GlassCard accent="notes" title={<span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent-notes" /> Daily office operations</span>}>
      <div className="grid gap-2 sm:grid-cols-3">
        {items.map((i) => (
          <div key={i.title} className="rounded-xl border border-border/40 bg-background/40 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{i.tag}</div>
            <div className="mt-1 text-sm">{i.title}</div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
