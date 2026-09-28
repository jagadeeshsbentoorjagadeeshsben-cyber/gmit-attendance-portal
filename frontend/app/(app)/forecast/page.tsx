"use client";

import { useState } from "react";
import { useAttendance } from "@/components/attendance-provider";
import { ForecastChart } from "@/components/forecast-chart";
import { ListSkeleton } from "@/components/skeletons";
import { ErrorState } from "@/components/error-state";
import { buildForecast } from "@/lib/status";
import { cn, formatPct } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function ForecastPage() {
  const { data, loading, error, refresh, refreshing } = useAttendance();
  const [selected, setSelected] = useState<string>("__overall__");

  if (loading && !data) return <ListSkeleton />;
  if (error && !data)
    return <ErrorState message={error} onRetry={refresh} retrying={refreshing} />;
  if (!data) return null;

  const started = data.subjects.filter((s) => s.isStarted);
  const isOverall = selected === "__overall__";
  const source = isOverall
    ? { attended: data.overall.attended, conducted: data.overall.conducted, min: data.overall.minimumRequired, label: "Overall" }
    : (() => {
        const s = started.find((x) => x.subject === selected) ?? started[0];
        return { attended: s?.attended ?? 0, conducted: s?.conducted ?? 0, min: s?.minimumRequired ?? 75, label: s?.subject ?? "" };
      })();

  const points = buildForecast(source.attended, source.conducted, source.min);

  return (
    <div className="space-y-7 animate-fade-up">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Forecast</h1>
        <p className="mt-1 text-sm text-muted">
          See what happens to your attendance as future classes are attended or missed.
        </p>
      </header>

      {/* selector */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" data-testid="forecast-selector">
        <Chip
          active={isOverall}
          onClick={() => setSelected("__overall__")}
          testid="forecast-chip-overall"
        >
          Overall
        </Chip>
        {started.map((s) => (
          <Chip
            key={s.subject}
            active={selected === s.subject}
            onClick={() => setSelected(s.subject)}
            testid={`forecast-chip-${s.subject}`}
          >
            {s.subject}
          </Chip>
        ))}
      </div>

      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-sm font-semibold text-ink">{source.label}</p>
          <p className="tnum text-sm text-muted">
            {source.attended} / {source.conducted} · min {source.min}%
          </p>
        </div>
        <ForecastChart points={points} minimum={source.min} />
      </section>

      <section className="space-y-2.5">
        {points.map((p) => (
          <div
            key={p.key}
            data-testid={`forecast-row-${p.key}`}
            className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-ink">{p.label}</p>
              <p className="tnum text-xs text-muted">
                {p.attended} / {p.conducted} classes
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="tnum text-lg font-semibold text-ink">
                {formatPct(p.percentage)}
              </span>
              <DeltaPill delta={p.delta} />
            </div>
          </div>
        ))}
      </section>

      <p className="text-center text-xs text-muted">
        Planning information only — attend classes regularly to stay on track.
      </p>
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
  testid,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  testid: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      className={cn(
        "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
        active
          ? "border-royal bg-royal text-white"
          : "border-border bg-surface text-muted hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

function DeltaPill({ delta }: { delta: number }) {
  if (delta === 0)
    return (
      <span className="inline-flex w-16 items-center justify-end gap-1 text-xs font-medium text-muted">
        <Minus className="h-3 w-3" />
      </span>
    );
  const up = delta > 0;
  return (
    <span
      className={cn(
        "tnum inline-flex w-16 items-center justify-end gap-1 text-xs font-semibold",
        up ? "text-success" : "text-danger"
      )}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}
      {delta.toFixed(1)}
    </span>
  );
}
