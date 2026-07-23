import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { DomainCard } from "@/components/DomainCard";
import { ShowMore } from "@/components/ShowMore";
import { VitalsCards } from "@/components/VitalsCards";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  classifyObservation,
  obsAllCodes,
  obsDate,
  obsNumeric,
  screeningRisk,
} from "@/lib/clinical";
import { codingText, observationValue } from "@/lib/fhir";

function formatDate(s?: string) {
  return s ? new Date(s).toLocaleDateString() : "—";
}

function trendDelta(curr: number | null, prev: number | null) {
  if (curr == null || prev == null) return null;
  const d = curr - prev;
  const sign = d > 0 ? "+" : "";
  const cls =
    d > 0
      ? "text-orange-600 dark:text-orange-400"
      : d < 0
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-muted-foreground";
  return { text: `${sign}${d.toFixed(2)}`, cls };
}

function LabResultsTable({ labs }: { labs: any[] }) {
  // Group by code text (fall back to first LOINC code)
  const groups = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const o of labs) {
      const key =
        codingText(o.code) ||
        obsAllCodes(o)[0] ||
        o.id ||
        "Unknown";
      const arr = map.get(key) ?? [];
      arr.push(o);
      map.set(key, arr);
    }
    // sort each group's entries desc by date
    for (const arr of map.values()) {
      arr.sort((a, b) => (obsDate(b) ?? "").localeCompare(obsDate(a) ?? ""));
    }
    return [...map.entries()].sort((a, b) =>
      (obsDate(b[1][0]) ?? "").localeCompare(obsDate(a[1][0]) ?? ""),
    );
  }, [labs]);

  if (!labs.length)
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No laboratory results recorded.
      </p>
    );

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lab Test</TableHead>
            <TableHead>Current</TableHead>
            <TableHead>Previous (Trend)</TableHead>
            <TableHead>Reference Range</TableHead>
            <TableHead>Date</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map(([name, arr]) => (
            <LabRow key={name} name={name} entries={arr} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LabRow({ name, entries }: { name: string; entries: any[] }) {
  const [open, setOpen] = useState(false);
  const latest = entries[0];
  const previous = entries[1];
  const currVal = obsNumeric(latest);
  const prevVal = obsNumeric(previous);
  const delta = trendDelta(currVal, prevVal);
  const unit = latest?.valueQuantity?.unit ?? "";
  const range =
    latest?.referenceRange?.[0]?.text ||
    (latest?.referenceRange?.[0]?.low?.value != null ||
    latest?.referenceRange?.[0]?.high?.value != null
      ? `${latest.referenceRange[0].low?.value ?? ""}–${
          latest.referenceRange[0].high?.value ?? ""
        } ${latest.referenceRange[0].high?.unit ?? unit}`
      : "—");
  const history = entries.slice(1);
  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{name}</TableCell>
        <TableCell>{observationValue(latest) || "—"}</TableCell>
        <TableCell>
          {previous ? (
            <span className="text-sm">
              {observationValue(previous) || "—"}
              {delta && (
                <span className={`ml-2 text-xs ${delta.cls}`}>{delta.text}</span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="text-muted-foreground">{range}</TableCell>
        <TableCell className="whitespace-nowrap">
          {formatDate(obsDate(latest))}
        </TableCell>
        <TableCell>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
              aria-expanded={open}
              aria-label={`Toggle history for ${name}`}
            >
              {open ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              {history.length} prior
            </button>
          )}
        </TableCell>
      </TableRow>
      {open &&
        history.map((h) => (
          <TableRow key={h.id} className="bg-muted/30">
            <TableCell className="pl-8 text-xs text-muted-foreground">↳ history</TableCell>
            <TableCell className="text-sm">{observationValue(h) || "—"}</TableCell>
            <TableCell />
            <TableCell />
            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
              {formatDate(obsDate(h))}
            </TableCell>
            <TableCell />
          </TableRow>
        ))}
    </>
  );
}

function SocialHistoryList({ items }: { items: any[] }) {
  if (!items.length)
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No social history recorded.
      </p>
    );
  return (
    <ShowMore
      items={items}
      render={(o: any) => (
        <div key={o.id} className="rounded-md border p-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium">{codingText(o.code) || "Observation"}</span>
            <span className="text-xs text-muted-foreground">
              {formatDate(obsDate(o))}
            </span>
          </div>
          <p className="mt-1 text-muted-foreground">
            {observationValue(o) || codingText(o.valueCodeableConcept) || "—"}
          </p>
        </div>
      )}
    />
  );
}

function ScreeningCard({ obs }: { obs: any }) {
  const [open, setOpen] = useState(false);
  const code = obsAllCodes(obs)[0];
  const name = codingText(obs.code) || "Screening";
  const numericScore =
    obsNumeric(obs) ??
    (typeof obs?.valueInteger === "number" ? obs.valueInteger : null);
  const isPrapare = code === "93025-5" || /prapare/i.test(name);
  const components: any[] = obs?.component ?? [];

  return (
    <div className="rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{formatDate(obsDate(obs))}</p>
        </div>
        <div className="flex items-center gap-2">
          {numericScore != null && (
            <>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                Score {numericScore}
              </span>
              {(() => {
                const r = screeningRisk(code, numericScore);
                return (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.className}`}
                  >
                    {r.label}
                  </span>
                );
              })()}
            </>
          )}
        </div>
      </div>

      {(isPrapare || components.length > 0) && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            aria-expanded={open}
          >
            {open ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            {open ? "Hide responses" : `View responses (${components.length || "details"})`}
          </button>
          {open && (
            <dl className="mt-2 grid gap-1.5 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-2">
              {components.length > 0 ? (
                components.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <dt className="min-w-0 flex-1 truncate text-muted-foreground">
                      {codingText(c.code) || "Item"}
                    </dt>
                    <dd className="min-w-0 flex-1 truncate font-medium">
                      {observationValue(c) ||
                        codingText(c.valueCodeableConcept) ||
                        c.valueString ||
                        "—"}
                    </dd>
                  </div>
                ))
              ) : obs?.valueString ? (
                <div className="sm:col-span-2 whitespace-pre-wrap text-sm">
                  {obs.valueString}
                </div>
              ) : (
                <div className="text-muted-foreground">No detail components.</div>
              )}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}

export function ObservationsSections({
  vitals,
  vitalsLoading,
  findings,
  findingsLoading,
  findingsError,
}: {
  vitals: any[] | undefined;
  vitalsLoading?: boolean;
  findings: any[] | undefined;
  findingsLoading?: boolean;
  findingsError?: Error | null;
}) {
  // Combine so HbA1c (categorized as laboratory) still populates the vitals HbA1c card.
  const allForVitals = useMemo(
    () => [...(vitals ?? []), ...(findings ?? [])],
    [vitals, findings],
  );

  const { labs, social, screening } = useMemo(() => {
    const labs: any[] = [];
    const social: any[] = [];
    const screening: any[] = [];
    for (const o of findings ?? []) {
      const kind = classifyObservation(o);
      if (kind === "lab") labs.push(o);
      else if (kind === "social") social.push(o);
      else if (kind === "screening") screening.push(o);
      else if (kind === "vitals") {
        /* skip — belongs in vitals */
      } else {
        labs.push(o); // default catch-all → treat as lab-style measurement
      }
    }
    return { labs, social, screening };
  }, [findings]);

  return (
    <div className="space-y-4">
      {vitalsLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <VitalsCards observations={allForVitals} />
      )}

      <DomainCard domain="observations" title="Laboratory Results">
        {findingsLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : findingsError ? (
          <p className="py-4 text-sm text-destructive">
            Failed to load: {findingsError.message}
          </p>
        ) : (
          <LabResultsTable labs={labs} />
        )}
      </DomainCard>

      <DomainCard domain="observations" title="Social History & Lifestyle">
        {findingsLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <SocialHistoryList items={social} />
        )}
      </DomainCard>

      <DomainCard domain="observations" title="Screening & SDOH Assessments">
        {findingsLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : screening.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No screening or SDOH assessments recorded.
          </p>
        ) : (
          <div className="space-y-3">
            {screening.map((o) => (
              <ScreeningCard key={o.id} obs={o} />
            ))}
          </div>
        )}
      </DomainCard>
    </div>
  );
}
