import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { searchResources } from "@/lib/fhir";

interface Task {
  id: string;
  status?: string;
  description?: string;
  priority?: string;
  authoredOn?: string;
}

export function PendingTasks() {
  const { data, isLoading } = useQuery({
    queryKey: ["pending-tasks"],
    queryFn: () =>
      searchResources<Task>("Task", { status: "requested", _sort: "-authored-on", _count: "10" }),
    staleTime: 30_000,
    retry: 2,
  });

  return (
    <GlassCard
      accent="procedures"
      title={
        <span className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-accent-procedures" /> Pending tasks
        </span>
      }
    >
      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
        </div>
      ) : !data || data.length === 0 ? (
        <div className="py-4 text-xs text-muted-foreground">Nothing pending.</div>
      ) : (
        <div className="space-y-1">
          {data.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs hover:bg-accent/40">
              <span className="truncate">{t.description ?? "Task"}</span>
              <span className="ml-2 shrink-0 text-[10px] text-muted-foreground capitalize">{t.priority ?? "routine"}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
