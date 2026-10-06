import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fhirGet, textResult } from "../fhir";

export default defineTool({
  name: "search_patients",
  title: "Search patients",
  description: "Search synthetic demo patients by name, returning id, name, gender and birth date.",
  inputSchema: {
    name: z.string().trim().max(100).optional().describe("Given, family or full name."),
    count: z.number().int().min(1).max(50).optional().describe("Max results (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ name, count }) => {
    const b = await fhirGet("Patient", { name, _count: String(count ?? 20) });
    const patients = (b.entry ?? []).map(({ resource: r }: { resource: any }) => ({
      id: r.id,
      name: r.name?.[0]
        ? [...(r.name[0].given ?? []), r.name[0].family].filter(Boolean).join(" ")
        : null,
      gender: r.gender ?? null,
      birthDate: r.birthDate ?? null,
    }));
    return textResult({ total: b.total ?? patients.length, patients });
  },
});
