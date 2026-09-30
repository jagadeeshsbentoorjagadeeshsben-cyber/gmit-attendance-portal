# GMIT Smart Attendance — PRD

## Problem Statement
Premium student attendance app for GMIT, expanded to a full attendance management system with Student, Lecturer/Faculty, and HOD/Admin roles. The real Google Sheet ("ATTENDENCE GMIT 2026 Odd Sem") via an existing Google Apps Script Web App is the single source of truth. No mock data. Must deploy directly to Vercel and Render.

## Architecture
- **Stack**: Next.js 15 (App Router) + TypeScript + Tailwind, MongoDB (profile photos only). Dev on port 3000 via supervisor `yarn start` → `next dev`.
- **Routing note**: Platform ingress routes `/api/*` → FastAPI(8001). Next.js server routes therefore live under `/gs/*`.
- **Data flow**: UI → Next.js server route (`/gs/*`) → `lib/attendanceApi.ts` → Google Apps Script → Google Sheet. Browser never touches Apps Script/Sheet directly.
- **Auth**: signed httpOnly cookies (`gmit_session` student, `gmit_faculty` per-subject lecturer, `gmit_hod` passcode). Write authz enforced server-side in `/gs/faculty/write`.

## Deployment (done 2026-09-30)
- `yarn build` (production) **passes** — type-safe, all routes compiled.
- **Vercel**: `frontend/vercel.json` + root directory `frontend`; auto-detected Next.js.
- **Render**: `/app/render.yaml` (rootDir `frontend`, build `yarn install && yarn build`, start `yarn start:prod`).
- `frontend/.env.example` documents all env vars. Cloud deploys need a MongoDB **Atlas** URI (localhost won't work).
- README.md has full deploy steps. Fixed `timingSafeEqual` Buffer type errors (auth.ts, roles-auth.ts) that blocked `next build`; added `server-only` dep.

## Roles
- **Student** (preserved): Section+USN login → welcome → dashboard (attendance ring, 75% threshold), subjects, detail, forecast, recovery, profile photo, dark mode, PWA. Read-only.
- **Lecturer** (`/lecturer`): authorize by Section+Course Code → Mark Attendance (P/A, mark-all, search, submit), History (view/edit/undo), Below 75%, Analytics. Glassmorphism.
- **HOD** (`/hod`): passcode → Dashboard, Sections drill-down (subjects→students→CSV export, below-75 highlight), History. View-only.

## Google Apps Script (`/app/APPS_SCRIPT_Code.gs`)
Full script for the user's sheet layout: health, sections, student, subjects, authorizesubject, facultysubjects, students, attendance, history (GET) + submitAttendance, updateAttendance, undoAttendance (POST) with `Attendance_Log`, duplicate protection, LockService, real undo.

## Status
- ✅ Student portal live & verified against real API (35/42 = 83.33%; 0/0 NOT_STARTED excluded).
- ✅ Lecturer + HOD portals built, wired to real API, verified (gates 307, 501 API_NOT_DEPLOYED, sections 200).
- ✅ Production build passes; Vercel + Render deploy configs ready.
- ⚠️ **BLOCKER for live Lecturer/HOD data + writes**: user's deployed Apps Script exposes ONLY health/sections/student, no doPost. Deploy `/app/APPS_SCRIPT_Code.gs` to unlock; until then portals show a deploy message (no mock data).

## Backlog / Next
- P0: User deploys `APPS_SCRIPT_Code.gs` → run real-data tests 1–14.
- P1: HOD department analytics charts & multi-sheet Excel export; lecturer per-date analytics.
- P2: student auto-refresh after lecturer writes.
