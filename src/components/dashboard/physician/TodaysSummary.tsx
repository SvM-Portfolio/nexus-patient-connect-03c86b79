import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2, UserX, UserCheck } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { searchResources } from "@/lib/fhir";

function today() {
  return new Date().toISOString().slice(0, 10);
}

interface Appt {
  status?: string;
}

export function TodaysSummary() {
  const { data, isLoading } = useQuery({
    queryKey: ["today-summary", today()],
    queryFn: () =>
      searchResources<Appt>("Appointment", {
        date: `ge${today()}`,
        _count: "200",
      }),
    staleTime: 30_000,
    retry: 2,
  });

  const counts = (data ?? []).reduce(
    (acc, a) => {
      const s = a.status ?? "";
      if (["booked", "arrived", "checked-in", "pending", "proposed"].includes(s)) acc.scheduled++;
      if (s === "noshow") acc.noShow++;
      if (["fulfilled", "completed"].includes(s)) acc.seen++;
      return acc;
    },
    { scheduled: 0, noShow: 0, seen: 0 },
  );

  const cards = [
    {
      label: "Patients scheduled",
      value: counts.scheduled,
      sub: "Today's appointments",
      icon: CalendarCheck2,
      accent: "summary" as const,
      color: "text-accent-summary",
    },
    {
      label: "No-show patients",
      value: counts.noShow,
      sub: "Missed today",
      icon: UserX,
      accent: "conditions" as const,
      color: "text-accent-conditions",
    },
    {
      label: "Patients seen today",
      value: counts.seen,
      sub: "Completed encounters",
      icon: UserCheck,
      accent: "observations" as const,
      color: "text-accent-observations",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <GlassCard key={c.label} accent={c.accent}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {c.label}
              </div>
              <div className={`mt-3 text-4xl font-bold tracking-tight transition-all ${c.color}`}>
                {isLoading ? <Skeleton className="h-10 w-16" /> : c.value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{c.sub}</div>
            </div>
            <div className={`rounded-xl bg-muted/40 p-2 ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
