import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { AdminGuard } from "@/components/AdminGuard";
import { getActivity, subscribeActivity, type ActivityEntry } from "@/lib/activity";
import { AdminPageHeader } from "@/components/AdminPageHeader";

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Logs — Nexus Pro Admin" },
      {
        name: "description",
        content:
          "Demo audit trail of clinical and administrative actions recorded in Nexus Pro.",
      },
      { property: "og:title", content: "Audit Logs — Nexus Pro Admin" },
      {
        property: "og:description",
        content: "Activity trail for the Nexus Pro demo environment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AdminGuard>
      <AuditLogsPage />
    </AdminGuard>
  ),
});

function AuditLogsPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    const sync = () => setEntries(getActivity());
    sync();
    return subscribeActivity(sync);
  }, []);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8">
      <AdminPageHeader
        title="Audit Logs"
        tag="Demo"
        description="Locally recorded activity trail. A production deployment would read immutable server-side FHIR AuditEvent records."
      />
      <GlassCard className="mt-6 p-0">
        {entries.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            No activity recorded yet in this session.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {entries.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <Badge variant="secondary">{e.type}</Badge>
                <span className="text-sm font-medium">{e.action}</span>
                <span className="text-sm text-muted-foreground">{e.description}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(e.ts).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
