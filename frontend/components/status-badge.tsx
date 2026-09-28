import type { DisplayStatus } from "@/lib/types";
import { STATUS_LABEL, STATUS_THEME } from "@/lib/status";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
  size = "md",
}: {
  status: DisplayStatus;
  className?: string;
  size?: "sm" | "md";
}) {
  const theme = STATUS_THEME[status];
  return (
    <span
      role="status"
      aria-label={`Status: ${STATUS_LABEL[status]}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wide",
        theme.tint,
        theme.text,
        theme.ring,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        className
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: theme.hex }}
        aria-hidden="true"
      />
      {STATUS_LABEL[status]}
    </span>
  );
}
