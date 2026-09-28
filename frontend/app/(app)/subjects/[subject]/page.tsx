"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { useAttendance } from "@/components/attendance-provider";
import { AttendanceRing } from "@/components/attendance-ring";
import { StatusBadge } from "@/components/status-badge";
import { RecoveryCard } from "@/components/recovery-card";
import { ForecastChart } from "@/components/forecast-chart";
import { ListSkeleton } from "@/components/skeletons";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { STATUS_THEME, buildForecast, healthMessage } from "@/lib/status";
import { formatPct } from "@/lib/utils";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="tnum mt-1 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

export default function SubjectDetailPage() {
  const params = useParams<{ subject: string }>();
  const decoded = decodeURIComponent(params.subject);
  const { data, loading, error, refresh, refreshing } = useAttendance();

  if (loading && !data) return <ListSkeleton />;
  if (error && !data)
    return <ErrorState message={error} onRetry={refresh} retrying={refreshing} />;
  if (!data) return null;

  const subject = data.subjects.find((s) => s.subject === decoded);

  if (!subject) {
    return (
      <div className="space-y-6">
        <BackLink />
        <EmptyState
          icon={CalendarClock}
          title="Subject not found"
          description="This subject is no longer part of your attendance."
        />
      </div>
    );
  }

  const theme = STATUS_THEME[subject.displayStatus];
  const forecast = buildForecast(subject.attended, subject.conducted);

  return (
    <div className="space-y-7 animate-fade-up">
      <BackLink />

      <header>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {subject.subject}
          </h1>
          {subject.courseCode && (
            <span className="tnum rounded bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">
              {subject.courseCode}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted">
          {subject.teacher || "Faculty to be assigned"}
        </p>
      </header>

      <section className="flex flex-col items-center rounded-lg border border-border bg-surface py-8">
        <AttendanceRing
          percentage={subject.isStarted ? subject.percentage : 0}
          hex={theme.hex}
          size={200}
        >
          {subject.isStarted ? (
            <>
              <span className="tnum text-4xl font-bold text-ink">
                {formatPct(subject.percentage)}
              </span>
              <span className="tnum mt-1 text-xs text-muted">
                {subject.attended} / {subject.conducted}
              </span>
            </>
          ) : (
            <span className="text-sm font-semibold text-muted">Not started</span>
          )}
        </AttendanceRing>
        <div className="mt-4">
          <StatusBadge status={subject.displayStatus} />
        </div>
        <p className="mt-4 max-w-xs px-4 text-center text-sm text-ink">
          {healthMessage(subject.percentage, subject.isStarted)}
        </p>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Attended" value={String(subject.attended)} />
        <Stat label="Conducted" value={String(subject.conducted)} />
        <Stat label="Required" value={`${subject.minimumRequired}%`} />
      </section>

      <RecoveryCard subject={subject} />

      {subject.isStarted && (
        <section className="rounded-lg border border-border bg-surface p-5">
          <h3 className="mb-1 text-sm font-semibold text-ink">Forecast</h3>
          <p className="mb-3 text-xs text-muted">
            How your attendance changes with upcoming classes.
          </p>
          <ForecastChart points={forecast} minimum={subject.minimumRequired} />
        </section>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/subjects"
      data-testid="subject-back"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
    >
      <ArrowLeft className="h-4 w-4" />
      Subjects
    </Link>
  );
}
