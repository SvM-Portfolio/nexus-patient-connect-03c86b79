import { useQuery } from "@tanstack/react-query";
import { FlaskConical, Loader2, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { searchResources } from "@/lib/fhir";

interface DiagnosticReport {
  id: string;
  status?: string;
  conclusion?: string;
  conclusionCode?: any[];
  extension?: any[];
  category?: any[];
}

function isAbnormal(r: DiagnosticReport) {
  const codes = r.conclusionCode?.flatMap((c) => c.coding?.map((cd: any) => cd.code) ?? []) ?? [];
  if (codes.some((c: string) => ["A", "AA", "H", "HH", "L", "LL"].includes(c))) return true;
  const text = (r.conclusion ?? "").toLowerCase();
  return /abnormal|critical|high|low/.test(text);
}

function isReviewed(r: DiagnosticReport) {
  return r.status === "final" || r.extension?.some((e) => e.url?.includes("reviewed"));
}

export function LaboratoryOrders() {
  const { data, isLoading } = useQuery({
    queryKey: ["lab-orders"],
    queryFn: () =>
      searchResources<DiagnosticReport>("DiagnosticReport", {
        _sort: "-date",
        _count: "100",
      }),
    staleTime: 60_000,
    retry: 2,
  });

  const reports = data ?? [];
  const buckets = [
    { key: "received", label: "Results received", count: reports.length, color: "bg-accent-info/15 text-accent-info" },
    {
      key: "normal-unrev",
      label: "Normal · unreviewed",
      count: reports.filter((r) => !isAbnormal(r) && !isReviewed(r)).length,
      color: "bg-accent-observations/15 text-accent-observations",
    },
    {
      key: "normal-rev",
      label: "Normal · reviewed",
      count: reports.filter((r) => !isAbnormal(r) && isReviewed(r)).length,
      color: "bg-muted text-muted-foreground",
    },
    {
      key: "abn-unrev",
      label: "Abnormal · unreviewed",
      count: reports.filter((r) => isAbnormal(r) && !isReviewed(r)).length,
      color: "bg-accent-conditions/15 text-accent-conditions",
    },
    {
      key: "abn-rev",
      label: "Abnormal · reviewed",
      count: reports.filter((r) => isAbnormal(r) && isReviewed(r)).length,
      color: "bg-accent-medications/15 text-accent-medications",
    },
  ];

  return (
    <GlassCard
      accent="observations"
      title={
        <span className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-accent-observations" /> Laboratory orders
        </span>
      }
    >
      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          {buckets.map((b) => (
            <button
              key={b.key}
              className="group flex w-full items-center justify-between rounded-xl border border-border/40 bg-background/40 px-3 py-2.5 text-left transition-colors hover:bg-accent/40"
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${b.color}`}>
                  <FlaskConical className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm">{b.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tabular-nums">{b.count}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </button>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
