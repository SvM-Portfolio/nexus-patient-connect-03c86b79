import { createFileRoute } from "@tanstack/react-router";
import { FhirExplorer } from "@/components/FhirExplorer";
import { AdminGuard } from "@/components/AdminGuard";

export const Route = createFileRoute("/admin/fhir-explorer")({
  head: () => ({
    meta: [
      { title: "FHIR Explorer — Nexus Pro Admin" },
      {
        name: "description",
        content:
          "Admin System Tools: inspect FHIR patient bundles, resource types and export JSON, CSV or XML.",
      },
      { property: "og:title", content: "FHIR Explorer — Nexus Pro Admin" },
      {
        property: "og:description",
        content: "Inspect and export FHIR patient bundles from the admin area.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AdminGuard>
      <FhirExplorer />
    </AdminGuard>
  ),
});
