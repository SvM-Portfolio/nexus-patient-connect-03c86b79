import { useQuery } from "@tanstack/react-query";
import { Calendar, Loader2, PlusCircle, RefreshCw, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { searchResources } from "@/lib/fhir";

interface Appointment {
  id: string;
  status?: string;
  start?: string;
  end?: string;
  description?: string;
  serviceType?: any[];
  participant?: any[];
}

function fmtTime(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function CalendarPopover() {
  const { data: appts, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["cal-popover-appts"],
    queryFn: () =>
      searchResources<Appointment>("Appointment", {
        date: `ge${today()}`,
        _sort: "date",
        _count: "8",
      }),
    staleTime: 30_000,
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="Calendar">
          <Calendar className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] rounded-2xl border-border/60 bg-popover/95 p-0 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Schedule</div>
            <div className="text-[11px] text-muted-foreground">Upcoming appointments & events</div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()}>
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="max-h-[380px] overflow-auto p-2">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Upcoming appointments
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
            </div>
          )}
          {!isLoading && (!appts || appts.length === 0) && (
            <div className="px-3 py-4 text-xs text-muted-foreground">No upcoming appointments.</div>
          )}
          {appts?.map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between gap-2 rounded-md px-3 py-2 hover:bg-accent/50"
            >
              <div className="min-w-0">
                <div className="text-xs font-medium">{fmtTime(a.start)}</div>
                <div className="truncate text-sm">{a.description || a.serviceType?.[0]?.text || "Appointment"}</div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {a.participant?.map((p: any) => p.actor?.display).filter(Boolean).join(" • ") || "—"}
                </div>
              </div>
              <Badge variant="secondary" className="shrink-0 text-[10px] capitalize">
                {a.status ?? "booked"}
              </Badge>
            </div>
          ))}

          <div className="mt-3 border-t border-border/50 px-2 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Quick actions
          </div>
          <div className="grid grid-cols-2 gap-1 p-2">
            <Button variant="ghost" size="sm" className="justify-start text-xs">
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Schedule
            </Button>
            <Button variant="ghost" size="sm" className="justify-start text-xs">
              <Check className="mr-1.5 h-3.5 w-3.5" /> Accept request
            </Button>
            <Button variant="ghost" size="sm" className="justify-start text-xs">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Reschedule
            </Button>
            <Button variant="ghost" size="sm" className="justify-start text-xs">
              <X className="mr-1.5 h-3.5 w-3.5" /> Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
