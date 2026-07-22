import { useQuery } from "@tanstack/react-query";
import { CalendarDays, LogIn, DoorOpen, LogOut, UserX } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { searchResources } from "@/lib/fhir";

interface Appt { status?: string }
function today() { return new Date().toISOString().slice(0, 10); }

export function PatientFlow() {
  const { data, isLoading } = useQuery({
    queryKey: ["fo-patient-flow", today()],
    queryFn: () => searchResources<Appt>("Appointment", { date: `eq${today()}`, _count: "200" }),
    staleTime: 20_000, retry: 2,
  });
  const list = data ?? [];
  const kpis = [
    { label: "Scheduled", value: list.filter((a) => a.status === "booked" || a.status === "pending").length, icon: CalendarDays, color: "text-accent-summary" },
    { label: "Checked in", value: list.filter((a) => a.status === "arrived" || a.status === "checked-in").length, icon: LogIn, color: "text-accent-info" },
    { label: "In room", value: list.filter((a) => a.status === "in-progress").length, icon: DoorOpen, color: "text-accent-encounters" },
    { label: "Checked out", value: list.filter((a) => a.status === "fulfilled" || a.status === "completed").length, icon: LogOut, color: "text-accent-observations" },
    { label: "No show", value: list.filter((a) => a.status === "noshow").length, icon: UserX, color: "text-accent-conditions" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {kpis.map((k) => (
        <GlassCard key={k.label} padded={false} accent="summary" className="p-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg bg-muted/40 p-2 ${k.color}`}><k.icon className="h-4 w-4" /></div>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{k.label}</div>
              <div className={`text-2xl font-bold tabular-nums ${k.color}`}>
                {isLoading ? <Skeleton className="h-7 w-10" /> : k.value}
              </div>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
