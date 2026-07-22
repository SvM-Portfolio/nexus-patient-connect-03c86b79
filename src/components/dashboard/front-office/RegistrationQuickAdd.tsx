import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { UserPlus, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { searchResources, displayName, type FhirPatient } from "@/lib/fhir";

export function RegistrationQuickAdd() {
  const { data, isLoading } = useQuery({
    queryKey: ["fo-recent-registrations"],
    queryFn: () => searchResources<FhirPatient>("Patient", { _sort: "-_lastUpdated", _count: "6" }),
    staleTime: 60_000, retry: 2,
  });

  return (
    <GlassCard accent="encounters" title={<span className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-accent-encounters" /> Registration</span>}
      action={<Button asChild size="sm" className="h-7 gap-1 text-xs"><Link to="/patients/new"><UserPlus className="h-3 w-3" /> New</Link></Button>}>
      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…</div>
      ) : (
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recent registrations</div>
          {data?.map((p) => (
            <Link key={p.id} to="/patients/$id" params={{ id: p.id! }} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs hover:bg-accent/40">
              <span className="truncate">{displayName(p)}</span>
              <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">{p.gender ?? ""}</span>
            </Link>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
