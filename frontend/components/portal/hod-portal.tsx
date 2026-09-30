"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, History, AlertTriangle, Download, Loader2, CalendarDays,
} from "lucide-react";
import { PortalShell, GlassCard, type NavItem } from "./portal-shell";
import { readApi, friendly, prettyDate } from "@/lib/clientApi";
import { cn } from "@/lib/utils";

const NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "sections", label: "Sections", icon: Building2 },
  { key: "history", label: "Attendance History", icon: History },
  { key: "below75", label: "Below 75%", icon: AlertTriangle },
];

const statusColor: Record<string, string> = {
  EXCELLENT: "text-emerald-600", ON_TRACK: "text-indigo-600",
  AT_RISK: "text-amber-600", CRITICAL: "text-rose-600", NOT_STARTED: "text-slate-400",
};

export function HodPortal() {
  const router = useRouter();
  const [tab, setTab] = useState("dashboard");
  const [sections, setSections] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [selSection, setSelSection] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selSubject, setSelSubject] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [hist, setHist] = useState<any[]>([]);

  const logout = async () => { await fetch("/gs/hod", { method: "DELETE" }); router.replace("/hod"); };

  useEffect(() => {
    readApi("sections").then((j) => setSections(j.sections || {})).catch((e) => setError(friendly(e))).finally(() => setLoading(false));
  }, []);

  const pickSection = useCallback(async (s: string) => {
    setSelSection(s); setSelSubject(null); setStudents([]); setSubjects([]); setBusy(true); setError(null);
    try { const j = await readApi("subjects", { section: s }); setSubjects(j.subjects || []); }
    catch (e) { setError(friendly(e)); } finally { setBusy(false); }
  }, []);

  const pickSubject = useCallback(async (sub: any) => {
    setSelSubject(sub); setStudents([]); setBusy(true);
    try { const j = await readApi("students", { section: selSection, courseCode: sub.courseCode }); setStudents(j.students || []); }
    catch (e) { setError(friendly(e)); } finally { setBusy(false); }
  }, [selSection]);

  const loadHist = useCallback(async (s: string) => {
    setSelSection(s); setBusy(true);
    try { const j = await readApi("history", { section: s }); setHist(j.history || []); }
    catch (e) { setError(friendly(e)); } finally { setBusy(false); }
  }, []);

  const exportCsv = () => {
    if (!students.length) return;
    const head = ["USN", "Name", "Attended", "Conducted", "Percentage", "Status"];
    const rows = students.map((s) => [s.usn, s.name, s.attended, s.conducted, s.percentage, s.status]);
    const csv = [head, ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url;
    a.download = `${selSection}_${selSubject?.courseCode}_attendance.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const SECTIONS = Object.keys(sections);
  const below = students.filter((s) => s.isStarted && s.percentage < 75);

  return (
    <PortalShell role="HOD" title="Department Overview" subtitle="Read-only • real-time from the Google Sheet" nav={NAV} active={tab} onSelect={setTab} onLogout={logout}>
      {error && <GlassCard className="mb-4 text-sm text-rose-600">{error}</GlassCard>}
      {loading ? (
        <GlassCard className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Loading…</GlassCard>
      ) : tab === "dashboard" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SECTIONS.map((s) => (
              <GlassCard key={s} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-extrabold">{s}</p>
                  <Building2 className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="mt-1 text-xs text-slate-500">{sections[s].available ? `${Math.max(0, (sections[s].rows || 5) - 4)} students · ${(sections[s].columns || 4) - 3} subjects` : "Unavailable"}</p>
              </GlassCard>
            ))}
          </div>
          <GlassCard className="text-sm text-slate-600">Select <b>Sections</b> to drill into subjects, students and date-wise attendance. HOD access is view-only.</GlassCard>
        </div>
      ) : tab === "sections" ? (
        <div className="space-y-4">
          <GlassCard>
            <p className="mb-2 text-xs font-bold uppercase text-slate-500">Section</p>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map((s) => (
                <button key={s} data-testid={`hod-section-${s}`} onClick={() => pickSection(s)}
                  className={cn("rounded-xl border px-4 py-2 text-sm font-bold", selSection === s ? "border-emerald-600 bg-emerald-600 text-white" : "border-white/60 bg-white/50 dark:bg-white/5")}>{s}</button>
              ))}
            </div>
            {subjects.length > 0 && (
              <>
                <p className="mb-2 mt-4 text-xs font-bold uppercase text-slate-500">Subject</p>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((sub) => (
                    <button key={sub.courseCode || sub.subject} data-testid={`hod-subject-${sub.courseCode}`} onClick={() => pickSubject(sub)}
                      className={cn("rounded-xl border px-3 py-2 text-sm font-semibold", selSubject?.courseCode === sub.courseCode ? "border-indigo-600 bg-indigo-600 text-white" : "border-white/60 bg-white/50 dark:bg-white/5")}>
                      {sub.subject} <span className="opacity-70">· {sub.courseCode || "—"}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </GlassCard>

          {busy && <GlassCard className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Loading…</GlassCard>}

          {selSubject && students.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">{selSubject.subject} • {selSubject.teacher} • {selSubject.conducted} conducted</p>
                <button onClick={exportCsv} data-testid="hod-export" className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white"><Download className="h-4 w-4" />Export CSV</button>
              </div>
              {below.length > 0 && <p className="text-xs font-semibold text-rose-600">{below.length} student(s) below 75%</p>}
              <GlassCard className="overflow-x-auto p-0">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="border-b border-white/40 text-left text-xs uppercase text-slate-500">
                    <tr><th className="p-3">USN</th><th className="p-3">Name</th><th className="p-3">Attended</th><th className="p-3">Conducted</th><th className="p-3">%</th><th className="p-3">Status</th></tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.usn} className="border-b border-white/20">
                        <td className="p-3 font-semibold">{s.usn}</td><td className="p-3">{s.name}</td>
                        <td className="p-3">{s.attended}</td><td className="p-3">{s.conducted}</td>
                        <td className="p-3 tabular-nums">{s.isStarted ? `${s.percentage}%` : "—"}</td>
                        <td className={cn("p-3 text-xs font-bold", statusColor[s.status])}>{s.status.replace("_", " ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            </>
          )}
        </div>
      ) : tab === "history" ? (
        <div className="space-y-4">
          <GlassCard>
            <p className="mb-2 text-xs font-bold uppercase text-slate-500">Section</p>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map((s) => (
                <button key={s} onClick={() => loadHist(s)} className={cn("rounded-xl border px-4 py-2 text-sm font-bold", selSection === s ? "border-emerald-600 bg-emerald-600 text-white" : "border-white/60 bg-white/50 dark:bg-white/5")}>{s}</button>
              ))}
            </div>
          </GlassCard>
          {busy ? <GlassCard className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Loading…</GlassCard>
            : hist.length === 0 ? <GlassCard className="text-sm text-slate-600">{selSection ? "No history for this section yet." : "Select a section."}</GlassCard>
            : (
              <GlassCard className="overflow-x-auto p-0">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="border-b border-white/40 text-left text-xs uppercase text-slate-500">
                    <tr><th className="p-3">Date</th><th className="p-3">Subject</th><th className="p-3">Teacher</th><th className="p-3">Present</th><th className="p-3">Absent</th><th className="p-3">Conducted</th></tr>
                  </thead>
                  <tbody>
                    {hist.map((h, i) => (
                      <tr key={i} className="border-b border-white/20">
                        <td className="p-3 font-semibold">{prettyDate(h.date)}</td><td className="p-3">{h.subject}</td>
                        <td className="p-3">{h.teacher}</td><td className="p-3 text-emerald-600">{h.present}</td>
                        <td className="p-3 text-rose-600">{h.absent}</td><td className="p-3">{h.conducted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            )}
        </div>
      ) : (
        <div className="space-y-4">
          <GlassCard className="text-sm text-slate-600">Pick a section and subject under <b>Sections</b> — students below 75% are highlighted there. Choose a section to summarise here.</GlassCard>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <button key={s} onClick={() => { setTab("sections"); pickSection(s); }} className="rounded-xl border border-white/60 bg-white/50 px-4 py-2 text-sm font-bold dark:bg-white/5">{s}</button>
            ))}
          </div>
        </div>
      )}
    </PortalShell>
  );
}
