import { createFileRoute } from "@tanstack/react-router";
import { Plug, ShieldAlert } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPageHeader } from "@/components/AdminPageHeader";

export const Route = createFileRoute("/admin/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — Nexus Pro Admin" },
      {
        name: "description",
        content:
          "Integration endpoints and connection status for the Nexus Pro demo environment.",
      },
      { property: "og:title", content: "Integrations — Nexus Pro Admin" },
      {
        property: "og:description",
        content: "Endpoint configuration overview for the Nexus Pro demo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AdminGuard>
      <IntegrationsPage />
    </AdminGuard>
  ),
});

const CONNECTIONS = [
  {
    name: "FHIR R4 sandbox",
    detail: "Proxied through /api/fhir/* — synthetic data only.",
    status: "Connected",
  },
  { name: "EHR interface engine", detail: "Not configured.", status: "PoC" },
  { name: "Lab result feed (HL7v2)", detail: "Not configured.", status: "PoC" },
  { name: "e-Prescribing gateway", detail: "Not configured.", status: "PoC" },
];

function IntegrationsPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8">
      <AdminPageHeader
        title="Integrations"
        tag="PoC"
        description="Connection overview only. No production credentials, real EHR systems, or live patient sources are configured."
      />

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-card/70 p-4 text-sm">
        <ShieldAlert className="mt-0.5 h-5 w-5 text-primary" />
        <p>
          This environment connects only to a synthetic FHIR sandbox. Do not point it at
          production patient systems.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {CONNECTIONS.map((c) => (
          <GlassCard key={c.name} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <Plug className="h-5 w-5 text-primary" />
              <Badge variant="secondary">{c.status}</Badge>
            </div>
            <h2 className="mt-3 text-base font-semibold">{c.name}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{c.detail}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
