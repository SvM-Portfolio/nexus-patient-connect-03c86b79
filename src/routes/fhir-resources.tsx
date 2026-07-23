import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  FileJson,
  FileSpreadsheet,
  FileCode,
  Database,
  Copy,
  Loader2,
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
import { GenderBadge } from "@/components/GenderBadge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/fhir-resources")({
  head: () => ({
    meta: [
      { title: "FHIR Patient Explorer — Nexus Pro" },
      {
        name: "description",
        content:
          "Explore FHIR patient bundles: inspect resource types and export as JSON, CSV, or XML.",
      },
      { property: "og:title", content: "FHIR Patient Explorer — Nexus Pro" },
      {
        property: "og:description",
        content: "Inspect and export FHIR Patient bundles.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FhirResourcesPage,
});

// ------- Mock Data -------
type MockPatient = {
  id: string;
  name: string;
  given: string;
  family: string;
  gender: "male" | "female" | "other";
  birthDate: string;
};

const MOCK_PATIENTS: MockPatient[] = [
  { id: "p-001", name: "John Doe", given: "John", family: "Doe", gender: "male", birthDate: "1978-04-12" },
  { id: "p-002", name: "Jane Smith", given: "Jane", family: "Smith", gender: "female", birthDate: "1985-09-30" },
  { id: "p-003", name: "Robert Chen", given: "Robert", family: "Chen", gender: "male", birthDate: "1962-01-22" },
  { id: "p-004", name: "Maria Garcia", given: "Maria", family: "Garcia", gender: "female", birthDate: "1990-07-05" },
  { id: "p-005", name: "Ahmed Khan", given: "Ahmed", family: "Khan", gender: "male", birthDate: "1974-11-18" },
  { id: "p-006", name: "Emily Johnson", given: "Emily", family: "Johnson", gender: "female", birthDate: "2001-03-14" },
  { id: "p-007", name: "Liu Wei", given: "Wei", family: "Liu", gender: "male", birthDate: "1955-06-09" },
  { id: "p-008", name: "Priya Patel", given: "Priya", family: "Patel", gender: "female", birthDate: "1988-12-27" },
  { id: "p-009", name: "Carlos Rivera", given: "Carlos", family: "Rivera", gender: "male", birthDate: "1969-08-02" },
  { id: "p-010", name: "Sofia Rossi", given: "Sofia", family: "Rossi", gender: "female", birthDate: "1995-05-21" },
];

function buildBundle(p: MockPatient) {
  const ref = `Patient/${p.id}`;
  const entry = (resource: any) => ({ fullUrl: `urn:uuid:${resource.resourceType}-${resource.id}`, resource });
  const now = new Date().toISOString();
  return {
    resourceType: "Bundle",
    id: `bundle-${p.id}`,
    type: "searchset",
    meta: { lastUpdated: now },
    entry: [
      entry({
        resourceType: "Patient",
        id: p.id,
        name: [{ use: "official", family: p.family, given: [p.given] }],
        gender: p.gender,
        birthDate: p.birthDate,
        telecom: [{ system: "phone", value: "+1-555-0100", use: "mobile" }],
        address: [{ line: ["123 Care Ave"], city: "Boston", state: "MA", postalCode: "02118" }],
      }),
      entry({
        resourceType: "Observation",
        id: `${p.id}-o1`,
        status: "final",
        code: { coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart rate" }], text: "Heart rate" },
        subject: { reference: ref },
        effectiveDateTime: "2026-07-01T09:15:00Z",
        valueQuantity: { value: 72, unit: "beats/min" },
      }),
      entry({
        resourceType: "Observation",
        id: `${p.id}-o2`,
        status: "final",
        code: { coding: [{ system: "http://loinc.org", code: "85354-9", display: "Blood pressure" }], text: "Blood pressure" },
        subject: { reference: ref },
        effectiveDateTime: "2026-07-01T09:16:00Z",
        component: [
          { code: { coding: [{ code: "8480-6", display: "Systolic" }] }, valueQuantity: { value: 122, unit: "mmHg" } },
          { code: { coding: [{ code: "8462-4", display: "Diastolic" }] }, valueQuantity: { value: 78, unit: "mmHg" } },
        ],
      }),
      entry({
        resourceType: "Observation",
        id: `${p.id}-o3`,
        status: "final",
        code: { coding: [{ system: "http://loinc.org", code: "4548-4", display: "HbA1c" }] },
        subject: { reference: ref },
        effectiveDateTime: "2026-06-20T10:00:00Z",
        valueQuantity: { value: 6.1, unit: "%" },
      }),
      entry({
        resourceType: "Condition",
        id: `${p.id}-c1`,
        clinicalStatus: { coding: [{ code: "active" }] },
        code: { text: "Type 2 Diabetes Mellitus" },
        subject: { reference: ref },
        recordedDate: "2022-05-14",
      }),
      entry({
        resourceType: "Condition",
        id: `${p.id}-c2`,
        clinicalStatus: { coding: [{ code: "active" }] },
        code: { text: "Hypertension" },
        subject: { reference: ref },
        recordedDate: "2021-09-02",
      }),
      entry({
        resourceType: "Encounter",
        id: `${p.id}-e1`,
        status: "finished",
        class: { code: "AMB", display: "ambulatory" },
        subject: { reference: ref },
        period: { start: "2026-07-01T09:00:00Z", end: "2026-07-01T09:45:00Z" },
        reasonCode: [{ text: "Follow-up visit" }],
      }),
      entry({
        resourceType: "Encounter",
        id: `${p.id}-e2`,
        status: "finished",
        class: { code: "AMB" },
        subject: { reference: ref },
        period: { start: "2026-05-12T14:00:00Z", end: "2026-05-12T14:30:00Z" },
        reasonCode: [{ text: "Annual physical" }],
      }),
      entry({
        resourceType: "MedicationRequest",
        id: `${p.id}-m1`,
        status: "active",
        intent: "order",
        medicationCodeableConcept: { text: "Metformin 500 mg" },
        subject: { reference: ref },
        authoredOn: "2026-06-20",
        dosageInstruction: [{ text: "1 tablet by mouth twice daily" }],
      }),
      entry({
        resourceType: "MedicationRequest",
        id: `${p.id}-m2`,
        status: "active",
        intent: "order",
        medicationCodeableConcept: { text: "Lisinopril 10 mg" },
        subject: { reference: ref },
        authoredOn: "2026-06-20",
        dosageInstruction: [{ text: "1 tablet by mouth daily" }],
      }),
    ],
  };
}

const PAGE_SIZE = 6;

function FhirResourcesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(MOCK_PATIENTS[0].id);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_PATIENTS;
    return MOCK_PATIENTS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
    );
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const selected = MOCK_PATIENTS.find((p) => p.id === selectedId) ?? null;

  const selectPatient = (id: string) => {
    if (id === selectedId) return;
    setLoading(true);
    setSelectedId(id);
    setTimeout(() => setLoading(false), 250);
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Database className="h-6 w-6 text-primary" />
          FHIR Patient Explorer
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse mock patients, inspect their FHIR bundle, and export in JSON, CSV, or XML.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left panel */}
        <Card className="h-fit lg:col-span-1">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Patients</CardTitle>
              <span className="text-xs text-muted-foreground">{filtered.length} records</span>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Search by name or ID"
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pageItems.length === 0 ? (
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
                    {pageItems.map((p) => (
                      <TableRow
                        key={p.id}
                        onClick={() => selectPatient(p.id)}
                        className={cn(
                          "cursor-pointer",
                          selectedId === p.id && "bg-accent/70",
                        )}
                      >
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell><GenderBadge gender={p.gender} /></TableCell>
                        <TableCell className="whitespace-nowrap">{p.birthDate}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.id}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right panel */}
        <div className="lg:col-span-2">
          {selected ? (
            <PatientSourcePane patient={selected} loading={loading} />
          ) : (
            <Card className="flex h-[600px] items-center justify-center">
              <div className="max-w-xs text-center text-sm text-muted-foreground">
                <Database className="mx-auto mb-3 h-8 w-8 opacity-50" />
                Select a patient on the left to view their FHIR bundle.
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function PatientSourcePane({ patient, loading }: { patient: MockPatient; loading: boolean }) {
  const [filter, setFilter] = useState<string | null>(null);

  const bundle = useMemo(() => buildBundle(patient), [patient]);
  const entries = bundle.entry ?? [];

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
    if (!filter) return bundle;
    return {
      ...bundle,
      entry: entries.filter((e) => (e.resource as any)?.resourceType === filter),
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
    download(
      new Blob([JSON.stringify(filteredBundle, null, 2)], { type: "application/json" }),
      "json",
    );
    toast.success("Exported bundle as JSON");
  };

  const exportCsv = () => {
    const rows = (filteredBundle.entry ?? []).map((e) => {
      const r = e.resource as any;
      return {
        resourceType: r?.resourceType ?? "",
        id: r?.id ?? "",
        status: r?.status ?? "",
        summary: summarizeResource(r),
      };
    });
    const headers = ["resourceType", "id", "status", "summary"];
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => csvEscape(String((r as any)[h] ?? ""))).join(","),
      ),
    ].join("\n");
    download(new Blob([csv], { type: "text/csv" }), "csv");
    toast.success("Exported bundle as CSV");
  };

  const exportXml = () => {
    download(new Blob([toXml(filteredBundle)], { type: "application/xml" }), "xml");
    toast.success("Exported bundle as XML");
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(filteredBundle, null, 2));
      toast.success("Copied JSON to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const totalEntries = entries.length;

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{patient.name}</CardTitle>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              Patient/{patient.id}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={copyJson}>
              <Copy className="mr-1.5 h-4 w-4" /> Copy JSON
            </Button>
            <Button variant="outline" size="sm" onClick={exportJson}>
              <FileJson className="mr-1.5 h-4 w-4" /> JSON
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <FileSpreadsheet className="mr-1.5 h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportXml}>
              <FileCode className="mr-1.5 h-4 w-4" /> XML
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading bundle…
          </div>
        ) : (
          <>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  Resource types ({counts.length})
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => setFilter(null)}>
                  <Badge
                    variant={filter === null ? "default" : "secondary"}
                    className="cursor-pointer"
                  >
                    All <span className="ml-1 opacity-70">({totalEntries})</span>
                  </Badge>
                </button>
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

            <BundleViewer bundle={filteredBundle} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BundleViewer({ bundle }: { bundle: any }) {
  const [showRaw, setShowRaw] = useState(true);
  const entries = bundle.entry ?? [];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Entries ({entries.length})</h3>
        <Button variant="outline" size="sm" onClick={() => setShowRaw((s) => !s)}>
          {showRaw ? "Show list" : "Show raw JSON"}
        </Button>
      </div>
      {showRaw ? (
        <pre className="max-h-[600px] overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs">
          <JsonHighlight value={bundle} />
        </pre>
      ) : (
        <div className="max-h-[600px] space-y-2 overflow-auto rounded-md border p-2">
          {entries.map((e: any, i: number) => (
            <ResourceItem key={`${e.resource?.resourceType}-${e.resource?.id}-${i}`} resource={e.resource} />
          ))}
          {entries.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">No entries.</div>
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
          <span className="font-mono text-xs text-muted-foreground">{resource?.id}</span>
          <span className="text-muted-foreground">{summarizeResource(resource)}</span>
        </span>
        <span className="text-xs text-muted-foreground">{open ? "Hide" : "View"}</span>
      </button>
      {open && (
        <pre className="max-h-80 overflow-auto border-t bg-muted/40 p-2 font-mono text-xs">
          <JsonHighlight value={resource} />
        </pre>
      )}
    </div>
  );
}

function JsonHighlight({ value }: { value: any }) {
  const json = JSON.stringify(value, null, 2);
  const escaped = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const highlighted = escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "text-emerald-700 dark:text-emerald-400"; // number
      if (/^"/.test(match)) {
        cls = /:$/.test(match)
          ? "text-sky-700 dark:text-sky-400 font-medium" // key
          : "text-amber-700 dark:text-amber-400"; // string
      } else if (/true|false/.test(match)) {
        cls = "text-fuchsia-700 dark:text-fuchsia-400";
      } else if (/null/.test(match)) {
        cls = "text-muted-foreground italic";
      }
      return `<span class="${cls}">${match}</span>`;
    },
  );
  return <code dangerouslySetInnerHTML={{ __html: highlighted }} />;
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
    r.reasonCode?.[0]?.text ||
    r.status ||
    ""
  );
}

function csvEscape(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function toXml(bundle: any): string {
  const esc = (s: any) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const walk = (val: any, key: string): string => {
    if (val === null || val === undefined) return "";
    if (Array.isArray(val)) return val.map((v) => walk(v, key)).join("");
    if (typeof val === "object") {
      const inner = Object.entries(val).map(([k, v]) => walk(v, k)).join("");
      return `<${key}>${inner}</${key}>`;
    }
    return `<${key}>${esc(val)}</${key}>`;
  };
  return `<?xml version="1.0" encoding="UTF-8"?>\n${walk(bundle, "Bundle")}`;
}
