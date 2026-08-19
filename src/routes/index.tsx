import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ShieldAlert, ArrowRight, Database, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexus Pro — FHIR-Native Clinical Intelligence for Diabetes Care" },
      {
        name: "description",
        content:
          "Nexus Pro is a FHIR-native clinical intelligence demo for diabetes care, with role-based dashboards built on synthetic patient data.",
      },
      {
        property: "og:title",
        content: "Nexus Pro — FHIR-Native Clinical Intelligence for Diabetes Care",
      },
      {
        property: "og:description",
        content:
          "Explore a FHIR-native clinical workspace demo for diabetes care using synthetic patient data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 md:px-8">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent-info text-primary-foreground">
          <Activity className="h-5 w-5" />
        </span>
        Nexus Pro
      </div>

      <h1 className="mt-8 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
        FHIR-Native Clinical Intelligence for Diabetes Care
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
        Nexus Pro brings patient records, observations, labs, medications and care
        activity into one calm clinical workspace. Built directly on FHIR R4 resources,
        with role-based dashboards for physicians and front office teams.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link to="/dashboard/physician">
            Explore Demo <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href="#learn-more">Learn More</a>
        </Button>
      </div>

      <div
        className="mt-10 flex items-start gap-3 rounded-2xl border border-border bg-card/70 p-4 text-sm"
        role="note"
      >
        <ShieldAlert className="mt-0.5 h-5 w-5 text-[color:var(--accent-warning,orange)]" />
        <p>
          This demonstration uses synthetic patient data. No real patient information is
          used. Nexus Pro is a proof of concept and is not production-ready or approved
          for clinical use.
        </p>
      </div>

      <div id="learn-more" className="mt-16 grid gap-4 md:grid-cols-3">
        <GlassCard className="p-5">
          <Stethoscope className="h-6 w-6 text-primary" />
          <h2 className="mt-3 text-base font-semibold">Clinical workspace</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Physician and front office dashboards with schedules, alerts, lab reports,
            messages and quick clinical actions.
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <Database className="h-6 w-6 text-primary" />
          <h2 className="mt-3 text-base font-semibold">FHIR R4 native</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Patients, Observations, Conditions, DiagnosticReports and MedicationRequests
            read and written as standard FHIR resources.
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <Activity className="h-6 w-6 text-primary" />
          <h2 className="mt-3 text-base font-semibold">Diabetes focus</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            HbA1c trending, vitals, screening and SDOH assessments surfaced where they
            matter in the care conversation.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
