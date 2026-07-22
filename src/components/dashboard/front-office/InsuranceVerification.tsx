import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { searchResources } from "@/lib/fhir";

interface Coverage {
  id: string; status?: string; payor?: { display?: string }[]; beneficiary?: { display?: string }; period?: { start?: string; end?: string };
}

export function InsuranceVerification() {
  const { data, isLoading } = useQuery({
    queryKey: ["fo-insurance"],
    queryFn: () => searchResources<Coverage>("Coverage", { _sort: "-_lastUpdated", _count: "10" }),
    staleTime: 60_000, retry: 2,
  });

  return (
    <GlassCard accent="billing" title={<span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent-billing" /> Insurance verification</span>}>
      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…</div>
      ) : !data || data.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">No coverage records.</div>
      ) : (
        <div className="max-h-[320px] space-y-2 overflow-auto">
          {data.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 rounded-xl border border-border/40 bg-background/40 px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{c.beneficiary?.display ?? "Beneficiary"}</div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {c.payor?.[0]?.display ?? "Unknown payor"} · <Badge variant="secondary" className="ml-1 text-[10px] capitalize">{c.status ?? "unknown"}</Badge>
                </div>
              </div>
              <Button size="sm" variant="secondary" className="h-7 text-xs">Verify</Button>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
