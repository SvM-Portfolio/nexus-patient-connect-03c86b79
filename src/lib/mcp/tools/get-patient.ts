import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fhirGet, textResult } from "../fhir";

export default defineTool({
  name: "get_patient",
  title: "Get patient",
  description: "Fetch the full FHIR Patient resource for a synthetic demo patient by id.",
  inputSchema: { id: z.string().regex(/^[A-Za-z0-9\-.]{1,64}$/).describe("FHIR Patient id.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ id }) => textResult(await fhirGet(`Patient/${id}`)),
});
