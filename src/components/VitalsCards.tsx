import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DomainCard } from "@/components/DomainCard";
import {
  VITAL_CODES,
  bpComponents,
  filterByCode,
  obsDate,
  obsNumeric,
  computeBmi,
} from "@/lib/clinical";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Range = "week" | "month" | "year";

function withinRange(dateStr: string | undefined, range: Range) {
  if (!dateStr) return false;
  const d = new Date(dateStr).getTime();
  if (Number.isNaN(d)) return false;
  const now = Date.now();
  const day = 86_400_000;
  const cutoff =
    range === "week" ? 7 * day : range === "month" ? 31 * day : 366 * day;
  return now - d <= cutoff;
}

function TrendCard({
  label,
  unit,
  values,
  color,
  format,
}: {
  label: string;
  unit?: string;
  values: { date?: string; value: number | null; extra?: string }[];
  color: string;
  format?: (v: number) => string;
}) {
  const [range, setRange] = useState<Range>("year");
  const filtered = values
    .filter((v) => v.value !== null && withinRange(v.date, range))
    .reverse();
  const latest = values.find((v) => v.value !== null);
  const previous = values.filter((v) => v.value !== null)[1];
  const delta =
    latest && previous && latest.value !== null && previous.value !== null
      ? latest.value - previous.value
      : null;

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">
            {latest?.value !== undefined && latest?.value !== null
              ? format
                ? format(latest.value)
                : latest.value
              : "—"}
            {unit && latest?.value != null && (
              <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
            )}
          </p>
          {latest?.extra && <p className="text-xs text-muted-foreground">{latest.extra}</p>}
          {delta !== null && (
            <p className={`text-xs ${delta > 0 ? "text-orange-600 dark:text-orange-400" : delta < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
              Δ {delta > 0 ? "+" : ""}
              {delta.toFixed(1)} vs previous
            </p>
          )}
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as Range)}>
          <SelectTrigger className="h-7 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-3 h-16">
        {filtered.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filtered} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip
                labelFormatter={(l) => (l ? new Date(l as string).toLocaleDateString() : "")}
                contentStyle={{ fontSize: 11 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="pt-4 text-xs text-muted-foreground">Not enough data for trend.</p>
        )}
      </div>
    </div>
  );
}

export function VitalsCards({
  observations,
  hasDiabetes: _hasDiabetes,
}: {
  observations: any[] | undefined;
  hasDiabetes?: boolean;
}) {
  const color = "var(--accent-observations)";
  const bpList = useMemo(() => filterByCode(observations, VITAL_CODES.bp), [observations]);
  const hrList = useMemo(() => filterByCode(observations, VITAL_CODES.hr), [observations]);
  const tempList = useMemo(() => filterByCode(observations, VITAL_CODES.temp), [observations]);
  const rrList = useMemo(() => filterByCode(observations, VITAL_CODES.rr), [observations]);
  const spo2List = useMemo(
    () => filterByCode(observations, VITAL_CODES.spo2, VITAL_CODES.spo2Alt),
    [observations],
  );
  const heightList = useMemo(() => filterByCode(observations, VITAL_CODES.height), [observations]);
  const weightList = useMemo(() => filterByCode(observations, VITAL_CODES.weight), [observations]);
  const bmiList = useMemo(() => filterByCode(observations, VITAL_CODES.bmi), [observations]);
  const hba1cList = useMemo(
    () => filterByCode(observations, VITAL_CODES.hba1c, VITAL_CODES.hba1cAlt),
    [observations],
  );

  // Derived BMI when missing
  const derivedBmi = (() => {
    const h = obsNumeric(heightList[0]);
    const w = obsNumeric(weightList[0]);
    const b = computeBmi(h, w);
    if (b == null) return bmiList;
    if (bmiList.length && obsNumeric(bmiList[0]) != null) return bmiList;
    return [{ effectiveDateTime: obsDate(weightList[0]), valueQuantity: { value: b, unit: "kg/m²" }, _derived: true }, ...bmiList];
  })();

  return (
    <DomainCard domain="observations" title="Vitals">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TrendCard
          label="Blood Pressure"
          unit="mmHg"
          color={color}
          values={bpList.map((o) => {
            const { sys, dia } = bpComponents(o);
            return {
              date: obsDate(o),
              value: sys ?? null,
              extra: sys && dia ? `${sys}/${dia}` : undefined,
            };
          })}
          format={(v) => `${v}`}
        />
        <TrendCard label="Heart Rate" unit="bpm" color={color}
          values={hrList.map((o) => ({ date: obsDate(o), value: obsNumeric(o) }))} />
        <TrendCard label="Temperature" unit="°C" color={color}
          values={tempList.map((o) => ({ date: obsDate(o), value: obsNumeric(o) }))} />
        <TrendCard label="Respiratory Rate" unit="/min" color={color}
          values={rrList.map((o) => ({ date: obsDate(o), value: obsNumeric(o) }))} />
        <TrendCard label="Oxygen Sat." unit="%" color={color}
          values={spo2List.map((o) => ({ date: obsDate(o), value: obsNumeric(o) }))} />
        <TrendCard label="Height" unit="cm" color={color}
          values={heightList.map((o) => ({ date: obsDate(o), value: obsNumeric(o) }))} />
        <TrendCard label="Weight" unit="kg" color={color}
          values={weightList.map((o) => ({ date: obsDate(o), value: obsNumeric(o) }))} />
        <TrendCard label="BMI" unit="kg/m²" color={color}
          values={derivedBmi.map((o: any) => ({
            date: obsDate(o),
            value: obsNumeric(o),
            extra: o._derived ? "calculated" : undefined,
          }))} />
        {hasDiabetes && (
          <div className="sm:col-span-2 lg:col-span-4">
            <TrendCard label="HbA1c" unit="%" color={color}
              values={hba1cList.map((o) => ({ date: obsDate(o), value: obsNumeric(o) }))} />
          </div>
        )}
      </div>
    </DomainCard>
  );
}
