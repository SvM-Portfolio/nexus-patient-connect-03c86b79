import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Save,
  AlertCircle,
  CheckCircle2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Toaster } from "@/components/ui/sonner";
import { createResource } from "@/lib/fhir";
import {
  clearDraft,
  COUNTRIES,
  emptyDraft,
  FAMILY_RELATIONSHIPS,
  INSURANCE_PROVIDERS,
  loadDraft,
  mapGender,
  RELATIONSHIP_CODES,
  saveDraft,
  STATES_BY_COUNTRY,
  type AddressDraft,
  type AllergyDraft,
  type FamilyHistoryDraft,
  type GenderChoice,
  type IntakeDraft,
  type InsuranceTierDraft,
  type MedicationDraft,
  type PastConditionDraft,
} from "@/lib/intake-draft";
import { OrganizationPicker, PractitionerPicker } from "@/components/ResourcePicker";

export const Route = createFileRoute("/patients/new")({
  head: () => ({
    meta: [
      { title: "New Patient Intake — Nexus Pro" },
      { name: "description", content: "Multi-step FHIR R4 patient intake wizard." },
      { property: "og:title", content: "New Patient Intake — Nexus Pro" },
      { property: "og:description", content: "Guided multi-step patient intake." },
    ],
  }),
  component: IntakeWizard,
});

const STEPS = [
  { id: 1, name: "Patient Information" },
  { id: 2, name: "Contact Information" },
  { id: 3, name: "Preferences" },
  { id: 4, name: "Insurance" },
  { id: 5, name: "Clinical Background" },
  { id: 6, name: "Review & Submit" },
];

/* ----------------------------- helpers ------------------------------ */

function calcAge(birth?: string): string {
  if (!birth) return "";
  const d = new Date(birth);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 ? String(age) : "";
}

function isValidStep(step: number, d: IntakeDraft): string[] {
  const errs: string[] = [];
  if (step === 1) {
    if (!d.firstName.trim()) errs.push("First name is required");
    if (!d.lastName.trim()) errs.push("Last name is required");
    if (!d.birthDate) errs.push("Date of birth is required");
    if (!d.gender) errs.push("Gender is required");
  }
  if (step === 2) {
    if (!d.phone.trim()) errs.push("Phone is required");
    if (!d.currentAddress.line1.trim()) errs.push("Current address line 1 is required");
    if (!d.currentAddress.city.trim()) errs.push("Current address city is required");
    if (!d.currentAddress.country.trim()) errs.push("Current address country is required");
  }
  return errs;
}

/* ============================ WIZARD =============================== */

interface SubmissionState {
  status: "idle" | "submitting" | "partial" | "success" | "error";
  patientId?: string;
  results: {
    key: string;
    label: string;
    section: number;
    status: "pending" | "ok" | "error" | "skipped";
    error?: string;
    id?: string;
  }[];
}

