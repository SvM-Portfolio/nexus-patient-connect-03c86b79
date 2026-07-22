import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FlaskConical, Pill, StickyNote } from "lucide-react";
import { PatientPicker, type PatientRef } from "@/components/PatientPicker";
import { PractitionerPicker } from "@/components/ResourcePicker";
import type { PractitionerRef } from "@/lib/intake-draft";
import { createResource } from "@/lib/fhir";
import { logActivity } from "@/lib/activity";

export type QuickActionKind = "lab" | "medication" | "note" | null;

interface Props {
  kind: QuickActionKind;
  onClose: () => void;
}

const LAB_PRESETS = [
  { code: "58410-2", display: "Complete Blood Count (CBC)", category: "laboratory" },
  { code: "24323-8", display: "Comprehensive Metabolic Panel", category: "laboratory" },
  { code: "2093-3", display: "Lipid Panel", category: "laboratory" },
  { code: "4548-4", display: "Hemoglobin A1c", category: "laboratory" },
  { code: "3016-3", display: "Thyroid Stimulating Hormone (TSH)", category: "laboratory" },
  { code: "5811-5", display: "Urinalysis", category: "laboratory" },
  { code: "24627-2", display: "Chest X-Ray", category: "imaging" },
  { code: "24725-4", display: "CT Head w/o contrast", category: "imaging" },
  { code: "24590-2", display: "MRI Brain", category: "imaging" },
  { code: "45036003", display: "Abdominal Ultrasound", category: "imaging" },
];

