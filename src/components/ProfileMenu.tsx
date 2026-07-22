import { useNavigate } from "@tanstack/react-router";
import { UserCircle2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveRole } from "@/hooks/useActiveRole";

export function ProfileMenu() {
  const { role, setRole, roles } = useActiveRole();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          title="Account"
        >
          <UserCircle2 className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-56 rounded-xl border-border/60 bg-popover/95 backdrop-blur-xl"
      >
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Signed in as
          <div className="text-sm font-semibold text-foreground">Dr. Provider</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Switch workspace
        </DropdownMenuLabel>
        {roles.map((r) => (
          <DropdownMenuItem
            key={r.id}
            onClick={() => {
              setRole(r.id);
              navigate({ to: r.path });
            }}
            className="flex items-center justify-between"
          >
            <span>{r.label}</span>
            {role === r.id && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>Profile settings</DropdownMenuItem>
        <DropdownMenuItem disabled>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
