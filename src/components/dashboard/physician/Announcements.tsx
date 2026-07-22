import { Megaphone } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

const items = [
  { title: "Flu season protocol updated", date: "Nov 12" },
  { title: "New EHR training — Thursday 3pm", date: "Nov 10" },
  { title: "Holiday schedule posted", date: "Nov 4" },
];

export function Announcements() {
  return (
    <GlassCard
      accent="notes"
      title={
        <span className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-accent-notes" /> Announcements
        </span>
      }
    >
      <div className="space-y-2">
        {items.map((i) => (
          <div key={i.title} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs hover:bg-accent/40">
            <span>{i.title}</span>
            <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">{i.date}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
