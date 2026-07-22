import { useQuery } from "@tanstack/react-query";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { searchResources } from "@/lib/fhir";

interface Task {
  id: string;
  status?: string;
  description?: string;
  priority?: string;
  authoredOn?: string;
}

export function NotificationsPopover() {
  const { data, isLoading } = useQuery({
    queryKey: ["notifications-popover"],
    queryFn: () =>
      searchResources<Task>("Task", { status: "requested", _sort: "-authored-on", _count: "8" }),
    staleTime: 30_000,
  });

  const count = data?.length ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-muted-foreground"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-conditions px-1 text-[9px] font-bold text-foreground">
              {count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[340px] rounded-2xl border-border/60 bg-popover/95 p-0 shadow-2xl backdrop-blur-xl"
      >
        <div className="border-b border-border/50 px-4 py-3">
          <div className="text-sm font-semibold">Notifications</div>
          <div className="text-[11px] text-muted-foreground">Pending tasks & alerts</div>
        </div>
        <div className="max-h-[320px] overflow-auto p-2">
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
            </div>
          )}
          {!isLoading && count === 0 && (
            <div className="px-3 py-4 text-xs text-muted-foreground">You're all caught up.</div>
          )}
          {data?.map((t) => (
            <div key={t.id} className="rounded-md px-3 py-2 hover:bg-accent/50">
              <div className="truncate text-sm">{t.description ?? "Task"}</div>
              <div className="text-[11px] text-muted-foreground">
                {t.priority ?? "routine"} · {t.authoredOn ? new Date(t.authoredOn).toLocaleDateString() : ""}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
