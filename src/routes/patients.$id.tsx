import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { PatientDetail } from "@/components/PatientDetail";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/patients/$id")({
  head: () => ({
    meta: [
      { title: "Patient Details — Nexus Pro" },
      { name: "description", content: "View and manage a FHIR R4 patient record." },
      { property: "og:title", content: "Patient Details — Nexus Pro" },
      {
        property: "og:description",
        content: "View and manage a FHIR R4 patient record.",
      },
    ],
  }),
  component: PatientDetailPage,
});

function PatientDetailPage() {
  const { id } = Route.useParams();
  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Nexus Pro</h1>
              <p className="text-xs text-muted-foreground">Patient details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to patients
              </Link>
            </Button>
          </div>

        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <PatientDetail patientId={id} />
      </main>
    </div>
  );
}
