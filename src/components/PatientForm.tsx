import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FhirPatient } from "@/lib/fhir";

interface Props {
  initial?: FhirPatient | null;
  onSubmit: (p: FhirPatient) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

type Gender = "male" | "female" | "other" | "unknown";

export function PatientForm({ initial, onSubmit, onCancel, submitting }: Props) {
  const [given, setGiven] = useState("");
  const [family, setFamily] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [birthDate, setBirthDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setGiven(initial?.name?.[0]?.given?.join(" ") ?? "");
    setFamily(initial?.name?.[0]?.family ?? "");
    setGender((initial?.gender as Gender) ?? "");
    setBirthDate(initial?.birthDate ?? "");
    setErrors({});
  }, [initial]);

  const today = new Date().toISOString().slice(0, 10);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!given.trim()) e.given = "Given name is required";
    if (!family.trim()) e.family = "Family name is required";
    if (!gender) e.gender = "Gender is required";
    if (!birthDate) e.birthDate = "Date of birth is required";
    else if (birthDate > today) e.birthDate = "Date of birth cannot be in the future";
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) e.birthDate = "Use YYYY-MM-DD format";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const patient: FhirPatient = {
      resourceType: "Patient",
      ...(initial?.id ? { id: initial.id } : {}),
      name: [
        {
          given: given.trim().split(/\s+/),
          family: family.trim(),
        },
      ],
      gender: gender as Gender,
      birthDate,
    };
    await onSubmit(patient);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="given">Given name(s)</Label>
          <Input
            id="given"
            value={given}
            onChange={(e) => setGiven(e.target.value)}
            placeholder="Jane"
          />
          {errors.given && <p className="text-sm text-destructive">{errors.given}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="family">Family name</Label>
          <Input
            id="family"
            value={family}
            onChange={(e) => setFamily(e.target.value)}
            placeholder="Doe"
          />
          {errors.family && <p className="text-sm text-destructive">{errors.family}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthDate">Date of birth</Label>
          <Input
            id="birthDate"
            type="date"
            max={today}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
          {errors.birthDate && <p className="text-sm text-destructive">{errors.birthDate}</p>}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : initial?.id ? "Update patient" : "Create patient"}
        </Button>
      </div>
    </form>
  );
}
