import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogIn, Loader2, LogOut } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { searchResources, createResource } from "@/lib/fhir";
import { toast } from "sonner";

interface Appointment {
  id: string; status?: string; start?: string; description?: string; participant?: any[];
}
function today() { return new Date().toISOString().slice(0, 10); }
function fmt(iso?: string) {
  try { return iso ? new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "—"; }
  catch { return iso ?? "—"; }
}

export function CheckInQueue() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["fo-checkin", today()],
    queryFn: () => searchResources<Appointment>("Appointment", { date: `eq${today()}`, status: "booked,arrived", _sort: "date", _count: "50" }),
    staleTime: 15_000, retry: 2,
  });

  async function update(a: Appointment, status: string) {
    try {
      await createResource(`Appointment/${a.id}`, { ...a, status });
      toast.success(`Marked ${status}`);
      qc.invalidateQueries({ queryKey: ["fo-checkin"] });
      qc.invalidateQueries({ queryKey: ["fo-patient-flow"] });
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <GlassCard accent="info" title={<span className="flex items-center gap-2"><LogIn className="h-4 w-4 text-accent-info" /> Check-in queue</span>}>
      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…</div>
      ) : !data || data.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">No one to check in.</div>
      ) : (
        <div className="max-h-[320px] space-y-2 overflow-auto">
          {data.map((a) => {
            const patient = a.participant?.find((p) => p.actor?.reference?.startsWith("Patient/"))?.actor?.display;
            return (
              <div key={a.id} className="flex items-center justify-between gap-2 rounded-xl border border-border/40 bg-background/40 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{patient ?? a.description ?? "Appointment"}</div>
                  <div className="text-[11px] text-muted-foreground">{fmt(a.start)} · {a.status}</div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {a.status !== "arrived" && (
                    <Button size="sm" variant="secondary" className="h-7 gap-1 text-xs" onClick={() => update(a, "arrived")}><LogIn className="h-3 w-3" />Check-in</Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => update(a, "fulfilled")}><LogOut className="h-3 w-3" />Check-out</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
