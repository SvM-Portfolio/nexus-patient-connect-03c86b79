// Universal activity log — mirrors to localStorage and best-effort writes a FHIR AuditEvent.
import { createResource } from "./fhir";

export type ActivityType =
  | "lab-order"
  | "medication-order"
  | "clinical-note"
  | "patient-create"
  | "patient-update"
  | "patient-view"
  | "other";

export interface ActivityEntry {
  id: string;
  ts: string; // ISO
  type: ActivityType;
  action: string; // human-readable verb, e.g. "Ordered lab test"
  description: string; // human-readable object, e.g. "CBC for Jane Doe"
  patientId?: string;
  patientName?: string;
  actor?: string;
}

const KEY = "nexus-pro:activity:v1";
const MAX = 200;
const listeners = new Set<() => void>();

function read(): ActivityEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(list: ActivityEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  listeners.forEach((l) => l());
}

export function getActivity(): ActivityEntry[] {
  return read();
}

export function subscribeActivity(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function logActivity(
  entry: Omit<ActivityEntry, "id" | "ts"> & { ts?: string },
): Promise<ActivityEntry> {
  const full: ActivityEntry = {
    id: crypto.randomUUID(),
    ts: entry.ts ?? new Date().toISOString(),
    ...entry,
  };
  const list = [full, ...read()];
  write(list);

  // Best-effort FHIR AuditEvent — never blocks or throws.
  void writeAuditEvent(full).catch(() => {});
  return full;
}

async function writeAuditEvent(e: ActivityEntry) {
  const audit: any = {
    resourceType: "AuditEvent",
    recorded: e.ts,
    action: e.type === "patient-view" ? "R" : "C",
    outcome: "0",
    type: {
      system: "http://terminology.hl7.org/CodeSystem/audit-event-type",
      code: "rest",
      display: e.action,
    },
    agent: [
      {
        who: { display: e.actor || "Clinician" },
        requestor: true,
      },
    ],
    source: { observer: { display: "Nexus Pro" } },
    entity: e.patientId
      ? [
          {
            what: { reference: `Patient/${e.patientId}`, display: e.patientName },
            description: e.description,
          },
        ]
      : [{ description: e.description }],
  };
  await createResource("AuditEvent", audit);
}
