import type { LucideIcon } from "lucide-react";

interface UsageProgressProps {
  label: string;
  used: number;
  max: number;
  icon?: LucideIcon;
}

export function UsageProgress({ label, used, max, icon: Icon }: UsageProgressProps) {
  const percentage = Math.min((used / max) * 100, 100);

  // Color thresholds
  let colorClass = "bg-green-500";
  if (percentage >= 90) {
    colorClass = "bg-red-500";
  } else if (percentage >= 80) {
    colorClass = "bg-amber-500";
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold mb-2">
        {used}{" "}
        <span className="text-sm font-normal text-muted-foreground">
          / {max}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
