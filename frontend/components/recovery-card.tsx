import { ShieldCheck, LifeBuoy } from "lucide-react";
import type { Subject } from "@/lib/types";

export function RecoveryCard({ subject }: { subject: Subject }) {
  const positive = subject.recovery.needed === 0 && subject.isStarted;
  const Icon = positive ? ShieldCheck : LifeBuoy;
  const buffer = subject.buffer;
  const recovery = subject.recovery;

  return (
    <div className="rounded-lg border border-border bg-surface p-5" data-testid="recovery-card">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-royal" />
        <h3 className="text-sm font-semibold text-ink">Attendance planning</h3>
      </div>

      {!subject.isStarted ? (
        <p className="text-sm text-muted">
          Attendance planning will be available once classes begin for this subject.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-md bg-surface-2/70 p-3">
            <span className="tnum mt-0.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-success/15 px-1.5 text-xs font-bold text-success">
              {buffer.canMiss}
            </span>
            <p className="text-sm text-ink">{buffer.message}</p>
          </div>
          {recovery.needed > 0 ? (
            <div className="flex items-start gap-3 rounded-md bg-surface-2/70 p-3">
              <span className="tnum mt-0.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-warning/15 px-1.5 text-xs font-bold text-warning">
                {recovery.needed}
              </span>
              <p className="text-sm text-ink">{recovery.message}</p>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-md bg-surface-2/70 p-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-success" />
              <p className="text-sm text-ink">{recovery.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
