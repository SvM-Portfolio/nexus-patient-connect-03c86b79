import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2, ShieldAlert, ClipboardList, Syringe, HeartPulse } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { searchResources } from "@/lib/fhir";

interface Alert {
  id: string;
  label: string;
  detail?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "amber" | "rose" | "info";
}

export function ClinicalAlerts() {
  const { data, isLoading } = useQuery({
    queryKey: ["clinical-alerts"],
    queryFn: async () => {
      const [allergies, orders, plans] = await Promise.allSettled([
        searchResources("AllergyIntolerance", { criticality: "high", _count: "5" }),
        searchResources("ServiceRequest", { status: "active", _sort: "-authored", _count: "5" }),
        searchResources("CarePlan", { status: "active", _sort: "-date", _count: "5" }),
      ]);

      const val = <T,>(r: PromiseSettledResult<T[]>): T[] =>
        r.status === "fulfilled" ? r.value : [];

      const alerts: Alert[] = [];
      val<any>(allergies).forEach((a) =>
        alerts.push({
          id: `al-${a.id}`,
          label: `Allergy alert — ${a.code?.text ?? a.code?.coding?.[0]?.display ?? "unknown"}`,
          detail: `Criticality: ${a.criticality ?? "high"}`,
          icon: ShieldAlert,
          tone: "rose",
        }),
      );
      val<any>(orders).forEach((o) =>
        alerts.push({
          id: `sr-${o.id}`,
          label: `Outstanding order — ${o.code?.text ?? o.code?.coding?.[0]?.display ?? "service request"}`,
          detail: o.occurrenceDateTime ? new Date(o.occurrenceDateTime).toLocaleDateString() : undefined,
          icon: ClipboardList,
          tone: "amber",
        }),
      );
      val<any>(plans).forEach((c) =>
        alerts.push({
          id: `cp-${c.id}`,
          label: `Preventive care reminder — ${c.title ?? c.category?.[0]?.text ?? "Care plan"}`,
          icon: Syringe,
          tone: "info",
        }),
      );
      return alerts.slice(0, 8);
    },
    staleTime: 60_000,
    retry: 2,
  });

  const toneClass = {
    amber: "bg-accent-conditions/12 text-accent-conditions border-accent-conditions/25",
    rose: "bg-accent-allergies/12 text-accent-allergies border-accent-allergies/25",
    info: "bg-accent-info/12 text-accent-info border-accent-info/25",
  } as const;

  return (
    <GlassCard
      accent="conditions"
      title={
        <span className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-accent-conditions" /> Clinical alerts
        </span>
      }
    >
      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
        </div>
      ) : !data || data.length === 0 ? (
        <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
          <HeartPulse className="h-4 w-4 text-accent-observations" /> No active alerts.
        </div>
      ) : (
        <div className="max-h-[320px] space-y-2 overflow-auto">
          {data.map((a) => (
            <div
              key={a.id}
              className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${toneClass[a.tone]}`}
            >
              <a.icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{a.label}</div>
                {a.detail && <div className="text-[11px] text-muted-foreground">{a.detail}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
