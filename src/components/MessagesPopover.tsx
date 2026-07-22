import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { searchResources } from "@/lib/fhir";

interface Communication {
  id: string;
  status?: string;
  sent?: string;
  payload?: { contentString?: string }[];
  sender?: { display?: string };
  category?: any[];
}

export function MessagesPopover() {
  const { data, isLoading } = useQuery({
    queryKey: ["msgs-popover"],
    queryFn: () =>
      searchResources<Communication>("Communication", {
        _sort: "-sent",
        _count: "8",
      }),
    staleTime: 30_000,
  });

  const unread = (data ?? []).filter((c) => c.status !== "completed").length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground" title="Messages">
          <MessageSquare className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-info px-1 text-[9px] font-bold text-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] rounded-2xl border-border/60 bg-popover/95 p-0 shadow-2xl backdrop-blur-xl"
      >
        <div className="border-b border-border/50 px-4 py-3">
          <div className="text-sm font-semibold">Messages</div>
          <div className="text-[11px] text-muted-foreground">{unread} unread</div>
        </div>
        <div className="max-h-[360px] overflow-auto p-2">
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
            </div>
          )}
          {!isLoading && (!data || data.length === 0) && (
            <div className="px-3 py-4 text-xs text-muted-foreground">No messages.</div>
          )}
          {data?.map((c) => (
            <div key={c.id} className="rounded-md px-3 py-2 hover:bg-accent/50">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{c.sender?.display ?? "—"}</span>
                <span>{c.sent ? new Date(c.sent).toLocaleDateString() : ""}</span>
              </div>
              <div className="truncate text-sm">
                {c.payload?.[0]?.contentString ?? "(no content)"}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
