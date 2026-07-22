import { createFileRoute } from "@tanstack/react-router";
import { TodaysSummary } from "@/components/dashboard/physician/TodaysSummary";
import { MessagesPanel } from "@/components/dashboard/physician/MessagesPanel";
import { LaboratoryOrders } from "@/components/dashboard/physician/LaboratoryOrders";
import { TodaysSchedule } from "@/components/dashboard/physician/TodaysSchedule";
import { RecentPatients } from "@/components/dashboard/physician/RecentPatients";
import { ClinicalAlerts } from "@/components/dashboard/physician/ClinicalAlerts";
import { QuickActionsPanel } from "@/components/dashboard/physician/QuickActionsPanel";
import { PendingTasks } from "@/components/dashboard/physician/PendingTasks";
import { Announcements } from "@/components/dashboard/physician/Announcements";
import { ActivityPanel } from "@/components/dashboard/physician/ActivityPanel";

export const Route = createFileRoute("/dashboard/physician")({
  head: () => ({
    meta: [
      { title: "Physician Dashboard — Nexus Pro" },
      {
        name: "description",
        content:
          "Physician command center: today's schedule, messages, laboratory orders, and clinical alerts.",
      },
      { property: "og:title", content: "Physician Dashboard — Nexus Pro" },
      {
        property: "og:description",
        content: "Clinical command center for providers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PhysicianDashboard,
});

function PhysicianDashboard() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Good {timeOfDay()}, Doctor
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's your clinical command center for {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}.
          </p>
        </div>
      </div>

      <TodaysSummary />

      <div className="mt-6">
        <QuickActionsPanel />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MessagesPanel />
        <LaboratoryOrders />
        <ClinicalAlerts />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TodaysSchedule />
        <RecentPatients />
        <div className="flex flex-col gap-4">
          <PendingTasks />
          <Announcements />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityPanel />
        </div>
        <div className="flex flex-col gap-4" />
      </div>
    </div>
  );
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
