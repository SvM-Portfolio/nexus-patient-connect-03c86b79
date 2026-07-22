import { type ReactNode } from "react";
import { Link, useMatches, useRouter } from "@tanstack/react-router";
import {
  Home,
  Activity,
  ChevronRight,
  FileText,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { GlobalSearch } from "./GlobalSearch";
import { CalendarPopover } from "./CalendarPopover";
import { MessagesPopover } from "./MessagesPopover";
import { NotificationsPopover } from "./NotificationsPopover";
import { ProfileMenu } from "./ProfileMenu";
import { useActiveRole } from "@/hooks/useActiveRole";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

function useBreadcrumbs() {
  const matches = useMatches();
  return matches
    .filter((m) => m.pathname !== "/" && !m.pathname.startsWith("/__"))
    .map((m) => {
      const seg = m.pathname.split("/").filter(Boolean).pop() ?? "";
      const label = seg
        .replace(/-/g, " ")
        .replace(/\$/g, "")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return { path: m.pathname, label: label || "Home" };
    });
}

export function AppShell({ children }: { children: ReactNode }) {
  const { dashboardPath } = useActiveRole();
  const router = useRouter();
  const crumbs = useBreadcrumbs();
  const isDashboard =
    router.state.location.pathname.startsWith("/dashboard/");

  return (
    <div className="min-h-screen">
      <Toaster />
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-24 h-[28rem] w-[28rem] rounded-full bg-[color:var(--accent-info)]/15 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[26rem] w-[26rem] rounded-full bg-[color:var(--accent-medications)]/12 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-2xl dark:border-border dark:bg-card/70">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 md:px-8">
          {/* Left */}
          <div className="flex items-center gap-2">
            <Link
              to={dashboardPath}
              className="flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-accent/50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-info text-primary-foreground shadow-sm">
                <Activity className="h-4 w-4" />
              </div>
              <div className="hidden leading-tight sm:block">
                <div className="text-sm font-semibold tracking-tight">Nexus Pro</div>
              </div>
            </Link>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              title="Home"
            >
              <Link to={dashboardPath}>
                <Home className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-8 gap-1.5 px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              title="Patient Records"
            >
              <Link to="/patients">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Patient Records</span>
              </Link>
            </Button>
            {!isDashboard && crumbs.length > 0 && (
              <nav
                aria-label="Breadcrumb"
                className="hidden items-center gap-1 pl-1 text-xs text-muted-foreground md:flex"
              >
                {crumbs.map((c, i) => (
                  <span key={c.path} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="h-3 w-3 opacity-60" />}
                    <Link to={c.path} className="hover:text-foreground">
                      {c.label}
                    </Link>
                  </span>
                ))}
              </nav>
            )}
          </div>

          {/* Center */}
          <div className="mx-auto w-full max-w-xl flex-1">
            <GlobalSearch />
          </div>

          {/* Right */}
          <div className="flex items-center gap-0.5">
            <NotificationsPopover />
            <MessagesPopover />
            <CalendarPopover />
            <ThemeToggle />
            <ProfileMenu />
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
