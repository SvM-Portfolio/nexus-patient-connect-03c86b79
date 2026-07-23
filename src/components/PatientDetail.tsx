import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Loader2,
  Pencil,
  Trash2,
  Archive,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User as UserIcon,
  Activity,
  Stethoscope,
  ClipboardList,
  History as HistoryIcon,
  FileText,
  Pill,
  AlertTriangle,
  ShieldCheck,
  ClipboardCheck,
  ListChecks,
  CircleDollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GenderBadge } from "@/components/GenderBadge";
import { PatientForm } from "@/components/PatientForm";
import { DomainCard } from "@/components/DomainCard";
import { ShowMore } from "@/components/ShowMore";
import { VitalsCards } from "@/components/VitalsCards";
import { ObservationsSections } from "@/components/ObservationsSections";
import { QuickActions } from "@/components/QuickActions";
import {
  getPatient,
  searchResources,
  updatePatient,
  deletePatient,
  displayName,
  sanitizeName,
  sanitizeGiven,
  codingText,
  observationValue,
  type FhirPatient,
} from "@/lib/fhir";
import {
  computeAge,
  domainVar,
  allergyCriticalityClass,
  allergyBadge,
  type DomainKey,
} from "@/lib/clinical";

interface Props {
  patientId: string;
}

function useResources<T = any>(
  key: (string | undefined)[],
  resourceType: string,
  params: Record<string, string>,
  enabled = true,
) {
  return useQuery({
    queryKey: [resourceType, ...key],
    queryFn: () => searchResources<T>(resourceType, params),
    enabled,
  });
}

