import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function ShowMore<T>({
  items,
  initial = 5,
  step = 10,
  render,
  empty,
  wrap,
}: {
  items: T[];
  initial?: number;
  step?: number;
  render: (item: T, i: number) => ReactNode;
  empty?: ReactNode;
  wrap?: (children: ReactNode) => ReactNode;
}) {
  const [count, setCount] = useState(initial);
  if (!items.length) return <>{empty ?? <p className="py-2 text-sm text-muted-foreground">Nothing to show.</p>}</>;
  const shown = items.slice(0, count);
  const rendered = shown.map((it, i) => render(it, i));
  const list = wrap ? wrap(rendered) : rendered;
  return (
    <div className="space-y-3">
      {list}
      {items.length > count && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCount((c) => c + step)}
          >
            Show more ({items.length - count} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
