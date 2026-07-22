import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PatientPicker, type PatientRef } from "@/components/PatientPicker";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PatientSearchDialog({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [, setValue] = useState<PatientRef | null>(null);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Search patient</DialogTitle>
          <DialogDescription>Find a patient by given name, family name, or any name.</DialogDescription>
        </DialogHeader>
        <PatientPicker
          value={null}
          autoFocus
          onChange={(v) => {
            if (!v) return;
            setValue(v);
            onClose();
            navigate({ to: "/patients/$id", params: { id: v.id } });
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
