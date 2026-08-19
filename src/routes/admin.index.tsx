import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Database,
  Download,
  ScrollText,
  Plug,
  Wrench,
  ArrowRight,
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { AdminGuard } from "@/components/AdminGuard";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin System Tools — Nexus Pro" },
      {
        name: "description",
        content:
          "Nexus Pro admin area: FHIR Explorer, data export, audit logs, integrations and developer tools.",
      },
      { property: "og:title", content: "Admin System Tools — Nexus Pro" },
      {
        property: "og:description",
        content: "Technical tooling for the Nexus Pro demo environment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AdminGuard>
      <AdminHome />
    </AdminGuard>
  ),
});

const TOOLS = [
  {
    to: "/admin/fhir-explorer" as const,
    icon: Database,
    title: "FHIR Explorer",
    desc: "Browse patients, inspect FHIR bundles and export JSON, CSV or XML.",
    tag: null,
  },
  {
    to: "/admin/data-export" as const,
    icon: Download,
    title: "Data Export",
    desc: "Export synthetic bundles for analysis and testing.",
    tag: "PoC",
  },
  {
    to: "/admin/audit-logs" as const,
    icon: ScrollText,
    title: "Audit Logs",
    desc: "Activity trail of actions recorded in this demo environment.",
    tag: "Demo",
  },
  {
    to: "/admin/integrations" as const,
    icon: Plug,
    title: "Integrations",
    desc: "Connection targets and endpoint configuration overview.",
    tag: "PoC",
  },
  {
    to: "/admin/developer" as const,
    icon: Wrench,
    title: "Developer Tools",
    desc: "FHIR inspection, validation, integration debugging and system logs.",
    tag: "PoC",
  },
];

function AdminHome() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        System Tools — technical utilities for the Nexus Pro demo environment.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TOOLS.map((t) => (
          <Link key={t.to} to={t.to} className="group">
            <GlassCard className="h-full p-5 transition-shadow group-hover:shadow-lg">
              <div className="flex items-start justify-between gap-2">
                <t.icon className="h-6 w-6 text-primary" />
                {t.tag && <Badge variant="secondary">{t.tag}</Badge>}
              </div>
              <h2 className="mt-3 flex items-center gap-1.5 text-base font-semibold">
                {t.title}
                <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{t.desc}</p>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
