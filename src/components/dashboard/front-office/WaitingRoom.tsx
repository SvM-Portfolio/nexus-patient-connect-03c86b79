import { useQuery } from "@tanstack/react-query";
import { Hourglass, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { searchResources } from "@/lib/fhir";

interface Appointment { id: string; status?: string; start?: string; participant?: any[]; }
function today() { return new Date().toISOString().slice(0, 10); }

export function WaitingRoom() {
  const { data, isLoading } = useQuery({
    queryKey: ["fo-waiting", today()],
    queryFn: () => searchResources<Appointment>("Appointment", { date: `eq${today()}`, status: "arrived", _sort: "date", _count: "50" }),
    staleTime: 15_000, retry: 2,
  });

  const now = Date.now();

  return (
    <GlassCard accent="encounters" title={<span className="flex items-center gap-2"><Hourglass className="h-4 w-4 text-accent-encounters" /> Waiting room</span>}>
      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…</div>
      ) : !data || data.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">Waiting room is empty.</div>
      ) : (
        <div className="max-h-[320px] space-y-2 overflow-auto">
          {data.map((a) => {
            const patient = a.participant?.find((p) => p.actor?.reference?.startsWith("Patient/"))?.actor?.display;
            const waitMin = a.start ? Math.max(0, Math.round((now - new Date(a.start).getTime()) / 60000)) : 0;
            return (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-background/40 px-3 py-2">
                <div className="truncate text-sm font-medium">{patient ?? "Patient"}</div>
                <span className="shrink-0 rounded-full bg-accent-conditions/15 px-2 py-0.5 text-[10px] font-medium text-accent-conditions">
                  {waitMin} min
                </span>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
