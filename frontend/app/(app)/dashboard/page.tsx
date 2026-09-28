"use client";

import { useAttendance } from "@/components/attendance-provider";
import { StudentHeader } from "@/components/student-header";
import { RefreshControl } from "@/components/refresh-control";
import { AttendanceRing } from "@/components/attendance-ring";
import { StatusBadge } from "@/components/status-badge";
import { SubjectCard } from "@/components/subject-card";
import { DashboardSkeleton } from "@/components/skeletons";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { STATUS_THEME, healthMessage } from "@/lib/status";
import { formatPct } from "@/lib/utils";
import { BookOpen } from "lucide-react";

export default function DashboardPage() {
  const { data, loading, error, refresh, refreshing } = useAttendance();

  if (loading && !data) return <DashboardSkeleton />;
  if (error && !data)
    return <ErrorState message={error} onRetry={refresh} retrying={refreshing} />;
  if (!data) return null;

  const { student, overall, subjects } = data;
  const theme = STATUS_THEME[overall.displayStatus];

  return (
    <div className="space-y-8 animate-fade-up">
      <StudentHeader student={student} />
      <RefreshControl />

      {/* Hero */}
      <section className="flex flex-col items-center pt-2 text-center">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Overall Attendance
        </p>
        <AttendanceRing
          percentage={overall.percentage}
          hex={theme.hex}
          size={228}
        >
          <span
            className="tnum text-[44px] font-bold leading-none tracking-tight text-ink"
            data-testid="overall-percentage"
          >
            {formatPct(overall.percentage)}
          </span>
          <span className="tnum mt-2 text-sm text-muted">
            {overall.attended} / {overall.conducted} classes
          </span>
          <div className="mt-3">
            <StatusBadge status={overall.displayStatus} />
          </div>
        </AttendanceRing>

        <p className="mt-6 max-w-sm text-[15px] text-ink">
          {healthMessage(overall.percentage, overall.isStarted)}
        </p>
        <p className="tnum mt-1 text-xs text-muted">
          Minimum required · {overall.minimumRequired}%
        </p>
      </section>

      {/* Subjects */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Subjects
          </h2>
          <span className="tnum text-xs text-muted">{subjects.length} total</span>
        </div>
        {subjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No subjects available"
            description="Your subjects will appear here once they are added."
          />
        ) : (
          <div className="space-y-3">
            {subjects.map((s) => (
              <SubjectCard key={`${s.subject}-${s.courseCode}`} subject={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
