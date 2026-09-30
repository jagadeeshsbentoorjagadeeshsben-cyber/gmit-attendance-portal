"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck, History, AlertTriangle, BarChart3, Search,
  Check, X, RotateCcw, Pencil, Eye, Loader2, Users,
} from "lucide-react";
import { PortalShell, GlassCard, type NavItem } from "./portal-shell";
import { readApi, writeApi, friendly, todayISO, prettyDate } from "@/lib/clientApi";
import { cn } from "@/lib/utils";
import type { FacultySession } from "@/lib/roles-auth";

const NAV: NavItem[] = [
  { key: "mark", label: "Mark Attendance", icon: ClipboardCheck },
  { key: "history", label: "Attendance History", icon: History },
  { key: "below75", label: "Below 75%", icon: AlertTriangle },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
];

type Mark = "P" | "A";

const statusColor: Record<string, string> = {
  EXCELLENT: "text-emerald-600", ON_TRACK: "text-indigo-600",
  AT_RISK: "text-amber-600", CRITICAL: "text-rose-600", NOT_STARTED: "text-slate-400",
};

export function LecturerPortal({ faculty }: { faculty: FacultySession }) {
  const router = useRouter();
  const [tab, setTab] = useState("mark");
  const [students, setStudents] = useState<any[]>([]);
  const [conducted, setConducted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [date, setDate] = useState(todayISO());
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [hist, setHist] = useState<any[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [viewData, setViewData] = useState<{ date: string; attendance: Record<string, string> } | null>(null);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500); };

  const loadStudents = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const j = await readApi("students", { section: faculty.section, courseCode: faculty.courseCode });
      setStudents(j.students || []); setConducted(j.conducted || 0);
      const init: Record<string, Mark> = {};
      (j.students || []).forEach((s: any) => { init[s.usn] = "P"; });
      setMarks(init);
    } catch (e) { setError(friendly(e)); } finally { setLoading(false); }
  }, [faculty.section, faculty.courseCode]);

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try { const j = await readApi("history", { section: faculty.section, courseCode: faculty.courseCode }); setHist(j.history || []); }
    catch (e) { setError(friendly(e)); } finally { setHistLoading(false); }
  }, [faculty.section, faculty.courseCode]);

  useEffect(() => { loadStudents(); loadHistory(); }, [loadStudents, loadHistory]);

  const logout = async () => { await fetch("/gs/faculty/session", { method: "DELETE" }); router.replace("/lecturer"); };

  const present = useMemo(() => Object.values(marks).filter((m) => m === "P").length, [marks]);
  const total = students.length;
  const absent = total - present;
  const classPct = total ? Math.round((present / total) * 10000) / 100 : 0;

  const setAll = (m: Mark) => { const n: Record<string, Mark> = {}; students.forEach((s) => (n[s.usn] = m)); setMarks(n); };
  const toggle = (usn: string, m: Mark) => setMarks((p) => ({ ...p, [usn]: m }));

  const filtered = students.filter((s) =>
    !search || s.usn.includes(search.toUpperCase()) || s.name.toUpperCase().includes(search.toUpperCase()));

  const submit = async () => {
    if (!total) { flash("No students loaded."); return; }
    setBusy(true);
    try {
      const action = editing ? "updateAttendance" : "submitAttendance";
      const j = await writeApi({ action, section: faculty.section, courseCode: faculty.courseCode, date, attendance: marks });
      flash(editing ? "Attendance updated on the Google Sheet." : `Submitted • ${j.present} present, ${j.absent} absent.`);
      setEditing(false); await loadStudents(); await loadHistory(); setTab("history");
    } catch (e: any) {
      if (e?.code === "DUPLICATE" || /already submitted/i.test(e?.message || "")) { flash("Already submitted for this date — use History to edit or undo."); setTab("history"); }
      else flash(friendly(e));
    } finally { setBusy(false); }
  };

  const startEdit = async (d: string) => {
    setBusy(true);
    try {
      const j = await readApi("attendance", { section: faculty.section, courseCode: faculty.courseCode, date: d });
      const m: Record<string, Mark> = {};
      students.forEach((s) => { m[s.usn] = (j.attendance?.[s.usn] === "P" ? "P" : "A"); });
      setMarks(m); setDate(d); setEditing(true); setViewData(null); setTab("mark");
    } catch (e) { flash(friendly(e)); } finally { setBusy(false); }
  };

  const view = async (d: string) => {
    setBusy(true);
    try { const j = await readApi("attendance", { section: faculty.section, courseCode: faculty.courseCode, date: d }); setViewData({ date: d, attendance: j.attendance || {} }); }
    catch (e) { flash(friendly(e)); } finally { setBusy(false); }
  };

  const undo = async (d: string) => {
    if (!confirm(`Undo attendance for ${faculty.subject} • ${faculty.section} • ${prettyDate(d)}? This restores the previous state on the Google Sheet.`)) return;
    setBusy(true);
    try { await writeApi({ action: "undoAttendance", section: faculty.section, courseCode: faculty.courseCode, date: d }); flash("Attendance undone — Sheet restored."); await loadStudents(); await loadHistory(); }
    catch (e) { flash(friendly(e)); } finally { setBusy(false); }
  };

  const below = students.filter((s) => s.isStarted && s.percentage < 75);
  const avg = students.filter((s) => s.isStarted).reduce((a, s, _, arr) => a + s.percentage / arr.length, 0);

  const meta = `${faculty.subject} • ${faculty.courseCode} • ${faculty.section} • ${faculty.teacher} • ${conducted} conducted`;

  return (
    <PortalShell role="Lecturer" title={faculty.subject} subtitle={meta} nav={NAV} active={tab} onSelect={setTab} onLogout={logout}>
      {toast && <div data-testid="lec-toast" className="mb-4 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">{toast}</div>}
      {error && <GlassCard className="mb-4 text-sm text-rose-600" >{error}</GlassCard>}

      {loading ? (
        <GlassCard className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Loading students…</GlassCard>
      ) : tab === "mark" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Students" value={total} />
            <Stat label="Present" value={present} tone="emerald" />
            <Stat label="Absent" value={absent} tone="rose" />
            <Stat label="Class %" value={`${classPct}%`} tone="indigo" />
          </div>

          <GlassCard>
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="mr-2 text-sm font-semibold">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="lec-date"
                  className="rounded-lg border border-white/60 bg-white/60 px-3 py-1.5 text-sm dark:bg-white/5" />
                {editing && <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-1 text-xs font-bold text-amber-600">EDITING</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAll("P")} data-testid="mark-all-present" className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-sm font-bold text-emerald-600">Mark all Present</button>
                <button onClick={() => setAll("A")} data-testid="mark-all-absent" className="rounded-lg bg-rose-500/15 px-3 py-1.5 text-sm font-bold text-rose-600">Mark all Absent</button>
              </div>
              <div className="relative ml-auto">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search USN or name" data-testid="lec-search"
                  className="rounded-lg border border-white/60 bg-white/60 py-1.5 pl-9 pr-3 text-sm dark:bg-white/5" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="overflow-x-auto p-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-white/40 text-left text-xs uppercase text-slate-500">
                <tr><th className="p-3">#</th><th className="p-3">USN</th><th className="p-3">Name</th><th className="p-3">Current</th><th className="p-3">%</th><th className="p-3">Status</th><th className="p-3 text-right">Today</th></tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.usn} className="border-b border-white/20" data-testid={`lec-row-${s.usn}`}>
                    <td className="p-3 text-slate-400">{i + 1}</td>
                    <td className="p-3 font-semibold">{s.usn}</td>
                    <td className="p-3">{s.name}</td>
                    <td className="p-3 tabular-nums">{s.attended}/{s.conducted}</td>
                    <td className="p-3 tabular-nums">{s.isStarted ? `${s.percentage}%` : "—"}</td>
                    <td className={cn("p-3 text-xs font-bold", statusColor[s.status])}>{s.status.replace("_", " ")}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => toggle(s.usn, "P")} data-testid={`present-${s.usn}`}
                          className={cn("flex h-8 w-8 items-center justify-center rounded-lg font-bold", marks[s.usn] === "P" ? "bg-emerald-600 text-white" : "bg-white/60 text-emerald-600 dark:bg-white/5")}><Check className="h-4 w-4" /></button>
                        <button onClick={() => toggle(s.usn, "A")} data-testid={`absent-${s.usn}`}
                          className={cn("flex h-8 w-8 items-center justify-center rounded-lg font-bold", marks[s.usn] === "A" ? "bg-rose-600 text-white" : "bg-white/60 text-rose-600 dark:bg-white/5")}><X className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>

          <button onClick={submit} disabled={busy} data-testid="submit-attendance"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-5 w-5" />}
            {editing ? "Update Attendance" : "Submit Attendance"}
          </button>
        </div>
      ) : tab === "history" ? (
        <div className="space-y-4">
          {viewData && (
            <GlassCard>
              <div className="mb-2 flex items-center justify-between">
                <p className="font-bold">Viewing {prettyDate(viewData.date)}</p>
                <button onClick={() => setViewData(null)}><X className="h-4 w-4" /></button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {students.map((s) => (
                  <span key={s.usn} className={cn("rounded-lg px-2 py-1 text-xs font-semibold", viewData.attendance[s.usn] === "P" ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600")}>{s.usn}:{viewData.attendance[s.usn] || "A"}</span>
                ))}
              </div>
            </GlassCard>
          )}
          {histLoading ? (
            <GlassCard className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Loading history…</GlassCard>
          ) : hist.length === 0 ? (
            <GlassCard className="text-sm text-slate-600">No attendance history yet for this subject.</GlassCard>
          ) : (
            <GlassCard className="overflow-x-auto p-0">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-white/40 text-left text-xs uppercase text-slate-500">
                  <tr><th className="p-3">Date</th><th className="p-3">Present</th><th className="p-3">Absent</th><th className="p-3">Total</th><th className="p-3">Conducted</th><th className="p-3 text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {hist.map((h, i) => (
                    <tr key={i} className="border-b border-white/20" data-testid={`hist-row-${h.date}`}>
                      <td className="p-3 font-semibold">{prettyDate(h.date)} <span className="ml-1 rounded bg-slate-500/10 px-1.5 py-0.5 text-[10px] uppercase">{h.operation}</span></td>
                      <td className="p-3 text-emerald-600">{h.present}</td>
                      <td className="p-3 text-rose-600">{h.absent}</td>
                      <td className="p-3">{h.total}</td>
                      <td className="p-3">{h.conducted}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => view(h.date)} data-testid={`view-${h.date}`} className="rounded-lg bg-white/60 p-2 text-slate-600 dark:bg-white/5" title="View"><Eye className="h-4 w-4" /></button>
                          <button onClick={() => startEdit(h.date)} data-testid={`edit-${h.date}`} className="rounded-lg bg-indigo-500/15 p-2 text-indigo-600" title="Edit"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => undo(h.date)} data-testid={`undo-${h.date}`} className="rounded-lg bg-rose-500/15 p-2 text-rose-600" title="Undo"><RotateCcw className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          )}
        </div>
      ) : tab === "below75" ? (
        <GlassCard className="overflow-x-auto p-0">
          {below.length === 0 ? <p className="p-5 text-sm text-slate-600">No students below 75%.</p> : (
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-white/40 text-left text-xs uppercase text-slate-500">
                <tr><th className="p-3">USN</th><th className="p-3">Name</th><th className="p-3">Attended</th><th className="p-3">Conducted</th><th className="p-3">%</th><th className="p-3">Recovery</th></tr>
              </thead>
              <tbody>
                {below.map((s) => (
                  <tr key={s.usn} className="border-b border-white/20">
                    <td className="p-3 font-semibold">{s.usn}</td><td className="p-3">{s.name}</td>
                    <td className="p-3">{s.attended}</td><td className="p-3">{s.conducted}</td>
                    <td className="p-3 font-bold text-rose-600">{s.percentage}%</td>
                    <td className="p-3 text-xs text-slate-600">{s.recovery?.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total Students" value={total} icon />
          <Stat label="Avg Attendance" value={`${Math.round(avg * 100) / 100 || 0}%`} tone="indigo" />
          <Stat label="Below 75%" value={below.length} tone="rose" />
          <Stat label="Classes Conducted" value={conducted} tone="emerald" />
        </div>
      )}
    </PortalShell>
  );
}

function Stat({ label, value, tone, icon }: { label: string; value: string | number; tone?: string; icon?: boolean }) {
  const c = tone === "emerald" ? "text-emerald-600" : tone === "rose" ? "text-rose-600" : tone === "indigo" ? "text-indigo-600" : "text-slate-900 dark:text-slate-100";
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">{icon && <Users className="h-3.5 w-3.5" />}{label}</div>
      <p className={cn("mt-1 text-2xl font-extrabold tabular-nums", c)}>{value}</p>
    </GlassCard>
  );
}
