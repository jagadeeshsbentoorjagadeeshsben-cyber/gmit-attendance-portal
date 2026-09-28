"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "./logo";
import { StatusBadge } from "./status-badge";
import { STATUS_THEME, STATUS_LABEL } from "@/lib/status";
import { formatPct } from "@/lib/utils";
import type { SessionData, AttendanceData } from "@/lib/types";

export function Welcome({ student }: { student: SessionData }) {
  const router = useRouter();
  const [data, setData] = useState<AttendanceData | null>(null);
  const [phase, setPhase] = useState<0 | 1>(0);

  useEffect(() => {
    fetch("/gs/attendance", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setData(j))
      .catch(() => {});
    const t1 = setTimeout(() => setPhase(1), 1400);
    const t2 = setTimeout(() => router.replace("/dashboard"), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [router]);

  const overall = data?.overall;
  const theme = overall ? STATUS_THEME[overall.displayStatus] : null;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="ambient-glow pointer-events-none absolute inset-0" />
      <button
        onClick={() => router.replace("/dashboard")}
        className="absolute right-5 top-5 z-10 text-xs font-medium text-muted hover:text-ink"
        data-testid="welcome-skip"
      >
        Skip
      </button>

      <div className="relative animate-fade-up">
        <LogoMark className="mx-auto h-16 w-16 text-ink drop-shadow" />
      </div>

      {phase === 0 ? (
        <div key="hello" className="relative mt-8 animate-fade-up">
          <p className="text-sm font-medium text-muted">Welcome back,</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
            {student.name}
          </h1>
          <p className="tnum mt-2 text-sm text-muted">
            {student.section} · {student.usn}
          </p>
          <p className="mt-6 text-[15px] text-muted">
            Here&rsquo;s where your attendance stands today.
          </p>
        </div>
      ) : (
        <div key="stat" className="relative mt-8 animate-fade-up">
          {overall ? (
            <>
              <p
                className="tnum text-6xl font-bold tracking-tight"
                style={{ color: theme?.hex }}
                data-testid="welcome-percentage"
              >
                {formatPct(overall.percentage)}
              </p>
              <div className="mt-4 flex justify-center">
                <StatusBadge status={overall.displayStatus} />
              </div>
              <p className="sr-only">
                Overall attendance {formatPct(overall.percentage)},{" "}
                {STATUS_LABEL[overall.displayStatus]}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">Loading your attendance…</p>
          )}
        </div>
      )}
    </main>
  );
}
