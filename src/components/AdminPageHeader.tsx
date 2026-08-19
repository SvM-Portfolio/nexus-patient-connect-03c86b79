import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AdminPageHeader({
  title,
  description,
  tag,
}: {
  title: string;
  description: string;
  tag?: string;
}) {
  return (
    <div>
      <Link
        to="/admin"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> System Tools
      </Link>
      <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight">
        {title}
        {tag && <Badge variant="secondary">{tag}</Badge>}
      </h1>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
