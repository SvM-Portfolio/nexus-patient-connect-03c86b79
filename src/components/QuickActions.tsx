import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pill, FlaskConical, Stethoscope, FileText } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createResource } from "@/lib/fhir";

type ActionType = "medication" | "lab" | "procedure" | "note" | null;

export function QuickActions({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const [action, setAction] = useState<ActionType>(null);
  const close = () => setAction(null);

  const invalidateFor = (types: string[]) => {
    types.forEach((t) => qc.invalidateQueries({ queryKey: [t] }));
  };

  const orderMed = useMutation({
    mutationFn: async (data: { name: string; dosage: string; rxnorm: string }) =>
      createResource("MedicationRequest", {
        resourceType: "MedicationRequest",
        status: "active",
        intent: "order",
        subject: { reference: `Patient/${patientId}` },
        authoredOn: new Date().toISOString(),
        medicationCodeableConcept: {
          coding: data.rxnorm
            ? [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: data.rxnorm, display: data.name }]
            : undefined,
          text: data.name,
        },
        dosageInstruction: data.dosage ? [{ text: data.dosage }] : undefined,
      }),
    onSuccess: () => {
      toast.success("Medication ordered");
      invalidateFor(["MedicationRequest"]);
      close();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const orderLab = useMutation({
    mutationFn: async (data: { name: string; loinc: string; priority: string; note: string }) =>
      createResource("ServiceRequest", {
        resourceType: "ServiceRequest",
        status: "active",
        intent: "order",
        priority: data.priority || "routine",
        category: [{ coding: [{ system: "http://snomed.info/sct", code: "108252007", display: "Laboratory procedure" }] }],
        subject: { reference: `Patient/${patientId}` },
        authoredOn: new Date().toISOString(),
        code: {
          coding: data.loinc
            ? [{ system: "http://loinc.org", code: data.loinc, display: data.name }]
            : undefined,
          text: data.name,
        },
        note: data.note ? [{ text: data.note }] : undefined,
      }),
    onSuccess: () => {
      toast.success("Lab ordered");
      invalidateFor(["ServiceRequest"]);
      close();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const orderProc = useMutation({
    mutationFn: async (data: { name: string; snomed: string; when: string; note: string }) =>
      createResource("ServiceRequest", {
        resourceType: "ServiceRequest",
        status: "active",
        intent: "order",
        category: [{ coding: [{ system: "http://snomed.info/sct", code: "387713003", display: "Surgical procedure" }] }],
        subject: { reference: `Patient/${patientId}` },
        authoredOn: new Date().toISOString(),
        occurrenceDateTime: data.when || undefined,
        code: {
          coding: data.snomed
            ? [{ system: "http://snomed.info/sct", code: data.snomed, display: data.name }]
            : undefined,
          text: data.name,
        },
        note: data.note ? [{ text: data.note }] : undefined,
      }),
    onSuccess: () => {
      toast.success("Procedure ordered");
      invalidateFor(["ServiceRequest", "Procedure"]);
      close();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addNote = useMutation({
    mutationFn: async (text: string) =>
      createResource("DocumentReference", {
        resourceType: "DocumentReference",
        status: "current",
        subject: { reference: `Patient/${patientId}` },
        date: new Date().toISOString(),
        description: "Clinical note",
        content: [
          {
            attachment: {
              contentType: "text/plain",
              data: btoa(unescape(encodeURIComponent(text))),
            },
          },
        ],
      }),
    onSuccess: () => {
      toast.success("Clinical note added");
      invalidateFor(["DocumentReference"]);
      close();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg"
            aria-label="Quick actions"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56">
          <DropdownMenuItem onClick={() => setAction("medication")}>
            <Pill className="mr-2 h-4 w-4" /> Order Medication
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAction("lab")}>
            <FlaskConical className="mr-2 h-4 w-4" /> Order Laboratory Test
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAction("procedure")}>
            <Stethoscope className="mr-2 h-4 w-4" /> Order Procedure
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAction("note")}>
            <FileText className="mr-2 h-4 w-4" /> Add Clinical Note
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <MedicationSheet
        open={action === "medication"}
        onClose={close}
        onSubmit={(d) => orderMed.mutate(d)}
        submitting={orderMed.isPending}
      />
      <LabSheet
        open={action === "lab"}
        onClose={close}
        onSubmit={(d) => orderLab.mutate(d)}
        submitting={orderLab.isPending}
      />
      <ProcedureSheet
        open={action === "procedure"}
        onClose={close}
        onSubmit={(d) => orderProc.mutate(d)}
        submitting={orderProc.isPending}
      />
      <NoteSheet
        open={action === "note"}
        onClose={close}
        onSubmit={(t) => addNote.mutate(t)}
        submitting={addNote.isPending}
      />
    </>
  );
}

function MedicationSheet({
  open, onClose, onSubmit, submitting,
}: { open: boolean; onClose: () => void; onSubmit: (d: { name: string; dosage: string; rxnorm: string }) => void; submitting: boolean }) {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [rxnorm, setRxnorm] = useState("");
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Order medication</SheetTitle>
          <SheetDescription>Creates a MedicationRequest.</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4">
          <div className="space-y-1"><Label>Medication</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Lisinopril 10mg" /></div>
          <div className="space-y-1"><Label>RxNorm code (optional)</Label>
            <Input value={rxnorm} onChange={(e) => setRxnorm(e.target.value)} placeholder="314076" /></div>
          <div className="space-y-1"><Label>Dosage instructions</Label>
            <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="1 tablet by mouth daily" /></div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button disabled={!name.trim() || submitting} onClick={() => onSubmit({ name: name.trim(), dosage: dosage.trim(), rxnorm: rxnorm.trim() })}>
            {submitting ? "Ordering…" : "Order"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function LabSheet({
  open, onClose, onSubmit, submitting,
}: { open: boolean; onClose: () => void; onSubmit: (d: { name: string; loinc: string; priority: string; note: string }) => void; submitting: boolean }) {
  const [name, setName] = useState("");
  const [loinc, setLoinc] = useState("");
  const [priority, setPriority] = useState("routine");
  const [note, setNote] = useState("");
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Order laboratory test</SheetTitle>
          <SheetDescription>Creates a ServiceRequest (laboratory).</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4">
          <div className="space-y-1"><Label>Test name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Complete Blood Count" /></div>
          <div className="space-y-1"><Label>LOINC code (optional)</Label>
            <Input value={loinc} onChange={(e) => setLoinc(e.target.value)} placeholder="58410-2" /></div>
          <div className="space-y-1"><Label>Priority</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="asap">ASAP</option>
              <option value="stat">STAT</option>
            </select></div>
          <div className="space-y-1"><Label>Clinical note</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} /></div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button disabled={!name.trim() || submitting} onClick={() => onSubmit({ name: name.trim(), loinc: loinc.trim(), priority, note: note.trim() })}>
            {submitting ? "Ordering…" : "Order"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ProcedureSheet({
  open, onClose, onSubmit, submitting,
}: { open: boolean; onClose: () => void; onSubmit: (d: { name: string; snomed: string; when: string; note: string }) => void; submitting: boolean }) {
  const [name, setName] = useState("");
  const [snomed, setSnomed] = useState("");
  const [when, setWhen] = useState("");
  const [note, setNote] = useState("");
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Order procedure</SheetTitle>
          <SheetDescription>Creates a ServiceRequest (procedure).</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4">
          <div className="space-y-1"><Label>Procedure</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Colonoscopy" /></div>
          <div className="space-y-1"><Label>SNOMED code (optional)</Label>
            <Input value={snomed} onChange={(e) => setSnomed(e.target.value)} placeholder="73761001" /></div>
          <div className="space-y-1"><Label>Scheduled for</Label>
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></div>
          <div className="space-y-1"><Label>Clinical note</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} /></div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button disabled={!name.trim() || submitting} onClick={() => onSubmit({ name: name.trim(), snomed: snomed.trim(), when: when ? new Date(when).toISOString() : "", note: note.trim() })}>
            {submitting ? "Ordering…" : "Order"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function NoteSheet({
  open, onClose, onSubmit, submitting,
}: { open: boolean; onClose: () => void; onSubmit: (t: string) => void; submitting: boolean }) {
  const [text, setText] = useState("");
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add clinical note</SheetTitle>
          <SheetDescription>Creates a DocumentReference.</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder="Progress note…" />
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button disabled={!text.trim() || submitting} onClick={() => onSubmit(text.trim())}>
            {submitting ? "Saving…" : "Save note"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
