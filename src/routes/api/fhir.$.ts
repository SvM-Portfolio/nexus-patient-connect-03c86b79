import { createFileRoute } from "@tanstack/react-router";

// Clinical resource types that may be read through the proxy.
const READ_TYPES = new Set([
  "Patient", "Practitioner", "PractitionerRole", "Organization", "Location",
  "Observation", "Condition", "Encounter", "MedicationRequest", "MedicationStatement",
  "Medication", "DiagnosticReport", "AllergyIntolerance", "Immunization", "Procedure",
  "ServiceRequest", "DocumentReference", "Coverage", "FamilyMemberHistory", "CarePlan",
  "CareTeam", "Goal", "Appointment", "Schedule", "Slot", "Claim",
  "ExplanationOfBenefit", "QuestionnaireResponse", "AuditEvent", "Provenance", "Device",
  "ImagingStudy", "Specimen", "RelatedPerson",
]);

// Resource types the app creates (top-level POST only).
const CREATE_TYPES = new Set([
  "Patient", "Organization", "Coverage", "Condition", "MedicationStatement",
  "AllergyIntolerance", "FamilyMemberHistory", "Observation", "AuditEvent",
  "MedicationRequest", "ServiceRequest", "DocumentReference",
]);

const ID_RE = /^[A-Za-z0-9\-.]{1,64}$/;
const OPS = new Set(["$everything", "_history"]);

function json(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isAllowedRead(segs: string[]) {
  if (segs.length === 1 && segs[0] === "metadata") return true;
  if (segs.length < 1 || segs.length > 4 || !READ_TYPES.has(segs[0])) return false;
  // Type | Type/id | Type/id/$everything | Type/id/_history[/vid]
  if (segs.length >= 2 && (!ID_RE.test(segs[1]) || segs[1].includes(".."))) return false;
  if (segs.length >= 3 && !OPS.has(segs[2])) return false;
  if (segs.length === 4 && (segs[2] !== "_history" || !ID_RE.test(segs[3]))) return false;
  return true;
}

async function proxy({ request, params }: { request: Request; params: { _splat?: string } }) {
  const base = process.env.FHIR_BASE_URL;
  const token = process.env.FHIR_BEARER_TOKEN;
  if (!base || !token) return json(500, "FHIR service not configured");

  const method = request.method.toUpperCase();
  const path = params._splat ?? "";
  const segs = path.split("/").filter(Boolean);
  const incomingUrl = new URL(request.url);

  if (method === "GET") {
    if (!isAllowedRead(segs)) return json(403, "Resource path not allowed");
  } else if (method === "POST") {
    if (segs.length !== 1 || !CREATE_TYPES.has(segs[0]) || incomingUrl.search) {
      return json(403, "Resource creation not allowed");
    }
  } else {
    return json(405, "Method not allowed");
  }

  const target = `${base.replace(/\/$/, "")}/${segs.map(encodeURIComponent).join("/")}${incomingUrl.search}`;

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/fhir+json");

  let body: ArrayBuffer | undefined;
  if (method === "POST") {
    headers.set("Content-Type", "application/fhir+json");
    body = await request.arrayBuffer();
    if (body.byteLength > 1_000_000) return json(413, "Payload too large");
    try {
      const parsed = JSON.parse(new TextDecoder().decode(body));
      if (parsed?.resourceType !== segs[0]) return json(400, "resourceType mismatch");
    } catch {
      return json(400, "Invalid JSON");
    }
  }

  const upstream = await fetch(target, { method, headers, body });

  const respHeaders = new Headers();
  const ct = upstream.headers.get("content-type");
  if (ct) respHeaders.set("Content-Type", ct);

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: respHeaders,
  });
}

export const Route = createFileRoute("/api/fhir/$")({
  server: {
    handlers: {
      GET: proxy,
      POST: proxy,
    },
  },
});