export function QuickActionDialog({ kind, onClose }: Props) {
  const qc = useQueryClient();
  const open = kind !== null;
  const [patient, setPatient] = useState<PatientRef | null>(null);
  const [provider, setProvider] = useState<PractitionerRef | null>(null);
  const [testCode, setTestCode] = useState<string>(LAB_PRESETS[0].code);
  const [testType, setTestType] = useState<"laboratory" | "imaging">("laboratory");
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setPatient(null);
      setProvider(null);
      setMedication("");
      setDosage("");
      setNoteTitle("");
      setNoteText("");
      setNotes("");
      setTestCode(LAB_PRESETS[0].code);
      setTestType("laboratory");
      setSubmitting(false);
    }
  }, [open]);

  const meta =
    kind === "lab"
      ? { title: "Order lab or imaging test", icon: FlaskConical, verb: "Order" }
      : kind === "medication"
        ? { title: "Prescribe medication", icon: Pill, verb: "Prescribe" }
        : { title: "Add clinical note", icon: StickyNote, verb: "Save note" };

  const relevantPresets = LAB_PRESETS.filter((p) => p.category === testType);
  const selectedPreset = LAB_PRESETS.find((p) => p.code === testCode);

  async function handleSubmit() {
    if (!patient) return toast.error("Please select a patient");
    setSubmitting(true);
    try {
      if (kind === "lab") {
        if (!selectedPreset) return;
        await createResource("ServiceRequest", {
          resourceType: "ServiceRequest",
          status: "active",
          intent: "order",
          priority: "routine",
          category: [
            {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/service-category",
                  code: testType === "imaging" ? "363679005" : "108252007",
                  display: testType === "imaging" ? "Imaging" : "Laboratory procedure",
                },
              ],
            },
          ],
          code: {
            coding: [{ system: "http://loinc.org", code: selectedPreset.code, display: selectedPreset.display }],
            text: selectedPreset.display,
          },
          subject: { reference: `Patient/${patient.id}`, display: patient.name },
          requester: provider
            ? { reference: `Practitioner/${provider.id}`, display: provider.name }
            : undefined,
          authoredOn: new Date().toISOString(),
          note: notes ? [{ text: notes }] : undefined,
        });
        await logActivity({
          type: "lab-order",
          action: `${testType === "imaging" ? "Ordered imaging" : "Ordered lab test"}`,
          description: `${selectedPreset.display} for ${patient.name}`,
          patientId: patient.id,
          patientName: patient.name,
          actor: provider?.name,
        });
        qc.invalidateQueries({ queryKey: ["lab-orders"] });
        toast.success("Order created", {
          description: `${selectedPreset.display} for ${patient.name} added to Pending Reports.`,
        });
      } else if (kind === "medication") {
        if (!medication.trim()) {
          setSubmitting(false);
          return toast.error("Enter a medication name");
        }
        await createResource("MedicationRequest", {
          resourceType: "MedicationRequest",
          status: "active",
          intent: "order",
          medicationCodeableConcept: { text: medication.trim() },
          subject: { reference: `Patient/${patient.id}`, display: patient.name },
          requester: provider
            ? { reference: `Practitioner/${provider.id}`, display: provider.name }
            : undefined,
          authoredOn: new Date().toISOString(),
          dosageInstruction: dosage.trim() ? [{ text: dosage.trim() }] : undefined,
          note: notes ? [{ text: notes }] : undefined,
        });
        await logActivity({
          type: "medication-order",
          action: "Prescribed medication",
          description: `${medication.trim()}${dosage ? ` (${dosage})` : ""} for ${patient.name}`,
          patientId: patient.id,
          patientName: patient.name,
          actor: provider?.name,
        });
        qc.invalidateQueries({ queryKey: ["medications", patient.id] });
        toast.success("Prescription created", {
          description: `${medication.trim()} for ${patient.name}.`,
        });
      } else if (kind === "note") {
        if (!noteText.trim()) {
          setSubmitting(false);
          return toast.error("Enter note content");
        }
        const title = noteTitle.trim() || "Clinical note";
        await createResource("DocumentReference", {
          resourceType: "DocumentReference",
          status: "current",
          docStatus: "final",
          type: {
            coding: [{ system: "http://loinc.org", code: "11506-3", display: "Progress note" }],
            text: title,
          },
          subject: { reference: `Patient/${patient.id}`, display: patient.name },
          author: provider
            ? [{ reference: `Practitioner/${provider.id}`, display: provider.name }]
            : undefined,
          date: new Date().toISOString(),
          description: title,
          content: [
            {
              attachment: {
                contentType: "text/plain",
                data:
                  typeof btoa === "function"
                    ? btoa(unescape(encodeURIComponent(noteText.trim())))
                    : Buffer.from(noteText.trim(), "utf-8").toString("base64"),
              },
            },
          ],
        });
        await logActivity({
          type: "clinical-note",
          action: "Added clinical note",
          description: `${title} for ${patient.name}`,
          patientId: patient.id,
          patientName: patient.name,
          actor: provider?.name,
        });
        qc.invalidateQueries({ queryKey: ["documents", patient.id] });
        toast.success("Clinical note saved", { description: `${title} for ${patient.name}.` });
      }
      onClose();
    } catch (e: any) {
      toast.error("Failed to submit", { description: e.message ?? String(e) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <meta.icon className="h-5 w-5 text-primary" /> {meta.title}
          </DialogTitle>
          <DialogDescription>
            Choose a patient and fill the details. This creates a real FHIR resource.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <PatientPicker value={patient} onChange={setPatient} autoFocus />

          {kind === "lab" && (
            <>
              <div className="space-y-1.5">
                <Label>Test type</Label>
                <div className="flex gap-2 text-sm">
                  {(["laboratory", "imaging"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTestType(t);
                        const first = LAB_PRESETS.find((p) => p.category === t);
                        if (first) setTestCode(first.code);
                      }}
                      className={`rounded-lg px-3 py-1.5 capitalize ${
                        testType === t
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lab-preset">Test</Label>
                <select
                  id="lab-preset"
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {relevantPresets.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.display}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {kind === "medication" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="med-name">Medication</Label>
                <Input
                  id="med-name"
                  value={medication}
                  onChange={(e) => setMedication(e.target.value)}
                  placeholder="e.g. Amoxicillin 500mg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="med-dose">Dosage instructions</Label>
                <Input
                  id="med-dose"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 1 tablet 3× daily for 7 days"
                />
              </div>
            </>
          )}

          {kind === "note" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Progress note"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note-body">Note</Label>
                <Textarea
                  id="note-body"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={5}
                  placeholder="Subjective, objective, assessment, plan…"
                />
              </div>
            </>
          )}

          <PractitionerPicker label="Referred by / Provider" value={provider} onChange={setProvider} />

          {kind !== "note" && (
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Optional clinical context…"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !patient}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />} {meta.verb}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
