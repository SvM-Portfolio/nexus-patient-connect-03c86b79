import { codingText, observationValue } from "./fhir";

export type DomainKey =
  | "info"
  | "summary"
  | "observations"
  | "encounters"
  | "diagnoses"
  | "conditions"
  | "medications"
  | "allergies"
  | "procedures"
  | "billing"
  | "history"
  | "notes";

export const domainVar = (d: DomainKey) => `var(--accent-${d})`;

export function computeAge(birthDate?: string): string {
  if (!birthDate) return "—";
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return "—";
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return `${age}y`;
}

// LOINC codes for vitals
export const VITAL_CODES = {
  bp: "85354-9",
  systolic: "8480-6",
  diastolic: "8462-4",
  hr: "8867-4",
  temp: "8310-5",
  rr: "9279-1",
  spo2: "2708-6",
  spo2Alt: "59408-5",
  height: "8302-2",
  weight: "29463-7",
  bmi: "39156-5",
  hba1c: "4548-4",
};

export function obsCode(o: any): string | undefined {
  return o?.code?.coding?.[0]?.code;
}

export function obsNumeric(o: any): number | null {
  const v = o?.valueQuantity?.value;
  return typeof v === "number" ? v : null;
}

export function obsDate(o: any): string | undefined {
  return o?.effectiveDateTime || o?.issued || o?.effectivePeriod?.start;
}

export function bpComponents(o: any): { sys?: number; dia?: number } {
  const out: { sys?: number; dia?: number } = {};
  for (const c of o?.component ?? []) {
    const code = c?.code?.coding?.[0]?.code;
    const v = c?.valueQuantity?.value;
    if (typeof v !== "number") continue;
    if (code === VITAL_CODES.systolic) out.sys = v;
    if (code === VITAL_CODES.diastolic) out.dia = v;
  }
  return out;
}

export function filterByCode(list: any[] | undefined, ...codes: string[]) {
  const set = new Set(codes);
  return (list ?? [])
    .filter((o) => {
      const codings = o?.code?.coding ?? [];
      return codings.some((c: any) => set.has(c.code));
    })
    .sort((a, b) => (obsDate(b) ?? "").localeCompare(obsDate(a) ?? ""));
}

export function computeBmi(heightCm?: number | null, weightKg?: number | null) {
  if (!heightCm || !weightKg) return null;
  const m = heightCm / 100;
  return +(weightKg / (m * m)).toFixed(1);
}

export function allergyCriticalityClass(criticality?: string): string {
  const c = (criticality || "").toLowerCase();
  if (c === "high")
    return "border-l-4 border-l-[color:var(--accent-allergies)] bg-[color:var(--accent-allergies)]/10";
  if (c === "low")
    return "border-l-4 border-l-amber-500 bg-amber-500/5";
  return "border-l-4 border-l-muted-foreground/30";
}

export function allergyBadge(a: any): { label: string; className: string } | null {
  const crit = (a?.criticality || "").toLowerCase();
  if (crit === "high")
    return {
      label: "Life-threatening",
      className:
        "bg-[color:var(--accent-allergies)] text-foreground",
    };
  if (crit === "low") return { label: "Low", className: "bg-amber-500/20 text-amber-900 dark:text-amber-200" };
  return null;
}

export function formatObs(o: any): string {
  const v = observationValue(o);
  return v || codingText(o?.code);
}
