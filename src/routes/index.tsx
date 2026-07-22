import { createFileRoute, redirect } from "@tanstack/react-router";
import { getActiveRolePath } from "@/hooks/useActiveRole";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexus Pro — Clinical Command Center" },
      {
        name: "description",
        content:
          "Nexus Pro: EHR dashboards for physicians, FHIR R4 compliant.",
      },
      { property: "og:title", content: "Nexus Pro — Clinical Command Center" },
      {
        property: "og:description",
        content: "Nexus Pro: EHR dashboards for physicians, FHIR R4 compliant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    // Only runs client-side thanks to typeof window check in getActiveRolePath
    const path = getActiveRolePath();
    throw redirect({ to: path });
  },
  component: () => null,
});