function SectionState({
  loading, error, empty, emptyText, children, skeleton,
}: {
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
  emptyText: string;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
}) {
  if (loading)
    return <>{skeleton ?? <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-4/5" /><Skeleton className="h-8 w-3/5" /></div>}</>;
  if (error)
    return <p className="py-4 text-sm text-destructive">Failed to load: {error.message}</p>;
  if (empty)
    return <p className="py-4 text-sm text-muted-foreground">{emptyText}</p>;
  return <>{children}</>;
}

function InfoRow({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm">{value || "—"}</p>
      </div>
    </div>
  );
}

const TABS: { key: string; label: string; icon: any; domain: DomainKey }[] = [
  { key: "info", label: "Patient Info", icon: UserIcon, domain: "info" },
  { key: "summary", label: "Summary", icon: ListChecks, domain: "summary" },
  { key: "observations", label: "Observations", icon: Activity, domain: "observations" },
  { key: "encounters", label: "Encounters", icon: Stethoscope, domain: "encounters" },
  { key: "diagnoses", label: "Diagnoses", icon: ClipboardCheck, domain: "diagnoses" },
  { key: "conditions", label: "Conditions", icon: ClipboardList, domain: "conditions" },
  { key: "medications", label: "Medications", icon: Pill, domain: "medications" },
  { key: "allergies", label: "Allergies", icon: AlertTriangle, domain: "allergies" },
  { key: "procedures", label: "Procedures", icon: ShieldCheck, domain: "procedures" },
  { key: "billing", label: "Billing & Insurance", icon: CircleDollarSign, domain: "billing" },
  { key: "history", label: "Clinical History", icon: HistoryIcon, domain: "history" },
  { key: "notes", label: "Notes", icon: FileText, domain: "notes" },
];

export function PatientDetail({ patientId }: Props) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const patientQ = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => getPatient(patientId),
  });

  const [tab, setTab] = useState("summary");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  // Observations (exclude vital-signs from findings)
  const vitals = useResources(["vitals", patientId], "Observation", {
    patient: patientId, category: "vital-signs", _sort: "-date", _count: "200",
  });
  const findings = useResources(["findings", patientId], "Observation", {
    patient: patientId, "category:not": "vital-signs", _sort: "-date", _count: "50",
  });

  const encounters = useResources(["encounters", patientId], "Encounter", {
    patient: patientId, _sort: "-date", _count: "100",
  });

  const activeConditions = useResources(["conditions-active", patientId], "Condition",
    { patient: patientId, "clinical-status": "active", _count: "100" });
  const resolvedConditions = useResources(["conditions-resolved", patientId], "Condition",
    { patient: patientId, "clinical-status": "resolved,inactive,remission", _count: "100" });

  const currentDiagnoses = useResources(["dx-current", patientId], "Condition",
    { patient: patientId, category: "encounter-diagnosis", "clinical-status": "active", _count: "50" });
  const historicalDiagnoses = useResources(["dx-history", patientId], "Condition",
    { patient: patientId, category: "encounter-diagnosis", _sort: "-recorded-date", _count: "100" });

  const activeMeds = useResources(["meds-active", patientId], "MedicationRequest",
    { patient: patientId, status: "active", _count: "50" });
  const pastMeds = useResources(["meds-past", patientId], "MedicationRequest",
    { patient: patientId, status: "completed,stopped,cancelled,on-hold", _count: "100" });

  const allergies = useResources(["allergies", patientId], "AllergyIntolerance",
    { patient: patientId, _count: "100" });

  const procedures = useResources(["procedures", patientId], "Procedure",
    { patient: patientId, _sort: "-date", _count: "100" });
  const procedureOrders = useResources(["proc-orders", patientId], "ServiceRequest",
    { patient: patientId, _sort: "-authored", _count: "50" });

  const coverage = useResources(["coverage", patientId], "Coverage",
    { beneficiary: `Patient/${patientId}`, _count: "20" });

  const notes = useResources(["notes", patientId], "DocumentReference",
    { patient: patientId, _sort: "-date", _count: "50" });

  const [encStatus, setEncStatus] = useState<string>("all");

  const saveMutation = useMutation({
    mutationFn: (p: FhirPatient) => updatePatient(p),
    onSuccess: () => {
      toast.success("Patient updated");
      qc.invalidateQueries({ queryKey: ["patient", patientId] });
      qc.invalidateQueries({ queryKey: ["patients"] });
      setEditOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveMutation = useMutation({
    mutationFn: () => updatePatient({ ...(patientQ.data as FhirPatient), active: false }),
    onSuccess: () => {
      toast.success("Patient archived");
      qc.invalidateQueries({ queryKey: ["patient", patientId] });
      qc.invalidateQueries({ queryKey: ["patients"] });
      setArchiveOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePatient(patientId),
    onSuccess: () => {
      toast.success("Patient deleted");
      qc.invalidateQueries({ queryKey: ["patients"] });
      setDeleteOpen(false);
      navigate({ to: "/" });
    },
    onError: (e: Error) => {
      toast.error(`Delete failed — linked records may still exist. ${e.message}`);
    },
  });

  // Detect diabetes for HbA1c trend
  const hasDiabetes = useMemo(
    () =>
      (activeConditions.data ?? []).some((c: any) =>
        (c?.code?.coding ?? []).some(
          (co: any) => co.code === "44054006" || /diabetes/i.test(co.display || ""),
        ),
      ),
    [activeConditions.data],
  );

  if (patientQ.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }
  if (patientQ.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Failed to load patient</AlertTitle>
        <AlertDescription>{(patientQ.error as Error).message}</AlertDescription>
      </Alert>
    );
  }

  const p = patientQ.data as FhirPatient;
  if (!p) return null;

  const phones = (p.telecom ?? []).filter((t) => t.system === "phone");
  const emails = (p.telecom ?? []).filter((t) => t.system === "email");
  const address = p.address?.[0];
  const addressText =
    address?.text ||
    [address?.line?.join(", "), address?.city, address?.state, address?.postalCode, address?.country]
      .filter(Boolean).join(", ");
  const mrn = (p as any).identifier?.find((i: any) =>
    (i?.type?.coding ?? []).some((c: any) => c.code === "MR"))?.value
    || (p as any).identifier?.[0]?.value
    || p.id;
  const tags = ((p as any).meta?.tag ?? []).map((t: any) => t.display || t.code).filter(Boolean) as string[];

  const criticalAllergies = (allergies.data ?? []).filter(
    (a: any) => (a?.criticality || "").toLowerCase() === "high",
  );

  const decodeNote = (n: any) => {
    const b64 = n?.content?.[0]?.attachment?.data;
    if (b64) { try { return decodeURIComponent(escape(atob(b64))); } catch { /* ignore */ } }
    return n?.description || "";
  };

  const filteredEncounters = (encounters.data ?? []).filter(
    (e: any) => encStatus === "all" || e.status === encStatus,
  );

  return (
    <div className="space-y-4">
      {/* Patient Header */}
      <DomainCard domain="info" bodyClassName="py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserIcon className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold leading-tight">{displayName(p)}</h2>
                <GenderBadge gender={p.gender} />
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.active !== false
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {p.active !== false ? "Active" : "Archived"}
                </span>
                {tags.map((t) => (
                  <span key={t} className="rounded-full border px-2 py-0.5 text-xs">{t}</span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground sm:grid-cols-4">
                <div><span className="font-medium text-foreground">MRN</span> · {mrn}</div>
                <div><span className="font-medium text-foreground">Age</span> · {computeAge(p.birthDate)}</div>
                <div><span className="font-medium text-foreground">DOB</span> · {p.birthDate || "—"}</div>
                <div>
                  <span className="font-medium text-foreground">Updated</span> ·{" "}
                  {p.meta?.lastUpdated ? new Date(p.meta.lastUpdated).toLocaleDateString() : "—"}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-4 w-4" /> Edit
            </Button>
            {p.active !== false && (
              <Button variant="outline" size="sm" onClick={() => setArchiveOpen(true)}>
                <Archive className="mr-1.5 h-4 w-4" /> Archive
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      </DomainCard>

      {/* Clinical Summary Strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryChip
          domain="allergies"
          label="Active allergies"
          count={(allergies.data ?? []).length}
          loading={allergies.isLoading}
          onClick={() => setTab("allergies")}
          badge={criticalAllergies.length ? `${criticalAllergies.length} life-threatening` : undefined}
        />
        <SummaryChip
          domain="conditions"
          label="Active conditions"
          count={(activeConditions.data ?? []).length}
          loading={activeConditions.isLoading}
          onClick={() => setTab("conditions")}
        />
        <SummaryChip
          domain="medications"
          label="Active medications"
          count={(activeMeds.data ?? []).length}
          loading={activeMeds.isLoading}
          onClick={() => setTab("medications")}
        />
      </div>

      {criticalAllergies.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical allergy alert</AlertTitle>
          <AlertDescription>
            {criticalAllergies.map((a: any) => codingText(a.code) || "Unknown").join(", ")}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.key}
              value={t.key}
              className="border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              style={
                tab === t.key
                  ? { borderBottomColor: domainVar(t.domain), color: domainVar(t.domain) }
                  : undefined
              }
            >
              <t.icon className="mr-1.5 h-4 w-4" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Patient Info */}
        <TabsContent value="info" className="mt-4">
          <DomainCard domain="info" title="Demographics & Contact">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow icon={<UserIcon className="h-4 w-4" />} label="Given name" value={sanitizeGiven(p.name?.[0]?.given)} />
              <InfoRow icon={<UserIcon className="h-4 w-4" />} label="Family name" value={sanitizeName(p.name?.[0]?.family)} />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Date of birth" value={p.birthDate} />
              <InfoRow icon={<UserIcon className="h-4 w-4" />} label="Gender" value={<GenderBadge gender={p.gender} />} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={phones.map((t) => t.value).join(", ")} />
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={emails.map((t) => t.value).join(", ")} />
              <div className="sm:col-span-2">
                <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={addressText} />
              </div>
            </div>
          </DomainCard>
        </TabsContent>

        {/* Summary */}
        <TabsContent value="summary" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <MiniList domain="conditions" title="Active Conditions"
              q={activeConditions} render={(c: any) => codingText(c.code)} />
            <MiniList domain="diagnoses" title="Current Diagnoses"
              q={currentDiagnoses} render={(c: any) => codingText(c.code)} />
            <MiniList domain="medications" title="Active Medications"
              q={activeMeds} render={(m: any) => codingText(m.medicationCodeableConcept) || "Medication"} />
            <MiniList domain="procedures" title="Recent Procedures"
              q={procedures} render={(p: any) => `${codingText(p.code) || "Procedure"} — ${p.performedDateTime ? new Date(p.performedDateTime).toLocaleDateString() : ""}`} />
            <MiniList domain="allergies" title="Active Allergies"
              q={allergies} render={(a: any) => codingText(a.code)} />
            <DomainCard domain="encounters" title="Latest Encounter">
              <SectionState loading={encounters.isLoading} error={encounters.error as any} empty={!encounters.data?.length} emptyText="No encounters.">
                {(() => {
                  const e = encounters.data?.[0];
                  if (!e) return null;
                  return (
                    <div className="text-sm">
                      <p className="font-medium">{codingText(e.type?.[0]) || e.class?.display || "Encounter"}</p>
                      <p className="text-muted-foreground">
                        {e.period?.start ? new Date(e.period.start).toLocaleString() : ""} · {e.status}
                      </p>
                    </div>
                  );
                })()}
              </SectionState>
            </DomainCard>
            <DomainCard domain="notes" title="Latest Note">
              <SectionState loading={notes.isLoading} error={notes.error as any} empty={!notes.data?.length} emptyText="No notes yet.">
                {(() => {
                  const n = notes.data?.[0];
                  if (!n) return null;
                  return (
                    <div className="text-sm">
                      <p className="text-xs text-muted-foreground">
                        {n.date ? new Date(n.date).toLocaleString() : ""}
                      </p>
                      <p className="mt-1 line-clamp-4 whitespace-pre-wrap">{decodeNote(n)}</p>
                    </div>
                  );
                })()}
              </SectionState>
            </DomainCard>
          </div>
        </TabsContent>

        {/* Observations */}
        <TabsContent value="observations" className="mt-4 space-y-4">
          <ObservationsSections
            vitals={vitals.data}
            vitalsLoading={vitals.isLoading}
            findings={findings.data}
            findingsLoading={findings.isLoading}
            findingsError={findings.error as Error | null}
          />
        </TabsContent>

        {/* Encounters */}
        <TabsContent value="encounters" className="mt-4 space-y-4">
          <DomainCard
            domain="encounters"
            title="Encounters"
            action={
              <Select value={encStatus} onValueChange={setEncStatus}>
                <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in-progress">In progress</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            }
          >
            <SectionState loading={encounters.isLoading} error={encounters.error as any}
              empty={!filteredEncounters.length} emptyText="No encounters recorded.">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground">
                    <tr><th className="py-2">Date</th><th>Type</th><th>Provider</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {filteredEncounters.map((e: any) => (
                      <tr key={e.id} className="border-t">
                        <td className="py-2">{e.period?.start ? new Date(e.period.start).toLocaleDateString() : "—"}</td>
                        <td>{codingText(e.type?.[0]) || e.class?.display || "—"}</td>
                        <td>{e.participant?.[0]?.individual?.display || e.serviceProvider?.display || "—"}</td>
                        <td><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{e.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionState>
          </DomainCard>
        </TabsContent>

        {/* Diagnoses */}
        <TabsContent value="diagnoses" className="mt-4 space-y-4">
          <DomainCard domain="diagnoses" title="Current Encounter Diagnoses">
            <SectionState loading={currentDiagnoses.isLoading} error={currentDiagnoses.error as any}
              empty={!currentDiagnoses.data?.length} emptyText="No current diagnoses.">
              <ul className="space-y-1 text-sm">
                {currentDiagnoses.data?.map((c: any) => (
                  <li key={c.id} className="rounded-md border p-2">
                    <span className="font-medium">{codingText(c.code)}</span>
                    {c.recordedDate && <span className="ml-2 text-xs text-muted-foreground">recorded {new Date(c.recordedDate).toLocaleDateString()}</span>}
                  </li>
                ))}
              </ul>
            </SectionState>
          </DomainCard>
          <DomainCard domain="diagnoses" title="Historical Diagnoses">
            <SectionState loading={historicalDiagnoses.isLoading} error={historicalDiagnoses.error as any}
              empty={!historicalDiagnoses.data?.length} emptyText="No historical diagnoses.">
              <ShowMore
                items={historicalDiagnoses.data ?? []}
                render={(c: any) => (
                  <div key={c.id} className="rounded-md border p-2 text-sm">
                    <span className="font-medium">{codingText(c.code)}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {c.recordedDate ? new Date(c.recordedDate).toLocaleDateString() : ""}
                    </span>
                  </div>
                )}
              />
            </SectionState>
          </DomainCard>
        </TabsContent>

        {/* Conditions */}
        <TabsContent value="conditions" className="mt-4 space-y-4">
          <DomainCard domain="conditions" title="Active Conditions">
            <SectionState loading={activeConditions.isLoading} error={activeConditions.error as any}
              empty={!activeConditions.data?.length} emptyText="No active conditions.">
              <ul className="space-y-1.5 text-sm">
                {activeConditions.data?.map((c: any) => (
                  <li key={c.id} className="rounded-md border p-2.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium">{codingText(c.code)}</span>
                      {c.onsetDateTime && (
                        <span className="text-xs text-muted-foreground">
                          onset {new Date(c.onsetDateTime).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <ConditionCodeBadges coding={c.code?.coding} />
                  </li>
                ))}
              </ul>
            </SectionState>
          </DomainCard>
          <DomainCard domain="conditions" title="Resolved / Inactive (timeline)">
            <SectionState loading={resolvedConditions.isLoading} error={resolvedConditions.error as any}
              empty={!resolvedConditions.data?.length} emptyText="No resolved conditions.">
              <ShowMore
                items={resolvedConditions.data ?? []}
                render={(c: any) => (
                  <div key={c.id} className="border-l-2 border-muted pl-3 text-sm">
                    <p className="text-xs text-muted-foreground">
                      {c.abatementDateTime ? new Date(c.abatementDateTime).toLocaleDateString() : "—"}
                    </p>
                    <p>{codingText(c.code)}</p>
                  </div>
                )}
              />
            </SectionState>
          </DomainCard>
        </TabsContent>

        {/* Medications */}
        <TabsContent value="medications" className="mt-4 space-y-4">
          <DomainCard domain="medications" title="Active Medications">
            <SectionState loading={activeMeds.isLoading} error={activeMeds.error as any}
              empty={!activeMeds.data?.length} emptyText="No active medications.">
              <div className="grid gap-2">
                {activeMeds.data?.map((m: any) => {
                  const rx = m.medicationCodeableConcept?.coding?.find((c: any) => (c.system || "").includes("rxnorm"));
                  return (
                    <div key={m.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{codingText(m.medicationCodeableConcept) || "Medication"}</p>
                          {m.dosageInstruction?.[0]?.text && (
                            <p className="text-muted-foreground">{m.dosageInstruction[0].text}</p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            Prescriber: {m.requester?.display || "—"}
                            {rx && <> · RxNorm {rx.code}</>}
                          </p>
                        </div>
                        <span className="rounded-full bg-[color:var(--accent-medications)]/15 px-2 py-0.5 text-xs text-[color:var(--accent-medications)]">
                          {m.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionState>
          </DomainCard>
          <DomainCard domain="medications" title="Past Medications">
            <SectionState loading={pastMeds.isLoading} error={pastMeds.error as any}
              empty={!pastMeds.data?.length} emptyText="No past medications.">
              <ShowMore
                items={pastMeds.data ?? []}
                render={(m: any) => (
                  <div key={m.id} className="rounded-md border p-2 text-sm">
                    <p className="font-medium">{codingText(m.medicationCodeableConcept)}</p>
                    <p className="text-xs text-muted-foreground">{m.status} · {m.authoredOn ? new Date(m.authoredOn).toLocaleDateString() : ""}</p>
                  </div>
                )}
              />
            </SectionState>
          </DomainCard>
        </TabsContent>

        {/* Allergies */}
        <TabsContent value="allergies" className="mt-4">
          <DomainCard domain="allergies" title="Allergies & Intolerances">
            <SectionState loading={allergies.isLoading} error={allergies.error as any}
              empty={!allergies.data?.length} emptyText="No allergies recorded.">
              <div className="space-y-2">
                {(allergies.data ?? []).map((a: any) => {
                  const badge = allergyBadge(a);
                  return (
                    <div key={a.id} className={`rounded-md p-3 text-sm ${allergyCriticalityClass(a.criticality)}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{codingText(a.code) || "Unknown allergen"}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.category?.join(", ") || "—"} · Reaction:{" "}
                            {a.reaction?.[0]?.manifestation?.map((m: any) => codingText(m)).join(", ") || "—"}
                          </p>
                        </div>
                        {badge && (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionState>
          </DomainCard>
        </TabsContent>

        {/* Procedures */}
        <TabsContent value="procedures" className="mt-4 space-y-4">
          <DomainCard domain="procedures" title="Completed Procedures">
            <SectionState loading={procedures.isLoading} error={procedures.error as any}
              empty={!procedures.data?.length} emptyText="No completed procedures.">
              <ShowMore
                items={procedures.data ?? []}
                render={(p: any) => (
                  <div key={p.id} className="rounded-md border p-2 text-sm">
                    <p className="font-medium">{codingText(p.code)}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.performedDateTime ? new Date(p.performedDateTime).toLocaleDateString() : "—"} · {p.status}
                    </p>
                  </div>
                )}
              />
            </SectionState>
          </DomainCard>
          <DomainCard domain="procedures" title="Scheduled / Ordered">
            <SectionState loading={procedureOrders.isLoading} error={procedureOrders.error as any}
              empty={!procedureOrders.data?.length} emptyText="No pending procedure orders. Use Quick Actions to order.">
              <ul className="space-y-1 text-sm">
                {procedureOrders.data?.map((s: any) => (
                  <li key={s.id} className="rounded-md border p-2">
                    <span className="font-medium">{codingText(s.code)}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {s.occurrenceDateTime ? new Date(s.occurrenceDateTime).toLocaleDateString() : "unscheduled"} · {s.status}
                    </span>
                  </li>
                ))}
              </ul>
            </SectionState>
          </DomainCard>
        </TabsContent>

        {/* Billing & Insurance */}
        <TabsContent value="billing" className="mt-4">
          <DomainCard domain="billing" title="Coverage">
            <SectionState loading={coverage.isLoading} error={coverage.error as any}
              empty={!coverage.data?.length} emptyText="No coverage on file.">
              <div className="grid gap-3 md:grid-cols-2">
                {coverage.data?.map((c: any) => (
                  <div key={c.id} className="rounded-md border p-3 text-sm">
                    <p className="font-semibold">{c.payor?.[0]?.display || c.class?.[0]?.name || "Payer"}</p>
                    <p className="text-xs text-muted-foreground">Plan: {c.class?.find((x: any) => x.type?.coding?.[0]?.code === "plan")?.name || c.type?.text || "—"}</p>
                    <p className="text-xs text-muted-foreground">Subscriber ID: {c.subscriberId || "—"}</p>
                    <p className="text-xs text-muted-foreground">Status: {c.status}</p>
                    <p className="text-xs text-muted-foreground">
                      Period:{" "}
                      {c.period?.start ? new Date(c.period.start).toLocaleDateString() : "—"} →{" "}
                      {c.period?.end ? new Date(c.period.end).toLocaleDateString() : "ongoing"}
                    </p>
                  </div>
                ))}
              </div>
            </SectionState>
          </DomainCard>
        </TabsContent>

        {/* Clinical History (chronological across resources, 5 newest) */}
        <TabsContent value="history" className="mt-4">
          <DomainCard domain="history" title="Chronological Clinical Activity">
            <ClinicalHistory
              encounters={encounters.data}
              conditions={[...(activeConditions.data ?? []), ...(resolvedConditions.data ?? [])]}
              meds={[...(activeMeds.data ?? []), ...(pastMeds.data ?? [])]}
              procedures={procedures.data}
              notes={notes.data}
              observations={findings.data}
            />
          </DomainCard>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="mt-4 space-y-4">
          <DomainCard domain="notes" title="Clinical Notes">
            <SectionState loading={notes.isLoading} error={notes.error as any}
              empty={!notes.data?.length} emptyText="No notes yet. Use Quick Actions to add a note.">
              <ShowMore
                items={notes.data ?? []}
                render={(n: any) => {
                  const text = decodeNote(n);
                  const needsReview = (n?.docStatus === "preliminary") || (n?.description || "").toLowerCase().includes("ocr") || (n?.description || "").toLowerCase().includes("voice");
                  return (
                    <div key={n.id} className="rounded-md border p-3 text-sm">
                      {needsReview && (
                        <div className="mb-2 rounded bg-[color:var(--accent-conditions)]/10 px-2 py-1 text-xs font-medium text-[color:var(--accent-conditions)]">
                          ⚠ Needs Review
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {n.date ? new Date(n.date).toLocaleString() : ""} · {n.type?.text || n.description || "Note"}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">{text}</p>
                    </div>
                  );
                }}
              />
            </SectionState>
          </DomainCard>
        </TabsContent>
      </Tabs>

      {/* Edit drawer */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Edit patient</SheetTitle>
            <SheetDescription>
              Updates demographics only. New clinical resources should be added via the tabs — not by editing existing ones.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <PatientForm
              initial={p}
              submitting={saveMutation.isPending}
              onCancel={() => setEditOpen(false)}
              onSubmit={async (updated) => {
                await saveMutation.mutateAsync({ ...p, ...updated, id: p.id });
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Archive dialog */}
      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this patient?</AlertDialogTitle>
            <AlertDialogDescription>
              Sets Patient.active = false. Clinical records remain intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiveMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); archiveMutation.mutate(); }}
              disabled={archiveMutation.isPending}
            >
              {archiveMutation.isPending ? "Archiving…" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete patient?</AlertDialogTitle>
            <AlertDialogDescription>
              Sends DELETE /Patient/{p.id}. If the FHIR server rejects due to linked
              records, the patient stays in place — consider archiving instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); deleteMutation.mutate(); }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <QuickActions patientId={patientId} />
    </div>
  );
}

function SummaryChip({
  domain, label, count, loading, badge, onClick,
}: {
  domain: DomainKey; label: string; count: number; loading?: boolean;
  badge?: string; onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-md border border-l-4 bg-card px-4 py-3 text-left transition-colors hover:bg-accent"
      style={{ borderLeftColor: domainVar(domain) }}
    >
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : count}
        </p>
      </div>
      {badge && (
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold text-foreground"
          style={{ backgroundColor: domainVar(domain) }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function MiniList({
  domain, title, q, render,
}: {
  domain: DomainKey; title: string; q: any; render: (item: any) => React.ReactNode;
}) {
  const items = (q.data ?? []) as any[];
  return (
    <DomainCard domain={domain} title={title}>
      <SectionState loading={q.isLoading} error={q.error as any} empty={!items.length} emptyText="None recorded.">
        <ul className="space-y-1 text-sm">
          {items.slice(0, 5).map((it, i) => (
            <li key={it.id ?? i} className="border-b border-dashed py-1 last:border-b-0">
              {render(it)}
            </li>
          ))}
        </ul>
      </SectionState>
    </DomainCard>
  );
}

function ClinicalHistory({
  encounters, conditions, meds, procedures, notes, observations,
}: {
  encounters?: any[]; conditions?: any[]; meds?: any[]; procedures?: any[]; notes?: any[]; observations?: any[];
}) {
  type Event = { date: string; kind: string; title: string; domain: DomainKey };
  const events: Event[] = [];
  const push = (date: string | undefined, kind: string, title: string, domain: DomainKey) => {
    if (date) events.push({ date, kind, title, domain });
  };
  (encounters ?? []).forEach((e) => push(e.period?.start, "Encounter",
    codingText(e.type?.[0]) || e.class?.display || "Encounter", "encounters"));
  (conditions ?? []).forEach((c) => push(c.recordedDate || c.onsetDateTime, "Condition", codingText(c.code), "conditions"));
  (meds ?? []).forEach((m) => push(m.authoredOn, "Medication", codingText(m.medicationCodeableConcept), "medications"));
  (procedures ?? []).forEach((p) => push(p.performedDateTime, "Procedure", codingText(p.code), "procedures"));
  (notes ?? []).forEach((n) => push(n.date, "Note", n.description || "Clinical note", "notes"));
  (observations ?? []).forEach((o) => push(o.effectiveDateTime, "Observation",
    `${codingText(o.code)}: ${observationValue(o)}`, "observations"));

  events.sort((a, b) => b.date.localeCompare(a.date));
  if (!events.length) return <p className="text-sm text-muted-foreground">No clinical history yet.</p>;

  return (
    <ShowMore
      items={events}
      render={(ev) => (
        <div key={`${ev.date}-${ev.title}`} className="flex gap-3 border-l-2 pl-3 text-sm"
          style={{ borderLeftColor: domainVar(ev.domain) }}>
          <div className="w-32 shrink-0 text-xs text-muted-foreground">
            {new Date(ev.date).toLocaleDateString()}
          </div>
          <div className="flex-1">
            <span className="mr-2 rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: domainVar(ev.domain), color: domainVar(ev.domain) }}>
              {ev.kind}
            </span>
            {ev.title}
          </div>
        </div>
      )}
    />
  );
}
