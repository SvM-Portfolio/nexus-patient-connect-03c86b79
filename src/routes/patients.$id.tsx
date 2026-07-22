import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PatientDetail } from "@/components/PatientDetail";
import { getPatient, displayName } from "@/lib/fhir";
import { addRecentPatient } from "@/lib/recent-patients";

export const Route = createFileRoute("/patients/$id")({
  head: () => ({
    meta: [
      { title: "Patient Details — Nexus Pro" },
      { name: "description", content: "View and manage a FHIR R4 patient record." },
      { property: "og:title", content: "Patient Details — Nexus Pro" },
      { property: "og:description", content: "View and manage a FHIR R4 patient record." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PatientDetailPage,
});

function PatientDetailPage() {
  const { id } = Route.useParams();
  const { data: patient } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => getPatient(id),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (patient?.id) {
      addRecentPatient({
        id: patient.id,
        name: displayName(patient),
        gender: patient.gender,
        birthDate: patient.birthDate,
      });
    }
  }, [patient]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="h-8 text-muted-foreground">
          <Link to="/patients">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to patients
          </Link>
        </Button>
      </div>
      <PatientDetail patientId={id} />
    </div>
  );
}
