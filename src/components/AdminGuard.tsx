import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveRole } from "@/hooks/useActiveRole";

/**
 * Demo-only role gate. This is NOT production-grade security — it reads the
 * locally stored demo role. Real access control requires server-side auth.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { isTechnical, dashboardPath } = useActiveRole();

  if (!isTechnical) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center md:px-8">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Admin access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Switch to the Admin or Developer workspace from the profile menu to open
          System Tools. Demo role gate only — not production-grade security.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to={dashboardPath}>Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
