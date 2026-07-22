import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { domainVar, type DomainKey } from "@/lib/clinical";
import type { ReactNode } from "react";

export function DomainCard({
  domain,
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  domain: DomainKey;
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card
      className={cn("border-l-4", className)}
      style={{ borderLeftColor: domainVar(domain) }}
    >
      {title && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
          {action}
        </CardHeader>
      )}
      <CardContent className={cn(bodyClassName)}>{children}</CardContent>
    </Card>
  );
}
