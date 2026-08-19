import { createFileRoute, Link } from "@tanstack/react-router";
import { FileJson, FileSpreadsheet, FileCode } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPageHeader } from "@/components/AdminPageHeader";

export const Route = createFileRoute("/admin/data-export")({
  head: () => ({
    meta: [
      { title: "Data Export — Nexus Pro Admin" },
      {
        name: "description",
        content:
          "Export synthetic FHIR bundles as JSON, CSV or XML from the Nexus Pro admin area.",
      },
      { property: "og:title", content: "Data Export — Nexus Pro Admin" },
      {
        property: "og:description",
        content: "Bundle export tooling for the Nexus Pro demo environment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AdminGuard>
      <DataExportPage />
    </AdminGuard>
  ),
});

const FORMATS = [
  { icon: FileJson, label: "JSON", desc: "Raw FHIR Bundle, unmodified." },
  { icon: FileSpreadsheet, label: "CSV", desc: "Flattened resource rows for analysis." },
  { icon: FileCode, label: "XML", desc: "FHIR XML serialization." },
];

function DataExportPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8">
      <AdminPageHeader
        title="Data Export"
        tag="PoC"
        description="Per-patient bundle export runs today inside FHIR Explorer. Batch and scheduled exports are not implemented in this proof of concept. Synthetic data only."
      />

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {FORMATS.map((f) => (
          <GlassCard key={f.label} className="p-5">
            <f.icon className="h-6 w-6 text-primary" />
            <h2 className="mt-3 text-base font-semibold">{f.label} export</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
          </GlassCard>
        ))}
      </div>

      <Button asChild className="mt-6">
        <Link to="/admin/fhir-explorer">Open FHIR Explorer to export</Link>
      </Button>
    </div>
  );
}
