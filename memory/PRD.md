# GMIT Smart Attendance — PRD

## Problem Statement
Premium student attendance app for GMIT, expanded to a full attendance management system with Student, Lecturer/Faculty, and HOD/Admin roles. The real Google Sheet ("ATTENDENCE GMIT 2026 Odd Sem") via an existing Google Apps Script Web App is the single source of truth. No mock data.

## Architecture
- **Stack**: Next.js 15 (App Router) + TypeScript + Tailwind, MongoDB (profile photos only). Runs on port 3000 (supervisor `yarn start` → `next dev`).
- **Routing note**: Platform ingress routes `/api/*` → FastAPI(8001). Next.js server routes therefore live under `/gs/*` (reach Next on 3000).
- **Data flow**: UI → Next.js server route (`/gs/*`) → `lib/attendanceApi.ts` → Google Apps Script → Google Sheet. Browser never touches Apps Script/Sheet directly. URL only in `GOOGLE_ATTENDANCE_API_URL`.
- **Auth**: signed httpOnly cookies. Student session (`gmit_session`), Faculty per-subject authorization (`gmit_faculty`), HOD passcode (`gmit_hod`). Write authorization enforced server-side in `/gs/faculty/write`.

## Roles
- **Student** (existing, preserved): Section+USN login → welcome → dashboard (signature attendance ring, 75% threshold), subjects, subject detail, forecast, recovery, profile w/ photo (Mongo base64), dark mode, PWA, skeletons/error/empty states. Read-only.
- **Lecturer** (`/lecturer`): authorize by Section+Course Code → Mark Attendance (P/A, mark-all, search, submit), Attendance History (view/edit/undo), Below 75%, Analytics. Glassmorphism design.
- **HOD** (`/hod`): passcode → Dashboard (section cards), Sections drill-down (subjects→students→CSV export, below-75 highlight), Attendance History. View-only.

## Google Apps Script (`/app/APPS_SCRIPT_Code.gs`)
Full script authored to the user's sheet layout implementing: health, sections, student, subjects, authorizesubject, facultysubjects, students, attendance, history (GET) and submitAttendance, updateAttendance, undoAttendance (POST) with `Attendance_Log` for audit + real undo (submit undo −1 conducted; edit undo restores prev state). Duplicate protection by Section+CourseCode+Date. LockService for safe writes.

## Status (2026-09-30)
- ✅ Student portal fully working end-to-end against live API (verified: 35/42 = 83.33%, 0/0 NOT_STARTED excluded).
- ✅ Full server integration layer + proxy routes + role auth + gates (verified via curl: 307 gates, 501 API_NOT_DEPLOYED, 200 real sections).
- ✅ Lecturer + HOD portals built, wired to real API, glassmorphism UI verified.
- ⚠️ **BLOCKER for live Lecturer/HOD data & all writes**: user's currently-deployed Apps Script exposes ONLY `health/sections/student` and has NO `doPost`. Lecturer/HOD features correctly show "deploy the upgraded Apps Script" (no mock data) until the user deploys `/app/APPS_SCRIPT_Code.gs`.

## Backlog / Next
- P0: User deploys `APPS_SCRIPT_Code.gs` (new version, same /exec URL) → run real-data tests 1–14.
- P1: HOD department-wide analytics charts & multi-sheet Excel export; lecturer per-date analytics.
- P2: student real-time refresh polling after lecturer writes.

## Env
`GOOGLE_ATTENDANCE_API_URL`, `MONGO_URL`, `DB_NAME`, `SESSION_SECRET`, `ALLOWED_SECTIONS`, `ATTENDANCE_CACHE_TTL_MS`, `HOD_PASSCODE` (default `gmit-hod-2026`).
