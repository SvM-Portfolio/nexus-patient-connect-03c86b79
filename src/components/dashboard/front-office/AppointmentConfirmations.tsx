import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, RefreshCw, X } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { searchResources, createResource } from "@/lib/fhir";
import { toast } from "sonner";

interface Appointment {
  id: string; status?: string; start?: string; description?: string; participant?: any[];
}

function upcoming48h() {
  const from = new Date().toISOString().slice(0, 10);
  const to = new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 10);
  return { from, to };
}
function fmt(iso?: string) {
  try { return iso ? new Date(iso).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" }) : "—"; }
  catch { return iso ?? "—"; }
}

export function AppointmentConfirmations() {
  const qc = useQueryClient();
  const { from, to } = upcoming48h();
  const { data, isLoading } = useQuery({
    queryKey: ["fo-confirmations", from, to],
    queryFn: () => searchResources<Appointment>("Appointment", { date: [`ge${from}`, `le${to}`].join(","), status: "booked,pending", _sort: "date", _count: "50" }),
    staleTime: 30_000, retry: 2,
  });

  async function update(a: Appointment, status: string) {
    try {
      await createResource(`Appointment/${a.id}`, { ...a, status });
      toast.success(`Marked ${status}`);
      qc.invalidateQueries({ queryKey: ["fo-confirmations"] });
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <GlassCard accent="summary" title={<span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent-summary" /> Confirmations (48h)</span>}>
      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…</div>
      ) : !data || data.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">No upcoming appointments.</div>
      ) : (
        <div className="max-h-[320px] space-y-2 overflow-auto">
          {data.map((a) => {
            const patient = a.participant?.find((p) => p.actor?.reference?.startsWith("Patient/"))?.actor?.display;
            return (
              <div key={a.id} className="rounded-xl border border-border/40 bg-background/40 px-3 py-2">
                <div className="text-[11px] text-muted-foreground">{fmt(a.start)}</div>
                <div className="truncate text-sm font-medium">{patient ?? a.description ?? "Appointment"}</div>
                <div className="mt-1 flex gap-1">
                  <Button size="sm" variant="secondary" className="h-7 gap-1 text-xs" onClick={() => update(a, "booked")}><CheckCircle2 className="h-3 w-3" /> Confirm</Button>
                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs"><RefreshCw className="h-3 w-3" /> Reschedule</Button>
                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-muted-foreground" onClick={() => update(a, "cancelled")}><X className="h-3 w-3" /> Cancel</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
