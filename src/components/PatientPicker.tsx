import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Search, User, X } from "lucide-react";
import { searchResources, displayName, type FhirPatient } from "@/lib/fhir";

export interface PatientRef {
  id: string;
  name: string;
  gender?: string;
  birthDate?: string;
}

interface Props {
  label?: string;
  value: PatientRef | null;
  onChange: (v: PatientRef | null) => void;
  autoFocus?: boolean;
}

type Field = "any" | "given" | "family";

export function PatientPicker({ label = "Patient", value, onChange, autoFocus }: Props) {
  const [field, setField] = useState<Field>("any");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<FhirPatient[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (value) return;
    if (debounced.length < 2) {
      setResults([]);
      return;
    }
    let cancel = false;
    setLoading(true);
    setErr(null);
    const params: Record<string, string> = { _count: "15" };
    if (field === "given") params.given = debounced;
    else if (field === "family") params.family = debounced;
    else params.name = debounced;
    searchResources<FhirPatient>("Patient", params)
      .then((r) => {
        if (!cancel) setResults(r);
      })
      .catch((e: any) => !cancel && setErr(e.message))
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, [debounced, field, value]);

  const fields: { key: Field; label: string }[] = useMemo(
    () => [
      { key: "any", label: "Any name" },
      { key: "given", label: "Given" },
      { key: "family", label: "Family" },
    ],
    [],
  );

  if (value) {
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 truncate text-sm">
            <span className="font-medium">{value.name}</span>
            {(value.gender || value.birthDate) && (
              <span className="ml-2 text-xs text-muted-foreground">
                {value.gender ?? ""} {value.birthDate ? `• ${value.birthDate}` : ""}
              </span>
            )}
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
            <X className="h-4 w-4" /> Change
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-1 text-xs">
        {fields.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setField(f.key)}
            className={`rounded-full px-2.5 py-1 transition-colors ${
              field === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            field === "given"
              ? "Search by given name…"
              : field === "family"
                ? "Search by family name…"
                : "Search patient name or MRN…"
          }
          className="pl-9"
        />
      </div>
      <div className="max-h-64 overflow-auto rounded-lg border border-border/40 bg-background/50">
        {loading && (
          <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
          </div>
        )}
        {err && <div className="p-3 text-xs text-destructive">{err}</div>}
        {!loading && !err && debounced.length < 2 && (
          <div className="p-3 text-xs text-muted-foreground">
            Type at least 2 characters to search patients.
          </div>
        )}
        {!loading && !err && debounced.length >= 2 && results.length === 0 && (
          <div className="p-3 text-xs text-muted-foreground">No patients match "{debounced}".</div>
        )}
        {results.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() =>
              onChange({
                id: p.id!,
                name: displayName(p),
                gender: p.gender,
                birthDate: p.birthDate,
              })
            }
            className="flex w-full items-center justify-between gap-3 border-b border-border/30 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent/50"
          >
            <span className="truncate font-medium">{displayName(p)}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {p.gender ?? ""} {p.birthDate ? `• ${p.birthDate}` : ""}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
