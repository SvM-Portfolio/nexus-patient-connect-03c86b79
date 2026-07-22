import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, User, Building2, Stethoscope, Pill, FlaskConical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { searchResources, displayName, type FhirPatient } from "@/lib/fhir";

type ResultGroup = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: { id: string; primary: string; secondary?: string; onSelect: () => void }[];
};

function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const debounced = useDebounced(q.trim(), 250);
  const enabled = debounced.length >= 2;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        (ref.current?.querySelector("input") as HTMLInputElement | null)?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const { data, isFetching } = useQuery({
    enabled,
    queryKey: ["global-search", debounced],
    staleTime: 15_000,
    queryFn: async () => {
      const [patients, practitioners, organizations, medications, procedures] =
        await Promise.allSettled([
          searchResources<FhirPatient>("Patient", { name: debounced, _count: "5" }),
          searchResources("Practitioner", { name: debounced, _count: "5" }),
          searchResources("Organization", { name: debounced, _count: "5" }),
          searchResources("Medication", { "code:text": debounced, _count: "5" }),
          searchResources("ServiceRequest", { "code:text": debounced, _count: "5" }),
        ]);
      const val = <T,>(r: PromiseSettledResult<T[]>): T[] =>
        r.status === "fulfilled" ? r.value : [];
      return {
        patients: val(patients),
        practitioners: val(practitioners),
        organizations: val(organizations),
        medications: val(medications),
        procedures: val(procedures),
      };
    },
  });

  const groups: ResultGroup[] = [];
  if (data) {
    if (data.patients.length)
      groups.push({
        key: "patients",
        label: "Patients / MRN",
        icon: User,
        items: data.patients.map((p) => ({
          id: p.id!,
          primary: displayName(p),
          secondary: p.gender ? `${p.gender} • ${p.birthDate ?? ""}` : p.birthDate,
          onSelect: () => {
            setOpen(false);
            setQ("");
            navigate({ to: "/patients/$id", params: { id: p.id! } });
          },
        })),
      });
    const push = (
      key: string,
      label: string,
      icon: ResultGroup["icon"],
      items: any[],
      primary: (r: any) => string,
      secondary?: (r: any) => string | undefined,
    ) => {
      if (!items.length) return;
      groups.push({
        key,
        label,
        icon,
        items: items.map((r) => ({
          id: r.id,
          primary: primary(r),
          secondary: secondary?.(r),
          onSelect: () => setOpen(false),
        })),
      });
    };
    push("practitioners", "Providers", Stethoscope, data.practitioners,
      (r) => r.name?.[0]?.text || `${r.name?.[0]?.given?.join(" ") ?? ""} ${r.name?.[0]?.family ?? ""}`.trim() || "Provider",
      (r) => r.qualification?.[0]?.code?.text);
    push("organizations", "Organizations", Building2, data.organizations, (r) => r.name || "Organization");
    push("medications", "Medications", Pill, data.medications,
      (r) => r.code?.text || r.code?.coding?.[0]?.display || "Medication");
    push("procedures", "Lab / Procedures", FlaskConical, data.procedures,
      (r) => r.code?.text || r.code?.coding?.[0]?.display || "Order");
  }

  return (
    <div ref={ref} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        placeholder="Search patients, MRN, providers, medications…"
        className="h-9 rounded-full border-border/60 bg-background/60 pl-9 pr-16 backdrop-blur focus-visible:ring-1"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border/70 bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
        ⌘K
      </kbd>

      {open && enabled && (
        <div
          className={cn(
            "absolute left-0 right-0 top-full mt-2 max-h-[70vh] overflow-auto rounded-2xl border border-border/60 bg-popover/95 p-2 shadow-2xl backdrop-blur-xl",
          )}
        >
          {isFetching && (
            <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
            </div>
          )}
          {!isFetching && groups.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              No matches for "{debounced}"
            </div>
          )}
          {groups.map((g) => (
            <div key={g.key} className="py-1">
              <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <g.icon className="h-3 w-3" /> {g.label}
              </div>
              {g.items.map((item) => (
                <button
                  key={g.key + item.id}
                  onClick={item.onSelect}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent/60"
                >
                  <span className="truncate">{item.primary}</span>
                  {item.secondary && (
                    <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                      {item.secondary}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
