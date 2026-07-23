import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileJson,
  FileSpreadsheet,
  FileCode,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  searchPatients,
  displayName,
  type FhirBundle,
  type FhirPatient,
} from "@/lib/fhir";
import { GenderBadge } from "@/components/GenderBadge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/fhir-resources")({
  head: () => ({
    meta: [
      { title: "FHIR Resources Explorer — Nexus Pro" },
      {
        name: "description",
        content:
          "Explore full FHIR patient bundles: parse JSON, inspect resource types, and export as JSON, CSV, or XML.",
      },
      { property: "og:title", content: "FHIR Resources Explorer — Nexus Pro" },
      {
        property: "og:description",
        content:
          "Inspect and export FHIR Patient bundles with resource-type analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FhirResourcesPage,
});

const PAGE_SIZE = 15;

type SortKey = "name" | "birthdate" | "gender";

function FhirResourcesPage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<FhirPatient | null>(null);

  const sortParam =
    sort === "name" ? "family" : sort === "birthdate" ? "-birthdate" : "gender";

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["fhir-explorer-patients", query, sortParam, offset],
    queryFn: () =>
      searchPatients({
        offset,
        count: PAGE_SIZE,
        name: query,
        sort: sortParam,
      }),
  });

  const patients = data?.patients ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(input);
    setOffset(0);
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Database className="h-6 w-6 text-primary" />
            FHIR Resources Explorer
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search patients, inspect their full FHIR bundle, and export in JSON, CSV, or XML.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
        {/* Left: Patient list */}
        <Card className="h-fit">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Patients</CardTitle>
              <span className="text-xs text-muted-foreground">
                {total.toLocaleString()} records
              </span>
            </div>
            <form onSubmit={submit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Search name or ID"
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="secondary" disabled={isFetching}>
                Search
              </Button>
            </form>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Sort</span>
              <Select
                value={sort}
                onValueChange={(v) => {
                  setSort(v as SortKey);
                  setOffset(0);
                }}
              >
                <SelectTrigger className="h-8 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="birthdate">DOB (newest)</SelectItem>
                  <SelectItem value="gender">Gender</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Failed to load</AlertTitle>
                <AlertDescription>{(error as Error).message}</AlertDescription>
              </Alert>
            )}
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : patients.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No patients found.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((p) => {
                      const isActive = selected?.id === p.id;
                      return (
                        <TableRow
                          key={p.id}
                          onClick={() => setSelected(p)}
                          className={cn(
                            "cursor-pointer",
                            isActive && "bg-accent/70",
                          )}
                        >
                          <TableCell className="font-medium">
                            {displayName(p)}
                          </TableCell>
                          <TableCell>
                            <GenderBadge gender={p.gender} />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {p.birthDate || "—"}
                          </TableCell>
                          <TableCell className="max-w-[6rem] truncate font-mono text-xs text-muted-foreground">
                            {p.id}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setOffset(0)}
                  disabled={offset === 0 || isFetching}
                  aria-label="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                  disabled={offset === 0 || isFetching}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                  disabled={currentPage >= totalPages || isFetching}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setOffset((totalPages - 1) * PAGE_SIZE)}
                  disabled={currentPage >= totalPages || isFetching}
                  aria-label="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Source pane */}
        <div>
          {selected ? (
            <PatientSourcePane patient={selected} />
          ) : (
            <Card className="flex h-[600px] items-center justify-center">
              <div className="max-w-xs text-center text-sm text-muted-foreground">
                <Database className="mx-auto mb-3 h-8 w-8 opacity-50" />
                Select a patient on the left to load their full FHIR bundle.
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function PatientSourcePane({ patient }: { patient: FhirPatient }) {
  const [filter, setFilter] = useState<string | null>(null);

  const { data: bundle, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["fhir-everything", patient.id],
    queryFn: async () => {
      const res = await fetch(`/api/fhir/Patient/${patient.id}/$everything?_count=200`, {
        headers: { Accept: "application/fhir+json" },
      });
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }
      return (await res.json()) as FhirBundle;
    },
  });

  const entries = bundle?.entry ?? [];
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entries) {
      const rt = (e.resource as any)?.resourceType;
      if (!rt) continue;
      m.set(rt, (m.get(rt) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const filteredBundle = useMemo(() => {
    if (!bundle) return null;
    if (!filter) return bundle;
    return {
      ...bundle,
      entry: entries.filter(
        (e) => (e.resource as any)?.resourceType === filter,
      ),
    };
  }, [bundle, entries, filter]);

  const download = (blob: Blob, ext: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patient-${patient.id}-bundle.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    if (!filteredBundle) return;
    download(
      new Blob([JSON.stringify(filteredBundle, null, 2)], {
        type: "application/json",
      }),
      "json",
    );
    toast.success("Exported bundle as JSON");
  };

  const exportCsv = () => {
    if (!filteredBundle) return;
    const rows = (filteredBundle.entry ?? []).map((e) => {
      const r = e.resource as any;
      return {
        resourceType: r?.resourceType ?? "",
        id: r?.id ?? "",
        lastUpdated: r?.meta?.lastUpdated ?? "",
        summary: summarizeResource(r),
      };
    });
    const headers = ["resourceType", "id", "lastUpdated", "summary"];
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => csvEscape(String((r as any)[h] ?? "")))
          .join(","),
      ),
    ].join("\n");
    download(new Blob([csv], { type: "text/csv" }), "csv");
    toast.success("Exported bundle as CSV");
  };

  const exportXml = () => {
    if (!filteredBundle) return;
    download(
      new Blob([toXml(filteredBundle)], { type: "application/xml" }),
      "xml",
    );
    toast.success("Exported bundle as XML");
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{displayName(patient)}</CardTitle>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              Patient/{patient.id}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportJson}
              disabled={!bundle}
            >
              <FileJson className="mr-1.5 h-4 w-4" /> JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={!bundle}
            >
              <FileSpreadsheet className="mr-1.5 h-4 w-4" /> CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportXml}
              disabled={!bundle}
            >
              <FileCode className="mr-1.5 h-4 w-4" /> XML
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Reload
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Failed to fetch $everything</AlertTitle>
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Fetching bundle…
          </div>
        ) : bundle ? (
          <>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  Resource types ({counts.length})
                </h3>
                {filter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilter(null)}
                  >
                    Show all
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {counts.map(([rt, n]) => (
                  <button
                    key={rt}
                    type="button"
                    onClick={() => setFilter(filter === rt ? null : rt)}
                  >
                    <Badge
                      variant={filter === rt ? "default" : "secondary"}
                      className="cursor-pointer"
                    >
                      {rt} <span className="ml-1 opacity-70">({n})</span>
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            <BundleViewer bundle={filteredBundle!} />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function BundleViewer({ bundle }: { bundle: FhirBundle }) {
  const [showRaw, setShowRaw] = useState(false);
  const entries = bundle.entry ?? [];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Entries ({entries.length})
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRaw((s) => !s)}
        >
          {showRaw ? "Show list" : "Show raw JSON"}
        </Button>
      </div>
      {showRaw ? (
        <pre className="max-h-[600px] overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs">
          {JSON.stringify(bundle, null, 2)}
        </pre>
      ) : (
        <div className="max-h-[600px] space-y-2 overflow-auto rounded-md border p-2">
          {entries.map((e, i) => {
            const r = e.resource as any;
            return (
              <ResourceItem
                key={`${r?.resourceType}-${r?.id}-${i}`}
                resource={r}
              />
            );
          })}
          {entries.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No entries.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResourceItem({ resource }: { resource: any }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent/50"
      >
        <span className="flex items-center gap-2">
          <Badge variant="outline">{resource?.resourceType}</Badge>
          <span className="font-mono text-xs text-muted-foreground">
            {resource?.id}
          </span>
          <span className="text-muted-foreground">
            {summarizeResource(resource)}
          </span>
        </span>
        <span className="text-xs text-muted-foreground">
          {open ? "Hide" : "View"}
        </span>
      </button>
      {open && (
        <pre className="max-h-80 overflow-auto border-t bg-muted/40 p-2 font-mono text-xs">
          {JSON.stringify(resource, null, 2)}
        </pre>
      )}
    </div>
  );
}

function summarizeResource(r: any): string {
  if (!r) return "";
  if (r.resourceType === "Patient") {
    const n = r.name?.[0];
    return [n?.given?.join(" "), n?.family].filter(Boolean).join(" ");
  }
  return (
    r.code?.text ||
    r.code?.coding?.[0]?.display ||
    r.medicationCodeableConcept?.text ||
    r.type?.[0]?.text ||
    r.description ||
    r.status ||
    ""
  );
}

function csvEscape(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function toXml(bundle: FhirBundle): string {
  const esc = (s: any) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const walk = (val: any, key: string): string => {
    if (val === null || val === undefined) return "";
    if (Array.isArray(val)) {
      return val.map((v) => walk(v, key)).join("");
    }
    if (typeof val === "object") {
      const inner = Object.entries(val)
        .map(([k, v]) => walk(v, k))
        .join("");
      return `<${key}>${inner}</${key}>`;
    }
    return `<${key}>${esc(val)}</${key}>`;
  };
  return `<?xml version="1.0" encoding="UTF-8"?>\n${walk(bundle, "Bundle")}`;
}
