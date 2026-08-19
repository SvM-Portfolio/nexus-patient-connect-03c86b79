import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Database, CheckCircle2, Bug, Terminal, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPageHeader } from "@/components/AdminPageHeader";

export const Route = createFileRoute("/admin/developer")({
  head: () => ({
    meta: [
      { title: "Developer Tools — Nexus Pro Admin" },
      {
        name: "description",
        content:
          "Developer mode: FHIR inspection, FHIR validation, integration debugging and system logs for the Nexus Pro demo.",
      },
      { property: "og:title", content: "Developer Tools — Nexus Pro Admin" },
      {
        property: "og:description",
        content: "FHIR inspection, validation and debugging tools (PoC).",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AdminGuard>
      <DeveloperPage />
    </AdminGuard>
  ),
});

type Issue = { level: "error" | "warning" | "ok"; message: string };

function validateFhir(text: string): Issue[] {
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return [{ level: "error", message: `Invalid JSON: ${(e as Error).message}` }];
  }
  const issues: Issue[] = [];
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return [{ level: "error", message: "Root must be a FHIR resource object." }];
  }
  if (!parsed.resourceType) {
    issues.push({ level: "error", message: "Missing required field: resourceType." });
  }
  if (parsed.resourceType === "Bundle") {
    if (!Array.isArray(parsed.entry)) {
      issues.push({ level: "warning", message: "Bundle has no entry array." });
    } else {
      parsed.entry.forEach((e: any, i: number) => {
        if (!e?.resource?.resourceType) {
          issues.push({
            level: "error",
            message: `entry[${i}] is missing resource.resourceType.`,
          });
        }
      });
      issues.push({
        level: "ok",
        message: `Bundle contains ${parsed.entry.length} entries.`,
      });
    }
  } else if (parsed.resourceType && !parsed.id) {
    issues.push({ level: "warning", message: "Resource has no id." });
  }
  if (!issues.some((i) => i.level === "error")) {
    issues.unshift({ level: "ok", message: "Structural checks passed (PoC subset)." });
  }
  return issues;
}

function DeveloperPage() {
  const [input, setInput] = useState(
    '{\n  "resourceType": "Patient",\n  "id": "example",\n  "gender": "female"\n}',
  );
  const [issues, setIssues] = useState<Issue[] | null>(null);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8">
      <AdminPageHeader
        title="Developer Tools"
        tag="PoC"
        description="Developer mode for the Nexus Pro demo. No production API keys, authentication, or infrastructure are configured here."
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-5">
          <div className="flex items-start justify-between">
            <Database className="h-5 w-5 text-primary" />
            <Badge variant="secondary">Live</Badge>
          </div>
          <h2 className="mt-3 text-base font-semibold">FHIR inspection</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Browse patient bundles, resource types and counts, and export in JSON, CSV
            or XML.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/admin/fhir-explorer">Open FHIR Explorer</Link>
          </Button>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-start justify-between">
            <Bug className="h-5 w-5 text-primary" />
            <Badge variant="secondary">PoC</Badge>
          </div>
          <h2 className="mt-3 text-base font-semibold">Integration debugging</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Requests are proxied through <code>/api/fhir/*</code>. Request/response
            tracing is not implemented yet — inspect the browser network panel for now.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/admin/integrations">View integrations</Link>
          </Button>
        </GlassCard>

        <GlassCard className="p-5 lg:col-span-2">
          <div className="flex items-start justify-between">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <Badge variant="secondary">PoC</Badge>
          </div>
          <h2 className="mt-3 text-base font-semibold">FHIR validation</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Structural checks only — not a conformance-complete FHIR validator.
          </p>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={10}
            spellCheck={false}
            aria-label="FHIR resource JSON to validate"
            className="mt-3 font-mono text-xs"
          />
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => setIssues(validateFhir(input))}>
              Validate
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIssues(null)}>
              Clear
            </Button>
          </div>
          {issues && (
            <ul className="mt-4 space-y-2 text-sm">
              {issues.map((i, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  {i.level === "ok" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
                  )}
                  <span
                    className={
                      i.level === "error" ? "text-destructive" : "text-muted-foreground"
                    }
                  >
                    {i.message}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="p-5 lg:col-span-2">
          <div className="flex items-start justify-between">
            <Terminal className="h-5 w-5 text-primary" />
            <Badge variant="secondary">Demo</Badge>
          </div>
          <h2 className="mt-3 text-base font-semibold">System logs</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Server-side log streaming is not wired up in this proof of concept. The
            in-app activity trail is available under Audit Logs.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/admin/audit-logs">Open audit logs</Link>
          </Button>
        </GlassCard>
      </div>
    </div>
  );
}
