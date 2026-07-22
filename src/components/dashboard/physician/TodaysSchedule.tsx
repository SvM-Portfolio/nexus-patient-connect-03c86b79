import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Loader2, PlayCircle, LogIn, RefreshCw, X } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { searchResources, createResource } from "@/lib/fhir";
import { toast } from "sonner";

interface Appointment {
  id: string;
  status?: string;
  start?: string;
  description?: string;
  serviceType?: any[];
  participant?: any[];
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function fmt(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

const STATUS_STYLE: Record<string, string> = {
  booked: "bg-accent-info/15 text-accent-info",
  arrived: "bg-accent-conditions/15 text-accent-conditions",
  "checked-in": "bg-accent-conditions/15 text-accent-conditions",
  fulfilled: "bg-accent-observations/15 text-accent-observations",
  cancelled: "bg-muted text-muted-foreground",
  noshow: "bg-accent-allergies/15 text-accent-allergies",
};

export function TodaysSchedule() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["todays-schedule", today()],
    queryFn: () =>
      searchResources<Appointment>("Appointment", {
        date: `eq${today()}`,
        _sort: "date",
        _count: "50",
      }),
    staleTime: 30_000,
    retry: 2,
  });

  async function updateStatus(a: Appointment, status: string) {
    try {
      await createResource(`Appointment/${a.id}`, { ...a, status });
      toast.success(`Marked ${status}`);
      qc.invalidateQueries({ queryKey: ["todays-schedule"] });
      qc.invalidateQueries({ queryKey: ["today-summary"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const appts = data ?? [];

  return (
    <GlassCard
      accent="summary"
      title={
        <span className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent-summary" /> Today's schedule
        </span>
      }
    >
      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
        </div>
      ) : appts.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">No appointments today.</div>
      ) : (
        <div className="max-h-[360px] space-y-2 overflow-auto">
          {appts.map((a) => {
            const patient = a.participant?.find((p) =>
              p.actor?.reference?.startsWith("Patient/"),
            )?.actor?.display;
            const provider = a.participant?.find((p) =>
              p.actor?.reference?.startsWith("Practitioner/"),
            )?.actor?.display;
            return (
              <div
                key={a.id}
                className="rounded-xl border border-border/40 bg-background/40 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-muted-foreground">{fmt(a.start)}</div>
                    <div className="truncate text-sm font-medium">
                      {patient ?? a.description ?? "Appointment"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {a.serviceType?.[0]?.text ?? "Visit"} · {provider ?? "—"}
                    </div>
                  </div>
                  <Badge className={`shrink-0 border-0 text-[10px] capitalize ${STATUS_STYLE[a.status ?? "booked"] ?? "bg-muted text-muted-foreground"}`}>
                    {a.status ?? "booked"}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => updateStatus(a, "arrived")}>
                    <LogIn className="h-3 w-3" /> Check in
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => updateStatus(a, "fulfilled")}>
                    <PlayCircle className="h-3 w-3" /> Start
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                    <RefreshCw className="h-3 w-3" /> Reschedule
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-muted-foreground" onClick={() => updateStatus(a, "cancelled")}>
                    <X className="h-3 w-3" /> Cancel
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
