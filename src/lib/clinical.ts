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
  hba1cAlt: "17856-6",
};

export const VITAL_CODE_SET = new Set<string>(Object.values(VITAL_CODES));

// Social history / SDOH / screening LOINC codes
export const SOCIAL_HISTORY_CODES = new Set<string>([
  "72166-2", // Tobacco smoking status
  "11367-0", // History of tobacco use
  "74008-4", // Substance use
]);

export const SCREENING_CODES = new Set<string>([
  "93025-5", // PRAPARE
  "55757-9", // PHQ-2 total
  "55758-7", // PHQ-2 scale
  "44250-9", // PHQ-2 q1
  "44255-8", // PHQ-2 q2
  "75626-2", // AUDIT-C total
  "68518-0", // AUDIT
  "82666-9", // DAST-10 total
]);

export const LAB_UNITS = new Set<string>([
  "mg/dL", "mmol/L", "g/dL", "IU/L", "U/L", "ng/mL", "pg/mL",
  "mIU/L", "µIU/mL", "uIU/mL", "cells/uL", "K/uL", "M/uL",
  "mEq/L", "ng/dL", "µg/dL", "ug/dL", "µmol/L", "10*3/uL", "10*6/uL",
]);

export function obsCategoryCodes(o: any): string[] {
  const out: string[] = [];
  for (const cat of o?.category ?? []) {
    for (const c of cat?.coding ?? []) if (c?.code) out.push(c.code);
  }
  return out;
}

export function obsAllCodes(o: any): string[] {
  return (o?.code?.coding ?? []).map((c: any) => c?.code).filter(Boolean);
}

export type ObsSection = "vitals" | "lab" | "social" | "screening" | "other";

export function classifyObservation(o: any): ObsSection {
  const cats = obsCategoryCodes(o);
  const codes = obsAllCodes(o);
  if (cats.includes("vital-signs") || codes.some((c) => VITAL_CODE_SET.has(c))) return "vitals";
  if (cats.includes("social-history") || codes.some((c) => SOCIAL_HISTORY_CODES.has(c))) return "social";
  if (cats.includes("survey") || codes.some((c) => SCREENING_CODES.has(c))) return "screening";
  if (cats.includes("laboratory")) return "lab";
  const unit = o?.valueQuantity?.unit;
  if (unit && LAB_UNITS.has(unit)) return "lab";
  return "other";
}

const CODE_SYSTEM_LABELS: Record<string, string> = {
  "http://hl7.org/fhir/sid/icd-10": "ICD-10",
  "http://hl7.org/fhir/sid/icd-10-cm": "ICD-10",
  "http://hl7.org/fhir/sid/icd-9-cm": "ICD-9",
  "http://snomed.info/sct": "SNOMED CT",
  "http://loinc.org": "LOINC",
  "http://www.ama-assn.org/go/cpt": "CPT",
  "http://www.nlm.nih.gov/research/umls/rxnorm": "RxNorm",
};

export function codeSystemLabel(system?: string): string {
  if (!system) return "Code";
  if (CODE_SYSTEM_LABELS[system]) return CODE_SYSTEM_LABELS[system];
  const seg = system.split("/").filter(Boolean).pop();
  return seg || system;
}

export function screeningRisk(
  code: string | undefined,
  score: number,
): { label: string; className: string } {
  const green = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";
  const amber = "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
  const red = "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
  if (code === "55757-9" || code === "55758-7") {
    if (score < 3) return { label: "Low Risk", className: green };
    return { label: "Elevated", className: amber };
  }
  if (code === "75626-2" || code === "68518-0") {
    if (score < 3) return { label: "Low Risk", className: green };
    if (score < 5) return { label: "Moderate", className: amber };
    return { label: "High Risk", className: red };
  }
  if (code === "82666-9") {
    if (score < 3) return { label: "Low", className: green };
    if (score < 6) return { label: "Moderate", className: amber };
    return { label: "High", className: red };
  }
  return { label: "Score", className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200" };
}

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
