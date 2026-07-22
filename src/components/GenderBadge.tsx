import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  male: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800",
  female:
    "bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-950 dark:text-pink-100 dark:border-pink-800",
  other:
    "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-100 dark:border-purple-800",
  unknown:
    "bg-gray-100 text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700",
};

export function GenderBadge({ gender }: { gender?: string }) {
  const key = gender && styles[gender] ? gender : "unknown";
  const label = gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : "Unknown";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[key],
      )}
    >
      {label}
    </span>
  );
}
