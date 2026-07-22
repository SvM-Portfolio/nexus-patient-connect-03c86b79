export type Gender = "male" | "female" | "other" | "unknown";

export interface FhirHumanName {
  given?: string[];
  family?: string;
  use?: string;
  text?: string;
}

export interface FhirAddress {
  line?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  use?: string;
  text?: string;
}

export interface FhirContactPoint {
  system?: string;
  value?: string;
  use?: string;
}

export interface FhirPatient {
  resourceType: "Patient";
  id?: string;
  active?: boolean;
  name?: FhirHumanName[];
  gender?: Gender;
  birthDate?: string;
  address?: FhirAddress[];
  telecom?: FhirContactPoint[];
  meta?: { lastUpdated?: string; versionId?: string };
}

export interface FhirBundle<T = any> {
  resourceType: "Bundle";
  total?: number;
  entry?: Array<{ resource: T }>;
  link?: Array<{ relation: string; url: string }>;
}

const BASE = "/api/fhir";

async function handle(res: Response) {
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    if (data?.issue?.[0]?.diagnostics) msg = data.issue[0].diagnostics;
    else if (data?.error) msg = data.error;
    throw new Error(msg);
  }
  return data;
}

export interface PatientSearchParams {
  offset?: number;
  count?: number;
  sort?: string; // e.g. "given", "-given", "family"
  name?: string; // unified quick search
  given?: string;
  family?: string;
  gender?: Gender | "";
  birthdate?: string; // YYYY-MM-DD
}

export interface PatientSearchResult {
  patients: FhirPatient[];
  total: number;
  offset: number;
  count: number;
}

export async function searchPatients(
  p: PatientSearchParams = {},
): Promise<PatientSearchResult> {
  const count = p.count ?? 10;
  const offset = p.offset ?? 0;
  const params = new URLSearchParams();
  params.set("_count", String(count));
  params.set("_getpagesoffset", String(offset));
  params.set("_total", "accurate");
  if (p.sort) params.set("_sort", p.sort);
  if (p.name?.trim()) params.set("name", p.name.trim());
  if (p.given?.trim()) params.set("given", p.given.trim());
  if (p.family?.trim()) params.set("family", p.family.trim());
  if (p.gender) params.set("gender", p.gender);
  if (p.birthdate?.trim()) params.set("birthdate", `eq${p.birthdate.trim()}`);

  const res = await fetch(`${BASE}/Patient?${params.toString()}`, {
    headers: { Accept: "application/fhir+json" },
  });
  const bundle: FhirBundle<FhirPatient> = await handle(res);
  const patients = (bundle.entry ?? [])
    .map((e) => e.resource)
    .filter((r) => r?.resourceType === "Patient");
  return {
    patients,
    total: bundle.total ?? patients.length,
    offset,
    count,
  };
}

export async function getPatient(id: string): Promise<FhirPatient> {
  const res = await fetch(`${BASE}/Patient/${id}`, {
    headers: { Accept: "application/fhir+json" },
  });
  return handle(res);
}

export async function createPatient(p: FhirPatient) {
  const res = await fetch(`${BASE}/Patient`, {
    method: "POST",
    headers: {
      "Content-Type": "application/fhir+json",
      Accept: "application/fhir+json",
    },
    body: JSON.stringify(p),
  });
  return handle(res);
}

export async function updatePatient(p: FhirPatient) {
  if (!p.id) throw new Error("Patient id required for update");
  const res = await fetch(`${BASE}/Patient/${p.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/fhir+json",
      Accept: "application/fhir+json",
    },
    body: JSON.stringify(p),
  });
  return handle(res);
}

export async function deletePatient(id: string) {
  const res = await fetch(`${BASE}/Patient/${id}`, { method: "DELETE" });
  if (res.status === 204 || res.status === 200 || res.status === 202) return null;
  return handle(res);
}

export async function searchResources<T = any>(
  resourceType: string,
  params: Record<string, string>,
): Promise<T[]> {
  const qs = new URLSearchParams(params);
  qs.set("_count", qs.get("_count") ?? "50");
  const res = await fetch(`${BASE}/${resourceType}?${qs.toString()}`, {
    headers: { Accept: "application/fhir+json" },
  });
  const bundle: FhirBundle<T> = await handle(res);
  return (bundle.entry ?? []).map((e) => e.resource).filter(Boolean);
}

export async function createResource<T = any>(
  resourceType: string,
  body: any,
): Promise<T> {
  const res = await fetch(`${BASE}/${resourceType}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/fhir+json",
      Accept: "application/fhir+json",
    },
    body: JSON.stringify(body),
  });
  return handle(res);
}

export function sanitizeName(s?: string | null): string {
  if (!s) return "";
  return s.replace(/\d+/g, "").replace(/\s+/g, " ").trim();
}

export function sanitizeGiven(given?: string[]): string {
  return (given ?? []).map((g) => sanitizeName(g)).filter(Boolean).join(" ");
}

export function displayName(p: FhirPatient) {
  const n = p.name?.[0];
  const given = sanitizeGiven(n?.given);
  const family = sanitizeName(n?.family);
  return `${given} ${family}`.trim() || sanitizeName(n?.text) || "(no name)";
}

export function codingText(c: any): string {
  if (!c) return "";
  if (typeof c === "string") return c;
  return (
    c.text ||
    c.coding?.[0]?.display ||
    c.coding?.[0]?.code ||
    ""
  );
}

export function observationValue(o: any): string {
  if (!o) return "";
  if (o.valueQuantity)
    return `${o.valueQuantity.value ?? ""} ${o.valueQuantity.unit ?? ""}`.trim();
  if (o.valueCodeableConcept) return codingText(o.valueCodeableConcept);
  if (o.valueString) return o.valueString;
  if (typeof o.valueBoolean === "boolean") return String(o.valueBoolean);
  if (o.valueInteger != null) return String(o.valueInteger);
  if (o.component?.length) {
    return o.component
      .map(
        (c: any) =>
          `${codingText(c.code)}: ${observationValue({ valueQuantity: c.valueQuantity, valueCodeableConcept: c.valueCodeableConcept, valueString: c.valueString })}`,
      )
      .join(", ");
  }
  return "";
}
