import { ToolError } from "@lovable.dev/mcp-js";

// Read-only FHIR GET helper. Env is read lazily at call time.
export async function fhirGet(path: string, params: Record<string, string | undefined> = {}) {
  const base = process.env.FHIR_BASE_URL;
  const token = process.env.FHIR_BEARER_TOKEN;
  if (!base || !token) throw new ToolError("FHIR server is not configured.");
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const url = `${base.replace(/\/$/, "")}/${path}${qs.size ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/fhir+json" },
  });
  if (res.status === 404) throw new ToolError("Not found.");
  if (!res.ok) throw new ToolError(`FHIR request failed (${res.status}).`);
  return (await res.json()) as {
    entry?: Array<{ resource: Record<string, unknown> }>;
    total?: number;
  } & Record<string, unknown>;
}

export function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
