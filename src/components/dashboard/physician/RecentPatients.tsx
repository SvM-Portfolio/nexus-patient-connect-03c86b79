import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Users, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { readRecentPatients, type RecentPatient } from "@/lib/recent-patients";

function age(dob?: string) {
  if (!dob) return "—";
  try {
    const d = new Date(dob);
    const now = new Date();
    let a = now.getFullYear() - d.getFullYear();
    if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--;
    return `${a}y`;
  } catch {
    return "—";
  }
}

export function RecentPatients() {
  const [list, setList] = useState<RecentPatient[]>([]);

  useEffect(() => {
    setList(readRecentPatients());
    const onChange = () => setList(readRecentPatients());
    window.addEventListener("nexus.recentPatients.changed", onChange);
    return () => window.removeEventListener("nexus.recentPatients.changed", onChange);
  }, []);

  return (
    <GlassCard
      accent="encounters"
      title={
        <span className="flex items-center gap-2">
          <Users className="h-4 w-4 text-accent-encounters" /> Recent patients
        </span>
      }
      action={
        <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
          <Link to="/patients">View all</Link>
        </Button>
      }
    >
      {list.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">
          No recent patients yet.
        </div>
      ) : (
        <div className="max-h-[360px] space-y-1 overflow-auto">
          {list.map((p) => (
            <Link
              key={p.id}
              to="/patients/$id"
              params={{ id: p.id }}
              className="group flex items-center justify-between gap-2 rounded-xl border border-transparent px-3 py-2 hover:border-border/40 hover:bg-accent/40"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{p.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {age(p.birthDate)} · {p.gender ?? "—"} · Viewed {new Date(p.visitedAt).toLocaleDateString()}
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
