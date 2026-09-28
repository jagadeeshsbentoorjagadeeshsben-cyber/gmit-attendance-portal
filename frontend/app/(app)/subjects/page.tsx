"use client";

import { useAttendance } from "@/components/attendance-provider";
import { SubjectCard } from "@/components/subject-card";
import { ListSkeleton } from "@/components/skeletons";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { BookOpen } from "lucide-react";

export default function SubjectsPage() {
  const { data, loading, error, refresh, refreshing } = useAttendance();

  if (loading && !data) return <ListSkeleton />;
  if (error && !data)
    return <ErrorState message={error} onRetry={refresh} retrying={refreshing} />;
  if (!data) return null;

  const active = data.subjects.filter((s) => s.isStarted);
  const upcoming = data.subjects.filter((s) => !s.isStarted);

  return (
    <div className="space-y-8 animate-fade-up">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Subjects</h1>
        <p className="mt-1 text-sm text-muted">
          {active.length} active · {upcoming.length} not started
        </p>
      </header>

      {data.subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects available"
          description="Your subjects will appear here once they are added."
        />
      ) : (
        <>
          <section className="space-y-3">
            {active.map((s) => (
              <SubjectCard key={`${s.subject}-${s.courseCode}`} subject={s} />
            ))}
          </section>

          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Not started yet
              </h2>
              <div className="space-y-3">
                {upcoming.map((s) => (
                  <SubjectCard key={`${s.subject}-${s.courseCode}`} subject={s} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