function IntakeWizard() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<IntakeDraft>(() => emptyDraft());
  const [hydrated, setHydrated] = useState(false);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [submission, setSubmission] = useState<SubmissionState>({
    status: "idle",
    results: [],
  });

  useEffect(() => {
    setDraft(loadDraft());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveDraft(draft);
  }, [draft, hydrated]);

  const update = (patch: Partial<IntakeDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const goTo = (step: number) => {
    setStepErrors([]);
    update({ step });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => {
    const errs = isValidStep(draft.step, draft);
    if (errs.length) {
      setStepErrors(errs);
      return;
    }
    goTo(Math.min(6, draft.step + 1));
  };

  const back = () => goTo(Math.max(1, draft.step - 1));

  const progress = ((draft.step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">New Patient Intake</h1>
              <p className="text-xs text-muted-foreground">
                Step {draft.step} of {STEPS.length}: {STEPS[draft.step - 1].name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline">
              <Link to="/">Back to patients</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {/* Stepper */}
        <div className="space-y-3">
          <Progress value={progress} className="h-2" />
          <ol className="hidden gap-2 md:flex">
            {STEPS.map((s) => {
              const state =
                s.id < draft.step ? "done" : s.id === draft.step ? "current" : "todo";
              return (
                <li key={s.id} className="flex-1">
                  <button
                    type="button"
                    onClick={() => s.id < draft.step && goTo(s.id)}
                    disabled={s.id > draft.step}
                    className={
                      "w-full rounded-md border p-2 text-left text-xs transition-colors " +
                      (state === "current"
                        ? "border-primary bg-primary/5 font-medium text-foreground"
                        : state === "done"
                        ? "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                        : "border-dashed text-muted-foreground/70")
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          "flex h-5 w-5 items-center justify-center rounded-full text-[10px] " +
                          (state === "done"
                            ? "bg-primary text-primary-foreground"
                            : state === "current"
                            ? "border border-primary text-primary"
                            : "border")
                        }
                      >
                        {state === "done" ? <Check className="h-3 w-3" /> : s.id}
                      </span>
                      <span className="truncate">{s.name}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {stepErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Please fix the following</AlertTitle>
            <AlertDescription>
              <ul className="ml-4 list-disc">
                {stepErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {draft.step === 1 && <Step1 draft={draft} update={update} />}
        {draft.step === 2 && <Step2 draft={draft} update={update} />}
        {draft.step === 3 && <Step3 draft={draft} update={update} />}
        {draft.step === 4 && <Step4 draft={draft} update={update} />}
        {draft.step === 5 && <Step5 draft={draft} update={update} />}
        {draft.step === 6 && (
          <Step6
            draft={draft}
            goTo={goTo}
            submission={submission}
            setSubmission={setSubmission}
            onFinished={(patientId) => {
              clearDraft();
              toast.success("Patient intake completed");
              if (patientId) {
                navigate({ to: "/patients/$id", params: { id: patientId } });
              } else {
                navigate({ to: "/" });
              }
            }}
          />
        )}

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={back}
            disabled={draft.step === 1 || submission.status === "submitting"}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                saveDraft(draft);
                toast.success("Draft saved. You can safely leave and resume later.");
              }}
            >
              <Save className="mr-2 h-4 w-4" /> Save draft
            </Button>
            {draft.step < 6 && (
              <Button type="button" onClick={next}>
                Save & Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ============================ STEP 1 =============================== */

function Step1({ draft, update }: { draft: IntakeDraft; update: (p: Partial<IntakeDraft>) => void }) {
  const age = calcAge(draft.birthDate);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Information</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Field label="First name" required>
          <Input value={draft.firstName} onChange={(e) => update({ firstName: e.target.value })} />
        </Field>
        <Field label="Last name" required>
          <Input value={draft.lastName} onChange={(e) => update({ lastName: e.target.value })} />
        </Field>
        <Field label="Chosen name (nickname)">
          <Input value={draft.chosenName} onChange={(e) => update({ chosenName: e.target.value })} />
        </Field>
        <Field label="Date of birth" required>
          <Input
            type="date"
            value={draft.birthDate}
            onChange={(e) => update({ birthDate: e.target.value })}
          />
        </Field>
        <Field label="Age (calculated)">
          <Input value={age} readOnly placeholder="—" />
        </Field>
        <Field label="Gender" required>
          <Select
            value={draft.gender}
            onValueChange={(v) => update({ gender: v as GenderChoice })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Non-binary">Non-binary</SelectItem>
              <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </CardContent>
    </Card>
  );
}

/* ============================ STEP 2 =============================== */

function AddressFields({
  addr,
  onChange,
  prefix,
}: {
  addr: AddressDraft;
  onChange: (a: AddressDraft) => void;
  prefix: string;
}) {
  const states = STATES_BY_COUNTRY[addr.country] ?? [];
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label={`${prefix} address line 1`}>
        <Input value={addr.line1} onChange={(e) => onChange({ ...addr, line1: e.target.value })} />
      </Field>
      <Field label="Line 2">
        <Input value={addr.line2} onChange={(e) => onChange({ ...addr, line2: e.target.value })} />
      </Field>
      <Field label="Country">
        <Select
          value={addr.country}
          onValueChange={(v) => onChange({ ...addr, country: v, state: "" })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="State / Province">
        {states.length ? (
          <Select value={addr.state} onValueChange={(v) => onChange({ ...addr, state: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {states.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input value={addr.state} onChange={(e) => onChange({ ...addr, state: e.target.value })} />
        )}
      </Field>
      <Field label="City">
        <Input value={addr.city} onChange={(e) => onChange({ ...addr, city: e.target.value })} />
      </Field>
      <Field label="Postal code">
        <Input
          value={addr.postalCode}
          onChange={(e) => onChange({ ...addr, postalCode: e.target.value })}
        />
      </Field>
    </div>
  );
}

function Step2({ draft, update }: { draft: IntakeDraft; update: (p: Partial<IntakeDraft>) => void }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Phone" required>
            <Input value={draft.phone} onChange={(e) => update({ phone: e.target.value })} />
          </Field>
          <Field label="Occupation">
            <Input
              value={draft.occupation}
              onChange={(e) => update({ occupation: e.target.value })}
              placeholder="e.g. Software Engineer"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing address</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressFields
            addr={draft.billingAddress}
            onChange={(a) => update({ billingAddress: a })}
            prefix="Billing"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Current address</CardTitle>
          <label className="flex items-center gap-2 text-sm font-normal">
            <Checkbox
              checked={draft.sameAsBilling}
              onCheckedChange={(v) => {
                const same = Boolean(v);
                update({
                  sameAsBilling: same,
                  currentAddress: same ? { ...draft.billingAddress } : draft.currentAddress,
                });
              }}
            />
            Same as billing
          </label>
        </CardHeader>
        <CardContent>
          {!draft.sameAsBilling && (
            <AddressFields
              addr={draft.currentAddress}
              onChange={(a) => update({ currentAddress: a })}
              prefix="Current"
            />
          )}
          {draft.sameAsBilling && (
            <p className="text-sm text-muted-foreground">
              Current address will mirror the billing address.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="First name">
            <Input
              value={draft.emergencyContact.firstName}
              onChange={(e) =>
                update({
                  emergencyContact: { ...draft.emergencyContact, firstName: e.target.value },
                })
              }
            />
          </Field>
          <Field label="Last name">
            <Input
              value={draft.emergencyContact.lastName}
              onChange={(e) =>
                update({
                  emergencyContact: { ...draft.emergencyContact, lastName: e.target.value },
                })
              }
            />
          </Field>
          <Field label="Relationship">
            <Select
              value={draft.emergencyContact.relationship}
              onValueChange={(v) =>
                update({ emergencyContact: { ...draft.emergencyContact, relationship: v } })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_CODES.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    {r.display}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Phone">
            <Input
              value={draft.emergencyContact.phone}
              onChange={(e) =>
                update({
                  emergencyContact: { ...draft.emergencyContact, phone: e.target.value },
                })
              }
            />
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================ STEP 3 =============================== */

function Step3({ draft, update }: { draft: IntakeDraft; update: (p: Partial<IntakeDraft>) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <p className="text-sm text-muted-foreground">
          Search existing Organizations or create new ones inline. eRx Pharmacy is required.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <OrganizationPicker
          label="Preferred pharmacy"
          value={draft.preferredPharmacy}
          onChange={(v) => update({ preferredPharmacy: v })}
        />
        <OrganizationPicker
          label="eRx pharmacy (default)"
          required
          value={draft.erxPharmacy}
          onChange={(v) => update({ erxPharmacy: v })}
        />
        <OrganizationPicker
          label="Laboratory center"
          value={draft.laboratoryCenter}
          onChange={(v) => update({ laboratoryCenter: v })}
        />
        <OrganizationPicker
          label="Radiology center"
          value={draft.radiologyCenter}
          onChange={(v) => update({ radiologyCenter: v })}
        />
        <OrganizationPicker
          label="Service location"
          value={draft.serviceLocation}
          onChange={(v) => update({ serviceLocation: v })}
        />
        <Separator />
        <PractitionerPicker
          label="Primary care physician (Patient.generalPractitioner)"
          value={draft.primaryCarePhysician}
          onChange={(v) => update({ primaryCarePhysician: v })}
        />
      </CardContent>
    </Card>
  );
}

/* ============================ STEP 4 =============================== */

function InsuranceTier({
  tier,
  value,
  onChange,
}: {
  tier: "primary" | "secondary" | "tertiary";
  value: InsuranceTierDraft;
  onChange: (v: InsuranceTierDraft) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Insurance provider">
        <Select
          value={value.providerName}
          onValueChange={async (name) => {
            // Try to find or create an Organization for the payor
            onChange({ ...value, providerName: name, providerId: "" });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select provider..." />
          </SelectTrigger>
          <SelectContent>
            {INSURANCE_PROVIDERS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Policy number">
        <Input
          value={value.policyNumber}
          onChange={(e) => onChange({ ...value, policyNumber: e.target.value })}
        />
      </Field>
      <Field label="Expiration date">
        <Input
          type="date"
          value={value.expirationDate}
          onChange={(e) => onChange({ ...value, expirationDate: e.target.value })}
        />
      </Field>
      <Field label="Plan">
        <Input value={value.plan} onChange={(e) => onChange({ ...value, plan: e.target.value })} />
      </Field>
      <Field label="Copay (USD)">
        <Input
          type="number"
          min={0}
          value={value.copay}
          onChange={(e) => onChange({ ...value, copay: e.target.value })}
        />
      </Field>
      <div className="flex items-end">
        <p className="text-xs text-muted-foreground">
          Stored as Coverage with order = {tier === "primary" ? 1 : tier === "secondary" ? 2 : 3}.
        </p>
      </div>
    </div>
  );
}

function Step4({ draft, update }: { draft: IntakeDraft; update: (p: Partial<IntakeDraft>) => void }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Insurance coverage</CardTitle>
          <p className="text-sm text-muted-foreground">
            Each tab is stored as its own FHIR Coverage resource.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="primary">
            <TabsList>
              <TabsTrigger value="primary">Primary</TabsTrigger>
              <TabsTrigger value="secondary">Secondary</TabsTrigger>
              <TabsTrigger value="tertiary">Tertiary</TabsTrigger>
            </TabsList>
            <TabsContent value="primary" className="pt-4">
              <InsuranceTier
                tier="primary"
                value={draft.primary}
                onChange={(v) => update({ primary: v })}
              />
            </TabsContent>
            <TabsContent value="secondary" className="pt-4">
              <InsuranceTier
                tier="secondary"
                value={draft.secondary}
                onChange={(v) => update({ secondary: v })}
              />
            </TabsContent>
            <TabsContent value="tertiary" className="pt-4">
              <InsuranceTier
                tier="tertiary"
                value={draft.tertiary}
                onChange={(v) => update({ tertiary: v })}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================ STEP 5 =============================== */

function Step5({ draft, update }: { draft: IntakeDraft; update: (p: Partial<IntakeDraft>) => void }) {
  const addCondition = () =>
    update({
      pastConditions: [
        ...draft.pastConditions,
        { diagnosis: "", onset: "", clinicalStatus: "active", resolved: false } as PastConditionDraft,
      ],
    });
  const addMed = () =>
    update({
      medications: [...draft.medications, { name: "", dosage: "", status: "active" } as MedicationDraft],
    });
  const addAllergy = () =>
    update({
      allergies: [
        ...draft.allergies,
        { substance: "", reaction: "", severity: "", criticality: "" } as AllergyDraft,
      ],
    });
  const addFamily = () =>
    update({
      familyHistory: [
        ...draft.familyHistory,
        { relationship: "", name: "", condition: "", note: "" } as FamilyHistoryDraft,
      ],
    });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chief complaint & HPI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Chief complaint (stored as Condition, category = chief-complaint)">
            <Input
              value={draft.chiefComplaint}
              onChange={(e) => update({ chiefComplaint: e.target.value })}
              placeholder="e.g. Chest pain"
            />
          </Field>
          <Field label="History of present illness (stored as Condition.note on the chief complaint)">
            <Textarea
              value={draft.hpi}
              onChange={(e) => update({ hpi: e.target.value })}
              rows={6}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Past medical history</CardTitle>
          <Button variant="outline" size="sm" onClick={addCondition}>
            <Plus className="mr-1 h-4 w-4" /> Add condition
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.pastConditions.length === 0 && (
            <p className="text-sm text-muted-foreground">No past conditions.</p>
          )}
          {draft.pastConditions.map((c, i) => (
            <div key={i} className="grid gap-3 rounded-md border p-3 md:grid-cols-5">
              <Field label="Diagnosis">
                <Input
                  value={c.diagnosis}
                  onChange={(e) => {
                    const next = [...draft.pastConditions];
                    next[i] = { ...c, diagnosis: e.target.value };
                    update({ pastConditions: next });
                  }}
                />
              </Field>
              <Field label="Onset">
                <Input
                  type="date"
                  value={c.onset}
                  onChange={(e) => {
                    const next = [...draft.pastConditions];
                    next[i] = { ...c, onset: e.target.value };
                    update({ pastConditions: next });
                  }}
                />
              </Field>
              <Field label="Clinical status">
                <Select
                  value={c.clinicalStatus}
                  onValueChange={(v) => {
                    const next = [...draft.pastConditions];
                    next[i] = { ...c, clinicalStatus: v as PastConditionDraft["clinicalStatus"] };
                    update({ pastConditions: next });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["active", "recurrence", "relapse", "inactive", "remission", "resolved"].map(
                      (s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </Field>
              <label className="flex items-end gap-2 pb-2 text-sm">
                <Checkbox
                  checked={c.resolved}
                  onCheckedChange={(v) => {
                    const next = [...draft.pastConditions];
                    next[i] = {
                      ...c,
                      resolved: Boolean(v),
                      clinicalStatus: v ? "resolved" : c.clinicalStatus,
                    };
                    update({ pastConditions: next });
                  }}
                />
                Resolved
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Current medications</CardTitle>
          <Button variant="outline" size="sm" onClick={addMed}>
            <Plus className="mr-1 h-4 w-4" /> Add medication
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.medications.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No medications reported. Stored as MedicationStatement (patient-reported).
            </p>
          )}
          {draft.medications.map((m, i) => (
            <div key={i} className="grid gap-3 rounded-md border p-3 md:grid-cols-4">
              <Field label="Medication">
                <Input
                  value={m.name}
                  onChange={(e) => {
                    const next = [...draft.medications];
                    next[i] = { ...m, name: e.target.value };
                    update({ medications: next });
                  }}
                />
              </Field>
              <Field label="Dosage">
                <Input
                  value={m.dosage}
                  onChange={(e) => {
                    const next = [...draft.medications];
                    next[i] = { ...m, dosage: e.target.value };
                    update({ medications: next });
                  }}
                  placeholder="e.g. 10 mg daily"
                />
              </Field>
              <Field label="Status">
                <Select
                  value={m.status}
                  onValueChange={(v) => {
                    const next = [...draft.medications];
                    next[i] = { ...m, status: v as MedicationDraft["status"] };
                    update({ medications: next });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["active", "completed", "stopped", "on-hold", "intended", "unknown"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Allergies & intolerances</CardTitle>
          <Button variant="outline" size="sm" onClick={addAllergy}>
            <Plus className="mr-1 h-4 w-4" /> Add allergy
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.allergies.length === 0 && (
            <p className="text-sm text-muted-foreground">No allergies reported.</p>
          )}
          {draft.allergies.map((a, i) => (
            <div key={i} className="grid gap-3 rounded-md border p-3 md:grid-cols-5">
              <Field label="Substance">
                <Input
                  value={a.substance}
                  onChange={(e) => {
                    const next = [...draft.allergies];
                    next[i] = { ...a, substance: e.target.value };
                    update({ allergies: next });
                  }}
                />
              </Field>
              <Field label="Reaction">
                <Input
                  value={a.reaction}
                  onChange={(e) => {
                    const next = [...draft.allergies];
                    next[i] = { ...a, reaction: e.target.value };
                    update({ allergies: next });
                  }}
                />
              </Field>
              <Field label="Severity">
                <Select
                  value={a.severity}
                  onValueChange={(v) => {
                    const next = [...draft.allergies];
                    next[i] = { ...a, severity: v as AllergyDraft["severity"] };
                    update({ allergies: next });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Criticality">
                <Select
                  value={a.criticality}
                  onValueChange={(v) => {
                    const next = [...draft.allergies];
                    next[i] = { ...a, criticality: v as AllergyDraft["criticality"] };
                    update({ allergies: next });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="unable-to-assess">Unable to assess</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Family history</CardTitle>
          <Button variant="outline" size="sm" onClick={addFamily}>
            <Plus className="mr-1 h-4 w-4" /> Add family member
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.familyHistory.length === 0 && (
            <p className="text-sm text-muted-foreground">No family history entered.</p>
          )}
          {draft.familyHistory.map((f, i) => (
            <div key={i} className="grid gap-3 rounded-md border p-3 md:grid-cols-5">
              <Field label="Relationship">
                <Select
                  value={f.relationship}
                  onValueChange={(v) => {
                    const next = [...draft.familyHistory];
                    next[i] = { ...f, relationship: v };
                    update({ familyHistory: next });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FAMILY_RELATIONSHIPS.map((r) => (
                      <SelectItem key={r.code} value={r.code}>
                        {r.display}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Name (optional)">
                <Input
                  value={f.name}
                  onChange={(e) => {
                    const next = [...draft.familyHistory];
                    next[i] = { ...f, name: e.target.value };
                    update({ familyHistory: next });
                  }}
                />
              </Field>
              <Field label="Condition">
                <Input
                  value={f.condition}
                  onChange={(e) => {
                    const next = [...draft.familyHistory];
                    next[i] = { ...f, condition: e.target.value };
                    update({ familyHistory: next });
                  }}
                />
              </Field>
              <Field label="Note">
                <Input
                  value={f.note}
                  onChange={(e) => {
                    const next = [...draft.familyHistory];
                    next[i] = { ...f, note: e.target.value };
                    update({ familyHistory: next });
                  }}
                />
              </Field>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================ STEP 6 =============================== */

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{children}</CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1">
      <span className="text-xs uppercase tracking-wide text-muted-foreground/80">{label}</span>
      <span className="col-span-2 text-foreground">{value || <span className="text-muted-foreground">—</span>}</span>
    </div>
  );
}

function fmtAddress(a: AddressDraft): string {
  const parts = [a.line1, a.line2, a.city, a.state, a.postalCode, a.country].filter(Boolean);
  return parts.join(", ");
}

function Step6({
  draft,
  goTo,
  submission,
  setSubmission,
  onFinished,
}: {
  draft: IntakeDraft;
  goTo: (n: number) => void;
  submission: SubmissionState;
  setSubmission: (s: SubmissionState | ((prev: SubmissionState) => SubmissionState)) => void;
  onFinished: (patientId?: string) => void;
}) {
  const submitAll = async () => {
    await runSubmission({ draft, submission, setSubmission });
  };

  const successAll =
    submission.status === "success" ||
    (submission.results.length > 0 &&
      submission.results.every((r) => r.status === "ok" || r.status === "skipped"));

  return (
    <div className="space-y-4">
      <ReviewSection title="1 · Patient information" onEdit={() => goTo(1)}>
        <Row label="Name" value={`${draft.firstName} ${draft.lastName}`.trim()} />
        <Row label="Chosen name" value={draft.chosenName} />
        <Row label="Date of birth" value={draft.birthDate} />
        <Row label="Age" value={calcAge(draft.birthDate)} />
        <Row label="Gender" value={draft.gender} />
      </ReviewSection>

      <ReviewSection title="2 · Contact information" onEdit={() => goTo(2)}>
        <Row label="Phone" value={draft.phone} />
        <Row label="Occupation" value={draft.occupation} />
        <Row label="Billing address" value={fmtAddress(draft.billingAddress)} />
        <Row
          label="Current address"
          value={draft.sameAsBilling ? "Same as billing" : fmtAddress(draft.currentAddress)}
        />
        <Row
          label="Emergency contact"
          value={
            draft.emergencyContact.firstName || draft.emergencyContact.lastName
              ? `${draft.emergencyContact.firstName} ${draft.emergencyContact.lastName} · ${
                  RELATIONSHIP_CODES.find((r) => r.code === draft.emergencyContact.relationship)?.display ||
                  draft.emergencyContact.relationship
                } · ${draft.emergencyContact.phone}`
              : ""
          }
        />
      </ReviewSection>

      <ReviewSection title="3 · Preferences" onEdit={() => goTo(3)}>
        <Row label="Preferred pharmacy" value={draft.preferredPharmacy?.name} />
        <Row label="eRx pharmacy" value={draft.erxPharmacy?.name} />
        <Row label="Laboratory center" value={draft.laboratoryCenter?.name} />
        <Row label="Radiology center" value={draft.radiologyCenter?.name} />
        <Row label="Service location" value={draft.serviceLocation?.name} />
        <Row label="Primary care physician" value={draft.primaryCarePhysician?.name} />
      </ReviewSection>

      <ReviewSection title="4 · Insurance" onEdit={() => goTo(4)}>
        {(["primary", "secondary", "tertiary"] as const).map((k) => {
          const c = draft[k];
          const has = c.providerName || c.policyNumber;
          return (
            <div key={k} className="mb-2">
              <div className="mb-1 text-xs font-semibold uppercase text-foreground">{k}</div>
              {has ? (
                <>
                  <Row label="Provider" value={c.providerName} />
                  <Row label="Policy #" value={c.policyNumber} />
                  <Row label="Plan" value={c.plan} />
                  <Row label="Expires" value={c.expirationDate} />
                  <Row label="Copay" value={c.copay ? `$${c.copay}` : ""} />
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Not provided.</p>
              )}
            </div>
          );
        })}
      </ReviewSection>

      <ReviewSection title="5 · Clinical background" onEdit={() => goTo(5)}>
        <Row label="Chief complaint" value={draft.chiefComplaint} />
        <Row label="HPI" value={draft.hpi ? `${draft.hpi.slice(0, 200)}${draft.hpi.length > 200 ? "…" : ""}` : ""} />
        <Row label="Past conditions" value={`${draft.pastConditions.length}`} />
        <Row label="Medications" value={`${draft.medications.length}`} />
        <Row label="Allergies" value={`${draft.allergies.length}`} />
        <Row label="Family history" value={`${draft.familyHistory.length}`} />
      </ReviewSection>

      {submission.results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submission progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {submission.results.map((r) => (
              <div key={r.key} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  {r.status === "ok" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : r.status === "error" ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : r.status === "pending" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border" />
                  )}
                  <span>{r.label}</span>
                  <Badge variant="outline" className="ml-1 text-xs">
                    Step {r.section}
                  </Badge>
                </div>
                {r.status === "error" && (
                  <span className="ml-2 max-w-[50%] truncate text-xs text-destructive" title={r.error}>
                    {r.error}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-end gap-2">
        {submission.status === "partial" && (
          <Button variant="outline" onClick={submitAll} disabled={submission.status !== "partial" && submission.status !== "idle" as any}>
            Retry failed
          </Button>
        )}
        {!successAll && (
          <Button onClick={submitAll} disabled={submission.status === "submitting"}>
            {submission.status === "submitting" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
              <>Submit intake</>
            )}
          </Button>
        )}
        {successAll && (
          <Button onClick={() => onFinished(submission.patientId)}>Finish</Button>
        )}
      </div>
    </div>
  );
}

/* ---------------------- submission logic ---------------------- */

async function runSubmission({
  draft,
  submission,
  setSubmission,
}: {
  draft: IntakeDraft;
  submission: SubmissionState;
  setSubmission: (s: SubmissionState | ((prev: SubmissionState) => SubmissionState)) => void;
}) {
  // Build task list on first run; on retry we keep succeeded results.
  const initial = submission.results.length ? submission.results : buildTasks(draft);
  let patientId = submission.patientId;

  setSubmission({ status: "submitting", patientId, results: initial });

  const patch = (key: string, upd: Partial<SubmissionState["results"][number]>) =>
    setSubmission((prev) => ({
      ...prev,
      results: prev.results.map((r) => (r.key === key ? { ...r, ...upd } : r)),
    }));

  // 1. Patient (always first). If already created, reuse.
  if (!patientId) {
    patch("patient", { status: "pending" });
    try {
      const body = buildPatientResource(draft);
      const created = await createResource<any>("Patient", body);
      patientId = created.id;
      patch("patient", { status: "ok", id: created.id });
      setSubmission((prev) => ({ ...prev, patientId: created.id }));
    } catch (e: any) {
      patch("patient", { status: "error", error: e.message });
      setSubmission((prev) => ({ ...prev, status: "partial" }));
      return;
    }
  }

  // Ensure Organization ids for insurance payors (create if missing).
  const tiers: Array<[keyof IntakeDraft, InsuranceTierDraft, number]> = [
    ["primary", draft.primary, 1],
    ["secondary", draft.secondary, 2],
    ["tertiary", draft.tertiary, 3],
  ];

  const payorIds: Record<string, string> = {};
  for (const [key, tier] of tiers) {
    if (!tier.providerName) continue;
    const taskKey = `payor-${String(key)}`;
    if (submission.results.find((r) => r.key === taskKey && r.status === "ok")) continue;
    patch(taskKey, { status: "pending" });
    try {
      let id = tier.providerId;
      if (!id) {
        const created = await createResource<any>("Organization", {
          resourceType: "Organization",
          active: true,
          name: tier.providerName,
          type: [
            {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/organization-type",
                  code: "ins",
                  display: "Insurance Company",
                },
              ],
            },
          ],
        });
        id = created.id;
      }
      payorIds[String(key)] = id!;
      patch(taskKey, { status: "ok", id });
    } catch (e: any) {
      patch(taskKey, { status: "error", error: e.message });
    }
  }

  // Coverage per tier
  for (const [key, tier, order] of tiers) {
    if (!tier.providerName && !tier.policyNumber) continue;
    const taskKey = `coverage-${String(key)}`;
    if (submission.results.find((r) => r.key === taskKey && r.status === "ok")) continue;
    patch(taskKey, { status: "pending" });
    try {
      const payorId = payorIds[String(key)] || tier.providerId;
      const body: any = {
        resourceType: "Coverage",
        status: "active",
        order,
        beneficiary: { reference: `Patient/${patientId}` },
        subscriber: { reference: `Patient/${patientId}` },
        payor: payorId ? [{ reference: `Organization/${payorId}` }] : [{ display: tier.providerName }],
      };
      if (tier.policyNumber) body.subscriberId = tier.policyNumber;
      if (tier.expirationDate) body.period = { end: tier.expirationDate };
      if (tier.plan) body.class = [{ type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/coverage-class", code: "plan" }] }, value: tier.plan }];
      if (tier.copay) {
        body.costToBeneficiary = [
          {
            type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/coverage-copay-type", code: "copay" }] },
            valueMoney: { value: Number(tier.copay), currency: "USD" },
          },
        ];
      }
      const created = await createResource<any>("Coverage", body);
      patch(taskKey, { status: "ok", id: created.id });
    } catch (e: any) {
      patch(taskKey, { status: "error", error: e.message });
    }
  }

  // Chief complaint Condition (+ HPI as note)
  if (draft.chiefComplaint.trim()) {
    const taskKey = "chief-complaint";
    if (!submission.results.find((r) => r.key === taskKey && r.status === "ok")) {
      patch(taskKey, { status: "pending" });
      try {
        const body: any = {
          resourceType: "Condition",
          subject: { reference: `Patient/${patientId}` },
          category: [
            {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/condition-category",
                  code: "chief-complaint",
                  display: "Chief Complaint",
                },
              ],
            },
          ],
          code: { text: draft.chiefComplaint.trim() },
        };
        if (draft.hpi.trim()) body.note = [{ text: draft.hpi.trim() }];
        const created = await createResource<any>("Condition", body);
        patch(taskKey, { status: "ok", id: created.id });
      } catch (e: any) {
        patch(taskKey, { status: "error", error: e.message });
      }
    }
  }

  // Past conditions
  for (let i = 0; i < draft.pastConditions.length; i++) {
    const c = draft.pastConditions[i];
    if (!c.diagnosis.trim()) continue;
    const taskKey = `condition-${i}`;
    if (submission.results.find((r) => r.key === taskKey && r.status === "ok")) continue;
    patch(taskKey, { status: "pending" });
    try {
      const body: any = {
        resourceType: "Condition",
        subject: { reference: `Patient/${patientId}` },
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/condition-category",
                code: "problem-list-item",
                display: "Problem List Item",
              },
            ],
          },
        ],
        code: { text: c.diagnosis.trim() },
        clinicalStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
              code: c.resolved ? "resolved" : c.clinicalStatus,
            },
          ],
        },
      };
      if (c.onset) body.onsetDateTime = c.onset;
      const created = await createResource<any>("Condition", body);
      patch(taskKey, { status: "ok", id: created.id });
    } catch (e: any) {
      patch(taskKey, { status: "error", error: e.message });
    }
  }

  // Medications
  for (let i = 0; i < draft.medications.length; i++) {
    const m = draft.medications[i];
    if (!m.name.trim()) continue;
    const taskKey = `medication-${i}`;
    if (submission.results.find((r) => r.key === taskKey && r.status === "ok")) continue;
    patch(taskKey, { status: "pending" });
    try {
      const body: any = {
        resourceType: "MedicationStatement",
        status: m.status,
        subject: { reference: `Patient/${patientId}` },
        medicationCodeableConcept: { text: m.name.trim() },
      };
      if (m.dosage.trim()) body.dosage = [{ text: m.dosage.trim() }];
      const created = await createResource<any>("MedicationStatement", body);
      patch(taskKey, { status: "ok", id: created.id });
    } catch (e: any) {
      patch(taskKey, { status: "error", error: e.message });
    }
  }

  // Allergies
  for (let i = 0; i < draft.allergies.length; i++) {
    const a = draft.allergies[i];
    if (!a.substance.trim()) continue;
    const taskKey = `allergy-${i}`;
    if (submission.results.find((r) => r.key === taskKey && r.status === "ok")) continue;
    patch(taskKey, { status: "pending" });
    try {
      const body: any = {
        resourceType: "AllergyIntolerance",
        patient: { reference: `Patient/${patientId}` },
        code: { text: a.substance.trim() },
      };
      if (a.criticality) body.criticality = a.criticality;
      if (a.reaction.trim() || a.severity) {
        body.reaction = [
          {
            manifestation: [{ text: a.reaction.trim() || a.substance.trim() }],
            ...(a.severity ? { severity: a.severity } : {}),
          },
        ];
      }
      const created = await createResource<any>("AllergyIntolerance", body);
      patch(taskKey, { status: "ok", id: created.id });
    } catch (e: any) {
      patch(taskKey, { status: "error", error: e.message });
    }
  }

  // Family history
  for (let i = 0; i < draft.familyHistory.length; i++) {
    const f = draft.familyHistory[i];
    if (!f.relationship && !f.condition.trim()) continue;
    const taskKey = `family-${i}`;
    if (submission.results.find((r) => r.key === taskKey && r.status === "ok")) continue;
    patch(taskKey, { status: "pending" });
    try {
      const relDisplay =
        FAMILY_RELATIONSHIPS.find((r) => r.code === f.relationship)?.display || f.relationship;
      const body: any = {
        resourceType: "FamilyMemberHistory",
        status: "completed",
        patient: { reference: `Patient/${patientId}` },
        relationship: {
          coding: f.relationship
            ? [
                {
                  system: "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
                  code: f.relationship,
                  display: relDisplay,
                },
              ]
            : undefined,
          text: relDisplay,
        },
      };
      if (f.name.trim()) body.name = f.name.trim();
      if (f.condition.trim()) {
        body.condition = [
          {
            code: { text: f.condition.trim() },
            ...(f.note.trim() ? { note: [{ text: f.note.trim() }] } : {}),
          },
        ];
      }
      const created = await createResource<any>("FamilyMemberHistory", body);
      patch(taskKey, { status: "ok", id: created.id });
    } catch (e: any) {
      patch(taskKey, { status: "error", error: e.message });
    }
  }

  // Occupation Observation
  if (draft.occupation.trim()) {
    const taskKey = "occupation";
    if (!submission.results.find((r) => r.key === taskKey && r.status === "ok")) {
      patch(taskKey, { status: "pending" });
      try {
        const body: any = {
          resourceType: "Observation",
          status: "final",
          category: [
            {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/observation-category",
                  code: "social-history",
                  display: "Social History",
                },
              ],
            },
          ],
          code: {
            coding: [
              { system: "http://loinc.org", code: "85658-3", display: "Occupation" },
            ],
            text: "Occupation",
          },
          subject: { reference: `Patient/${patientId}` },
          effectiveDateTime: new Date().toISOString(),
          valueString: draft.occupation.trim(),
        };
        const created = await createResource<any>("Observation", body);
        patch(taskKey, { status: "ok", id: created.id });
      } catch (e: any) {
        patch(taskKey, { status: "error", error: e.message });
      }
    }
  }

  // Final status
  setSubmission((prev) => {
    const anyError = prev.results.some((r) => r.status === "error");
    return { ...prev, status: anyError ? "partial" : "success" };
  });
}

function buildTasks(draft: IntakeDraft): SubmissionState["results"] {
  const tasks: SubmissionState["results"] = [];
  tasks.push({ key: "patient", label: "Patient", section: 1, status: "pending" });
  (["primary", "secondary", "tertiary"] as const).forEach((k) => {
    const t = draft[k];
    if (t.providerName && !t.providerId) {
      tasks.push({ key: `payor-${k}`, label: `Insurance payor Organization (${k})`, section: 4, status: "pending" });
    }
    if (t.providerName || t.policyNumber) {
      tasks.push({ key: `coverage-${k}`, label: `Coverage (${k})`, section: 4, status: "pending" });
    }
  });
  if (draft.chiefComplaint.trim())
    tasks.push({ key: "chief-complaint", label: "Chief complaint Condition", section: 5, status: "pending" });
  draft.pastConditions.forEach((c, i) => {
    if (c.diagnosis.trim())
      tasks.push({ key: `condition-${i}`, label: `Condition: ${c.diagnosis}`, section: 5, status: "pending" });
  });
  draft.medications.forEach((m, i) => {
    if (m.name.trim())
      tasks.push({ key: `medication-${i}`, label: `MedicationStatement: ${m.name}`, section: 5, status: "pending" });
  });
  draft.allergies.forEach((a, i) => {
    if (a.substance.trim())
      tasks.push({ key: `allergy-${i}`, label: `AllergyIntolerance: ${a.substance}`, section: 5, status: "pending" });
  });
  draft.familyHistory.forEach((f, i) => {
    if (f.relationship || f.condition.trim())
      tasks.push({
        key: `family-${i}`,
        label: `FamilyMemberHistory: ${FAMILY_RELATIONSHIPS.find((r) => r.code === f.relationship)?.display || f.relationship || "member"}`,
        section: 5,
        status: "pending",
      });
  });
  if (draft.occupation.trim())
    tasks.push({ key: "occupation", label: "Occupation Observation", section: 2, status: "pending" });
  return tasks;
}

function buildPatientResource(d: IntakeDraft) {
  const names: any[] = [
    {
      use: "official",
      given: [d.firstName.trim()].filter(Boolean),
      family: d.lastName.trim() || undefined,
    },
  ];
  if (d.chosenName.trim()) {
    names.push({ use: "usual", given: [d.chosenName.trim()] });
  }

  const addresses: any[] = [];
  const billing = toFhirAddress(d.billingAddress, "billing");
  if (billing) addresses.push(billing);
  const current = toFhirAddress(d.sameAsBilling ? d.billingAddress : d.currentAddress, "home");
  if (current) addresses.push(current);

  const telecom: any[] = [];
  if (d.phone.trim()) telecom.push({ system: "phone", value: d.phone.trim(), use: "mobile" });

  const contact: any[] = [];
  if (
    d.emergencyContact.firstName.trim() ||
    d.emergencyContact.lastName.trim() ||
    d.emergencyContact.phone.trim()
  ) {
    const relDisplay =
      RELATIONSHIP_CODES.find((r) => r.code === d.emergencyContact.relationship)?.display ||
      d.emergencyContact.relationship;
    contact.push({
      relationship: d.emergencyContact.relationship
        ? [
            {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/v2-0131",
                  code: d.emergencyContact.relationship,
                  display: relDisplay,
                },
              ],
              text: relDisplay,
            },
          ]
        : undefined,
      name: {
        given: [d.emergencyContact.firstName.trim()].filter(Boolean),
        family: d.emergencyContact.lastName.trim() || undefined,
      },
      telecom: d.emergencyContact.phone.trim()
        ? [{ system: "phone", value: d.emergencyContact.phone.trim() }]
        : undefined,
    });
  }

  const extensions: any[] = [];
  if (d.gender) {
    extensions.push({
      url: "http://hl7.org/fhir/StructureDefinition/patient-genderIdentity",
      valueCodeableConcept: { text: d.gender },
    });
  }

  const body: any = {
    resourceType: "Patient",
    active: true,
    name: names,
    gender: mapGender(d.gender),
    birthDate: d.birthDate || undefined,
    telecom: telecom.length ? telecom : undefined,
    address: addresses.length ? addresses : undefined,
    contact: contact.length ? contact : undefined,
    extension: extensions.length ? extensions : undefined,
  };

  if (d.primaryCarePhysician?.id) {
    body.generalPractitioner = [{ reference: `Practitioner/${d.primaryCarePhysician.id}` }];
  }
  return body;
}

function toFhirAddress(a: AddressDraft, use: "billing" | "home") {
  const line = [a.line1, a.line2].map((s) => s.trim()).filter(Boolean);
  if (!line.length && !a.city && !a.state && !a.postalCode && !a.country) return null;
  return {
    use,
    line: line.length ? line : undefined,
    city: a.city || undefined,
    state: a.state || undefined,
    postalCode: a.postalCode || undefined,
    country: a.country || undefined,
  };
}

/* ------------------------------ Field ------------------------------ */

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
