import { createFileRoute } from "@tanstack/react-router";
import { FhirExplorer } from "@/components/FhirExplorer";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPageHeader } from "@/components/AdminPageHeader";

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
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8">
        <AdminPageHeader
          title="FHIR Patient Explorer"
          description="Inspect mock patient bundles, count resource types, and export data as JSON, CSV, or XML."
          tag="System Tool"
        />
        <div className="mt-6">
          <FhirExplorer />
        </div>
      </div>
    </AdminGuard>
  ),
});
