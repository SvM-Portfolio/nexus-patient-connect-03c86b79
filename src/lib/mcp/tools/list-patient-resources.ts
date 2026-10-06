import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fhirGet, textResult } from "../fhir";

const TYPES = [
  "Observation",
  "Condition",
  "Encounter",
  "MedicationRequest",
  "DiagnosticReport",
  "AllergyIntolerance",
  "Immunization",
  "Procedure",
] as const;

export default defineTool({
  name: "list_patient_resources",
  title: "List patient clinical records",
  description: "List a patient's clinical records of one type (e.g. Observation, Condition, MedicationRequest).",
  inputSchema: {
    patientId: z.string().regex(/^[A-Za-z0-9\-.]{1,64}$/).describe("FHIR Patient id."),
    resourceType: z.enum(TYPES).describe("Clinical resource type."),
    count: z.number().int().min(1).max(100).optional().describe("Max results (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ patientId, resourceType, count }) => {
    const b = await fhirGet(resourceType, {
      patient: patientId,
      _count: String(count ?? 25),
      _sort: "-_lastUpdated",
    });
    return textResult({
      total: b.total ?? b.entry?.length ?? 0,
      resources: (b.entry ?? []).map((e) => e.resource),
    });
  },
});
