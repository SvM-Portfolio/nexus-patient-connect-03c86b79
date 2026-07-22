import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Send, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchResources, createResource } from "@/lib/fhir";
import { toast } from "sonner";

interface Communication {
  id: string;
  status?: string;
  category?: { text?: string; coding?: { code?: string; display?: string }[] }[];
}

const CATEGORIES = [
  { key: "notification", label: "New messages" },
  { key: "instruction", label: "Care coordination" },
  { key: "reminder", label: "Active conversations" },
  { key: "alert", label: "Phone messages" },
  { key: "task", label: "Assigned actions" },
  { key: "direct", label: "Direct messages" },
  { key: "patient-action", label: "Patient action management" },
  { key: "care-coordination", label: "Care coordination mgmt" },
];

export function MessagesPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["messages-panel"],
    queryFn: () => searchResources<Communication>("Communication", { _count: "200" }),
    staleTime: 30_000,
    retry: 2,
  });

  const counts = CATEGORIES.map((c) => {
    const items = (data ?? []).filter((m) =>
      m.category?.some(
        (cat) =>
          cat.coding?.some((cd) => cd.code === c.key) ||
          cat.text?.toLowerCase().includes(c.key.split("-")[0]),
      ),
    );
    return {
      ...c,
      count: items.length,
      unread: items.filter((m) => m.status !== "completed").length,
    };
  });

  return (
    <GlassCard
      accent="info"
      title="Messages"
      action={<CreateMessageButton />}
    >
      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="mt-2 divide-y divide-border/50">
          {counts.map((c) => (
            <div key={c.key} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${c.unread ? "bg-accent-info" : "bg-border"}`}
                />
                <span className="text-sm">{c.label}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold tabular-nums">{c.count}</span>
                {c.unread > 0 && (
                  <span className="text-[10px] font-medium text-accent-info">{c.unread} new</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

function CreateMessageButton() {
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    try {
      await createResource("Communication", {
        resourceType: "Communication",
        status: "in-progress",
        sent: new Date().toISOString(),
        recipient: recipient ? [{ display: recipient }] : undefined,
        topic: subject ? { text: subject } : undefined,
        payload: [{ contentString: body }],
      });
      toast.success("Message sent");
      setOpen(false);
      setRecipient("");
      setSubject("");
      setBody("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="secondary" className="h-7 gap-1 text-xs">
          <Plus className="h-3 w-3" /> New
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>New message</SheetTitle>
          <SheetDescription>Compose a message. Sends a FHIR Communication resource.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-1">
            <Label>Recipient</Label>
            <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Provider or patient name" />
          </div>
          <div className="space-y-1">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Message</Label>
            <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <Button onClick={send} disabled={sending || !body.trim()} className="w-full">
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send message
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
