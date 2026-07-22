import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search as SearchIcon, Plus } from "lucide-react";
import { searchResources, createResource } from "@/lib/fhir";
import type { OrgRef, PractitionerRef } from "@/lib/intake-draft";

interface OrgPickerProps {
  label: string;
  value: OrgRef | null;
  onChange: (v: OrgRef | null) => void;
  required?: boolean;
}

export function OrganizationPicker({ label, value, onChange, required }: OrgPickerProps) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancel = false;
    setLoading(true);
    setErr(null);
    const t = setTimeout(async () => {
      try {
        const params: Record<string, string> = { _count: "20" };
        if (q.trim()) params.name = q.trim();
        const orgs = await searchResources("Organization", params);
        if (!cancel) setResults(orgs);
      } catch (e: any) {
        if (!cancel) setErr(e.message);
      } finally {
        if (!cancel) setLoading(false);
      }
    }, 250);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [q, open]);

  const createNew = async () => {
    const name = q.trim();
    if (!name) return;
    setCreating(true);
    setErr(null);
    try {
      const created = await createResource<any>("Organization", {
        resourceType: "Organization",
        active: true,
        name,
      });
      onChange({ id: created.id, name: created.name || name });
      setOpen(false);
      setQ("");
    } catch (e: any) {
      setErr(e.message || "Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {value ? (
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <span className="flex-1 truncate">{value.name}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            Change
          </Button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
              placeholder="Search organizations..."
              className="pl-9"
            />
          </div>
          {open && (
            <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
              {loading ? (
                <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                </div>
              ) : err ? (
                <div className="p-3 text-sm text-destructive">{err}</div>
              ) : results.length === 0 ? (
                <div className="p-2">
                  <div className="p-2 text-sm text-muted-foreground">No matches</div>
                  {q.trim() && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={createNew}
                      disabled={creating}
                      className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-accent"
                    >
                      {creating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Create "{q.trim()}"
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {results.map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onChange({ id: r.id, name: r.name || "(unnamed)" });
                        setOpen(false);
                        setQ("");
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      {r.name || "(unnamed)"}
                    </button>
                  ))}
                  {q.trim() && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={createNew}
                      disabled={creating}
                      className="flex w-full items-center gap-2 border-t px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      {creating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Create "{q.trim()}"
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface PracPickerProps {
  label: string;
  value: PractitionerRef | null;
  onChange: (v: PractitionerRef | null) => void;
}

function practitionerName(p: any): string {
  const n = p.name?.[0];
  if (!n) return "(unnamed)";
  const given = (n.given ?? []).join(" ");
  return `${given} ${n.family ?? ""}`.trim() || n.text || "(unnamed)";
}

export function PractitionerPicker({ label, value, onChange }: PracPickerProps) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancel = false;
    setLoading(true);
    setErr(null);
    const t = setTimeout(async () => {
      try {
        const params: Record<string, string> = { _count: "20" };
        if (q.trim()) params.name = q.trim();
        const list = await searchResources("Practitioner", params);
        if (!cancel) setResults(list);
      } catch (e: any) {
        if (!cancel) setErr(e.message);
      } finally {
        if (!cancel) setLoading(false);
      }
    }, 250);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [q, open]);

  const createNew = async () => {
    const name = q.trim();
    if (!name) return;
    const parts = name.split(/\s+/);
    const family = parts.length > 1 ? parts.pop()! : parts[0];
    const given = parts.length ? parts : [];
    setCreating(true);
    setErr(null);
    try {
      const created = await createResource<any>("Practitioner", {
        resourceType: "Practitioner",
        active: true,
        name: [{ use: "official", family, given }],
      });
      onChange({ id: created.id, name: practitionerName(created) });
      setOpen(false);
      setQ("");
    } catch (e: any) {
      setErr(e.message || "Failed to create practitioner");
    } finally {
      setCreating(false);
    }
  };

  const items = useMemo(() => results.map((r) => ({ id: r.id, display: practitionerName(r) })), [results]);

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium">{label}</label>
      {value ? (
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <span className="flex-1 truncate">{value.name}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            Change
          </Button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
              placeholder="Search practitioners..."
              className="pl-9"
            />
          </div>
          {open && (
            <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
              {loading ? (
                <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                </div>
              ) : err ? (
                <div className="p-3 text-sm text-destructive">{err}</div>
              ) : items.length === 0 ? (
                <div className="p-2">
                  <div className="p-2 text-sm text-muted-foreground">No matches</div>
                  {q.trim() && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={createNew}
                      disabled={creating}
                      className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-accent"
                    >
                      {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Create "{q.trim()}"
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {items.map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onChange({ id: r.id, name: r.display });
                        setOpen(false);
                        setQ("");
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      {r.display}
                    </button>
                  ))}
                  {q.trim() && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={createNew}
                      disabled={creating}
                      className="flex w-full items-center gap-2 border-t px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Create "{q.trim()}"
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
