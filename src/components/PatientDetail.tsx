import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Loader2,
  Pencil,
  Trash2,
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
  ChevronDown,
  ChevronRight,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { GenderBadge } from "@/components/GenderBadge";
import { PatientForm } from "@/components/PatientForm";
import {
  getPatient,
  searchResources,
  createResource,
  updatePatient,
  deletePatient,
  displayName,
  sanitizeName,
  sanitizeGiven,
  codingText,
  observationValue,
  type FhirPatient,
} from "@/lib/fhir";

interface Props {
  patientId: string;
}

function useResources<T = any>(
  key: (string | undefined)[],
  resourceType: string,
  params: Record<string, string>,
) {
  return useQuery({
    queryKey: [resourceType, ...key],
    queryFn: () => searchResources<T>(resourceType, params),
  });
}

function SectionState({
  loading,
  error,
  empty,
  emptyText,
  children,
}: {
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  if (loading)
    return (
      <div className="flex items-center py-4 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  if (error)
    return (
      <p className="py-4 text-sm text-destructive">Failed to load: {error.message}</p>
    );
  if (empty)
    return <p className="py-4 text-sm text-muted-foreground">{emptyText}</p>;
  return <>{children}</>;
}

function TimelineItem({
  date,
  label,
  detail,
}: {
  date?: string;
  label: string;
  detail?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li className="border-l-2 border-muted pl-3">
      <button
        type="button"
        onClick={() => detail && setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-2 text-left text-sm hover:text-foreground"
      >
        <span className="flex-1">
          <span className="text-muted-foreground">
            {date ? new Date(date).toLocaleDateString() : "—"}
          </span>{" "}
          · {label}
        </span>
        {detail ? (
          open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )
        ) : null}
      </button>
      {open && detail ? (
        <div className="mt-2 rounded bg-muted/40 p-2 text-xs">{detail}</div>
      ) : null}
    </li>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm">{value || "—"}</p>
      </div>
    </div>
  );
}

export function PatientDetail({ patientId }: Props) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const patientQ = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => getPatient(patientId),
  });

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [note, setNote] = useState("");

  // Observations
  const vitals = useResources(["vitals-active", patientId], "Observation", {
    patient: patientId,
    category: "vital-signs",
    _sort: "-date",
    _count: "10",
  });
  const activeFindings = useResources(["findings-active", patientId], "Observation", {
    patient: patientId,
    status: "final",
    _sort: "-date",
    _count: "10",
  });
  const obsHistory = useResources(["obs-history", patientId], "Observation", {
    patient: patientId,
    _sort: "-date",
    _count: "50",
  });

  // Encounters
  const encounters = useResources(["encounters", patientId], "Encounter", {
    patient: patientId,
    _sort: "-date",
    _count: "50",
  });

  // Conditions
  const activeConditions = useResources(
    ["conditions-active", patientId],
    "Condition",
    { patient: patientId, "clinical-status": "active", _count: "50" },
  );
  const resolvedConditions = useResources(
    ["conditions-resolved", patientId],
    "Condition",
    { patient: patientId, "clinical-status": "resolved,inactive,remission", _count: "50" },
  );

  // Clinical history
  const diagnostics = useResources(["diagnostics", patientId], "DiagnosticReport", {
    patient: patientId,
    _sort: "-date",
    _count: "50",
  });
  const allergies = useResources(["allergies", patientId], "AllergyIntolerance", {
    patient: patientId,
    _count: "50",
  });
  const sdoh = useResources(["sdoh", patientId], "Observation", {
    patient: patientId,
    category: "social-history",
    _sort: "-date",
    _count: "50",
  });
  const activeMeds = useResources(["meds-active", patientId], "MedicationRequest", {
    patient: patientId,
    status: "active",
    _count: "50",
  });
  const pastMeds = useResources(["meds-past", patientId], "MedicationRequest", {
    patient: patientId,
    status: "completed,stopped,cancelled,on-hold",
    _count: "50",
  });

  // Notes
  const notes = useResources(["notes", patientId], "DocumentReference", {
    patient: patientId,
    _sort: "-date",
    _count: "20",
  });

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

  const deleteMutation = useMutation({
    mutationFn: () => deletePatient(patientId),
    onSuccess: () => {
      toast.success("Patient deleted");
      qc.invalidateQueries({ queryKey: ["patients"] });
      setDeleteOpen(false);
      navigate({ to: "/" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const body = {
        resourceType: "DocumentReference",
        status: "current",
        subject: { reference: `Patient/${patientId}` },
        date: new Date().toISOString(),
        description: "Clinical note",
        content: [
          {
            attachment: {
              contentType: "text/plain",
              data: btoa(unescape(encodeURIComponent(note))),
            },
          },
        ],
      };
      return createResource("DocumentReference", body);
    },
    onSuccess: () => {
      toast.success("Clinical note added");
      setNote("");
      qc.invalidateQueries({ queryKey: ["DocumentReference", "notes", patientId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (patientQ.isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading patient...
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
      .filter(Boolean)
      .join(", ");

  const latestNote = notes.data?.[0];
  const latestNoteText = (() => {
    if (!latestNote) return null;
    const b64 = latestNote.content?.[0]?.attachment?.data;
    if (b64) {
      try {
        return decodeURIComponent(escape(atob(b64)));
      } catch {
        return latestNote.description || "";
      }
    }
    return latestNote.description || "";
  })();

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card>
        <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserIcon className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold leading-tight">{displayName(p)}</h2>
                <GenderBadge gender={p.gender} />
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.active !== false
                      ? "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-100"
                      : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {p.active !== false ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                ID: {p.id} · DOB: {p.birthDate || "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="info">
        <TabsList className="flex-wrap">
          <TabsTrigger value="info">
            <UserIcon className="mr-1.5 h-4 w-4" /> Patient Information
          </TabsTrigger>
          <TabsTrigger value="observations">
            <Activity className="mr-1.5 h-4 w-4" /> Observations
          </TabsTrigger>
          <TabsTrigger value="encounters">
            <Stethoscope className="mr-1.5 h-4 w-4" /> Encounters
          </TabsTrigger>
          <TabsTrigger value="conditions">
            <ClipboardList className="mr-1.5 h-4 w-4" /> Conditions
          </TabsTrigger>
          <TabsTrigger value="history">
            <HistoryIcon className="mr-1.5 h-4 w-4" /> Clinical History
          </TabsTrigger>
          <TabsTrigger value="notes">
            <FileText className="mr-1.5 h-4 w-4" /> Notes
          </TabsTrigger>
        </TabsList>

        {/* Patient Information */}
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Demographics & Contact</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-1.5 h-4 w-4" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoRow icon={<UserIcon className="h-4 w-4" />} label="Given name" value={sanitizeGiven(p.name?.[0]?.given)} />
              <InfoRow icon={<UserIcon className="h-4 w-4" />} label="Family name" value={sanitizeName(p.name?.[0]?.family)} />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Date of birth" value={p.birthDate} />
              <InfoRow icon={<UserIcon className="h-4 w-4" />} label="Gender" value={<GenderBadge gender={p.gender} />} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={phones.map((t) => t.value).join(", ")} />
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={emails.map((t) => t.value).join(", ")} />
              <div className="sm:col-span-2">
                <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={addressText} />
              </div>
              <InfoRow
                icon={<HistoryIcon className="h-4 w-4" />}
                label="Last updated"
                value={p.meta?.lastUpdated ? new Date(p.meta.lastUpdated).toLocaleString() : undefined}
              />
              <InfoRow
                icon={<Activity className="h-4 w-4" />}
                label="Status"
                value={p.active !== false ? "Active" : "Inactive"}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Observations */}
        <TabsContent value="observations" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Vitals</CardTitle>
            </CardHeader>
            <CardContent>
              <SectionState
                loading={vitals.isLoading}
                error={vitals.error as Error | null}
                empty={!vitals.data?.length}
                emptyText="No vitals recorded."
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {vitals.data?.slice(0, 6).map((v: any) => (
                    <div key={v.id} className="rounded-md border p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {codingText(v.code)}
                      </p>
                      <p className="mt-1 text-lg font-semibold">{observationValue(v) || "—"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {v.effectiveDateTime ? new Date(v.effectiveDateTime).toLocaleDateString() : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionState>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Findings</CardTitle>
            </CardHeader>
            <CardContent>
              <SectionState
                loading={activeFindings.isLoading}
                error={activeFindings.error as Error | null}
                empty={!activeFindings.data?.length}
                emptyText="No active findings."
              >
                <ul className="space-y-1 text-sm">
                  {activeFindings.data?.slice(0, 8).map((f: any) => (
                    <li key={f.id}>
                      <span className="font-medium">{codingText(f.code)}:</span>{" "}
                      {observationValue(f)}
                    </li>
                  ))}
                </ul>
              </SectionState>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historical Observations</CardTitle>
            </CardHeader>
            <CardContent>
              <SectionState
                loading={obsHistory.isLoading}
                error={obsHistory.error as Error | null}
                empty={!obsHistory.data?.length}
                emptyText="No historical observations."
              >
                <ul className="space-y-2">
                  {obsHistory.data?.map((o: any) => (
                    <TimelineItem
                      key={o.id}
                      date={o.effectiveDateTime || o.issued}
                      label={codingText(o.code) || "Observation"}
                      detail={
                        <div className="space-y-1">
                          <p>Value: {observationValue(o) || "—"}</p>
                          {o.status && <p>Status: {o.status}</p>}
                          {o.category?.[0] && <p>Category: {codingText(o.category[0])}</p>}
                        </div>
                      }
                    />
                  ))}
                </ul>
              </SectionState>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Encounters */}
        <TabsContent value="encounters" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Encounters</CardTitle>
            </CardHeader>
            <CardContent>
              <SectionState
                loading={encounters.isLoading}
                error={encounters.error as Error | null}
                empty={!encounters.data?.length}
                emptyText="No encounters recorded."
              >
                <ul className="space-y-2">
                  {encounters.data?.map((e: any) => {
                    const date = e.period?.start || e.period?.end;
                    const type = codingText(e.type?.[0]) || e.class?.display || e.class?.code || "Encounter";
                    const provider =
                      e.participant?.[0]?.individual?.display ||
                      e.serviceProvider?.display ||
                      "";
                    return (
                      <TimelineItem
                        key={e.id}
                        date={date}
                        label={`${type}${provider ? ` — ${provider}` : ""}`}
                        detail={
                          <div className="space-y-1">
                            {e.status && <p>Status: {e.status}</p>}
                            {e.reasonCode?.[0] && <p>Reason: {codingText(e.reasonCode[0])}</p>}
                            {e.period?.start && <p>Start: {new Date(e.period.start).toLocaleString()}</p>}
                            {e.period?.end && <p>End: {new Date(e.period.end).toLocaleString()}</p>}
                          </div>
                        }
                      />
                    );
                  })}
                </ul>
              </SectionState>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conditions */}
        <TabsContent value="conditions" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <SectionState
                loading={activeConditions.isLoading}
                error={activeConditions.error as Error | null}
                empty={!activeConditions.data?.length}
                emptyText="No active conditions."
              >
                <ul className="space-y-1 text-sm">
                  {activeConditions.data?.map((c: any) => (
                    <li key={c.id} className="rounded-md border p-2">
                      <span className="font-medium">{codingText(c.code) || "Condition"}</span>
                      {c.onsetDateTime && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          onset {new Date(c.onsetDateTime).toLocaleDateString()}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </SectionState>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resolved / Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <SectionState
                loading={resolvedConditions.isLoading}
                error={resolvedConditions.error as Error | null}
                empty={!resolvedConditions.data?.length}
                emptyText="No resolved conditions."
              >
                <ul className="space-y-2">
                  {resolvedConditions.data?.map((c: any) => (
                    <TimelineItem
                      key={c.id}
                      date={c.abatementDateTime || c.onsetDateTime}
                      label={codingText(c.code) || "Condition"}
                      detail={
                        <div className="space-y-1">
                          {c.clinicalStatus && <p>Status: {codingText(c.clinicalStatus)}</p>}
                          {c.verificationStatus && (
                            <p>Verification: {codingText(c.verificationStatus)}</p>
                          )}
                          {c.severity && <p>Severity: {codingText(c.severity)}</p>}
                        </div>
                      }
                    />
                  ))}
                </ul>
              </SectionState>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clinical History */}
        <TabsContent value="history" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Medications</CardTitle>
            </CardHeader>
            <CardContent>
              <SectionState
                loading={activeMeds.isLoading}
                error={activeMeds.error as Error | null}
                empty={!activeMeds.data?.length}
                emptyText="No active medications."
              >
                <ul className="space-y-1 text-sm">
                  {activeMeds.data?.map((m: any) => (
                    <li key={m.id} className="rounded-md border p-2">
                      {codingText(m.medicationCodeableConcept) || "Medication"}
                      {m.dosageInstruction?.[0]?.text && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {m.dosageInstruction[0].text}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </SectionState>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Allergies & Intolerances</CardTitle>
            </CardHeader>
            <CardContent>
              <SectionState
                loading={allergies.isLoading}
                error={allergies.error as Error | null}
                empty={!allergies.data?.length}
                emptyText="No allergies recorded."
              >
                <ul className="space-y-1 text-sm">
                  {allergies.data?.map((a: any) => (
                    <li key={a.id} className="rounded-md border p-2">
                      <span className="font-medium">{codingText(a.code) || "Allergy"}</span>
                      {a.criticality && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({a.criticality})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </SectionState>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Diagnoses (Diagnostic Reports)</CardTitle>
            </CardHeader>
            <CardContent>
              <SectionState
                loading={diagnostics.isLoading}
                error={diagnostics.error as Error | null}
                empty={!diagnostics.data?.length}
                emptyText="No diagnostic reports."
              >
                <ul className="space-y-2">
                  {diagnostics.data?.map((d: any) => (
                    <TimelineItem
                      key={d.id}
                      date={d.effectiveDateTime || d.issued}
                      label={codingText(d.code) || "Diagnostic report"}
                      detail={
                        <div className="space-y-1">
                          {d.status && <p>Status: {d.status}</p>}
                          {d.conclusion && <p>Conclusion: {d.conclusion}</p>}
                          {d.category?.[0] && <p>Category: {codingText(d.category[0])}</p>}
                        </div>
                      }
                    />
                  ))}
                </ul>
              </SectionState>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Social History / SDOH</CardTitle>
            </CardHeader>
            <CardContent>
              <SectionState
                loading={sdoh.isLoading}
                error={sdoh.error as Error | null}
                empty={!sdoh.data?.length}
                emptyText="No social history recorded."
              >
                <ul className="space-y-1 text-sm">
                  {sdoh.data?.map((s: any) => (
                    <li key={s.id}>
                      <span className="font-medium">{codingText(s.code)}:</span>{" "}
                      {observationValue(s) || "—"}
                    </li>
                  ))}
                </ul>
              </SectionState>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Past Medications</CardTitle>
            </CardHeader>
            <CardContent>
              <SectionState
                loading={pastMeds.isLoading}
                error={pastMeds.error as Error | null}
                empty={!pastMeds.data?.length}
                emptyText="No past medications."
              >
                <ul className="space-y-2">
                  {pastMeds.data?.map((m: any) => (
                    <TimelineItem
                      key={m.id}
                      date={m.authoredOn}
                      label={codingText(m.medicationCodeableConcept) || "Medication"}
                      detail={
                        <div className="space-y-1">
                          {m.status && <p>Status: {m.status}</p>}
                          {m.dosageInstruction?.[0]?.text && (
                            <p>Dosage: {m.dosageInstruction[0].text}</p>
                          )}
                        </div>
                      }
                    />
                  ))}
                </ul>
              </SectionState>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Latest Clinical Note</CardTitle>
            </CardHeader>
            <CardContent>
              <SectionState
                loading={notes.isLoading}
                error={notes.error as Error | null}
                empty={!latestNote}
                emptyText="No clinical notes yet. Add the first one below."
              >
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">
                    {latestNote?.date ? new Date(latestNote.date).toLocaleString() : ""}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{latestNoteText}</p>
                </div>
              </SectionState>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Clinical Note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write a new clinical note..."
                rows={4}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  disabled={!note.trim() || addNote.isPending}
                  onClick={() => addNote.mutate()}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  {addNote.isPending ? "Saving..." : "Add note"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {notes.data && notes.data.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Previous Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {notes.data.slice(1).map((d: any) => {
                    const b64 = d.content?.[0]?.attachment?.data;
                    let text = d.description || "";
                    if (b64) {
                      try {
                        text = decodeURIComponent(escape(atob(b64)));
                      } catch {
                        /* ignore */
                      }
                    }
                    return (
                      <TimelineItem
                        key={d.id}
                        date={d.date}
                        label={text.slice(0, 60) + (text.length > 60 ? "…" : "")}
                        detail={<p className="whitespace-pre-wrap">{text}</p>}
                      />
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit patient</DialogTitle>
          </DialogHeader>
          <PatientForm
            initial={p}
            submitting={saveMutation.isPending}
            onCancel={() => setEditOpen(false)}
            onSubmit={async (updated) => {
              await saveMutation.mutateAsync({ ...p, ...updated, id: p.id });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete patient?</AlertDialogTitle>
            <AlertDialogDescription>
              This sends DELETE /Patient/{p.id} to the FHIR server. The server decides
              whether to hard delete, soft delete, or reject the request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
