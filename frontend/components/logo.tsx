import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id="gmit-ring" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#245BFF" />
          <stop offset="100%" stopColor="#4DEBFF" />
        </linearGradient>
      </defs>
      <circle
        cx="20"
        cy="20"
        r="15"
        stroke="url(#gmit-ring)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeDasharray="72 94"
        transform="rotate(-90 20 20)"
      />
      <text
        x="20"
        y="20"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="15"
        fontWeight="700"
        fill="currentColor"
        fontFamily="var(--font-inter), sans-serif"
      >
        G
      </text>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="h-9 w-9 text-ink" />
      <div className="leading-none">
        <p className="text-[13px] font-semibold tracking-tight text-ink">
          GMIT Smart
        </p>
        <p className="text-[11px] font-medium text-muted">Attendance</p>
      </div>
    </div>
  );
}
