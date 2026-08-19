import { createFileRoute } from "@tanstack/react-router";
import { FhirExplorer } from "@/components/FhirExplorer";

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
  component: FhirExplorer,
});
