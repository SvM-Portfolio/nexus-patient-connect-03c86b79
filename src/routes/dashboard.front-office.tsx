import { createFileRoute } from "@tanstack/react-router";
import { PatientFlow } from "@/components/dashboard/front-office/PatientFlow";
import { CheckInQueue } from "@/components/dashboard/front-office/CheckInQueue";
import { RegistrationQuickAdd } from "@/components/dashboard/front-office/RegistrationQuickAdd";
import { AppointmentConfirmations } from "@/components/dashboard/front-office/AppointmentConfirmations";
import { InsuranceVerification } from "@/components/dashboard/front-office/InsuranceVerification";
import { WaitingRoom } from "@/components/dashboard/front-office/WaitingRoom";
import { FrontOfficeMessages } from "@/components/dashboard/front-office/FrontOfficeMessages";
import { DailyOps } from "@/components/dashboard/front-office/DailyOps";

export const Route = createFileRoute("/dashboard/front-office")({
  head: () => ({
    meta: [
      { title: "Front Office Dashboard — Nexus Pro" },
      {
        name: "description",
        content:
          "Front office workspace: patient check-in, appointments, insurance verification, and waiting room.",
      },
      { property: "og:title", content: "Front Office Dashboard — Nexus Pro" },
      {
        property: "og:description",
        content: "Operational workspace for receptionists and schedulers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FrontOfficeDashboard,
});

function FrontOfficeDashboard() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Front Office</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Patient flow & operations for {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}.
        </p>
      </div>

      <PatientFlow />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CheckInQueue />
        <WaitingRoom />
        <AppointmentConfirmations />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RegistrationQuickAdd />
        <InsuranceVerification />
        <FrontOfficeMessages />
      </div>

      <div className="mt-4">
        <DailyOps />
      </div>
    </div>
  );
}
