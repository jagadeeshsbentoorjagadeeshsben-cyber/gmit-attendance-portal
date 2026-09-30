# GMIT Smart Attendance

Next.js 15 + TypeScript full-stack app. Google Sheet (via Google Apps Script) is the single source of truth for attendance; MongoDB stores only student profile photos.

## Run locally

```bash
cd frontend
cp .env.example .env.local   # fill values
yarn install
yarn dev                     # http://localhost:3000
```

## Portals

| Role | URL | Access |
|---|---|---|
| Student | `/` | Section + USN (from the Google Sheet) |
| Lecturer | `/lecturer` | Section + Subject Code (authorized via Apps Script) |
| HOD / Admin | `/hod` | Passcode (`HOD_PASSCODE` env) |

## Deploy

### Vercel
1. Import the repo in Vercel.
2. Set **Root Directory** to `frontend` (framework auto-detects Next.js).
3. Add env vars from `.env.example` (use a MongoDB **Atlas** URI — localhost won't work).
4. Deploy. That's it — `vercel.json` is already configured.

### Render
1. Create a new Blueprint/Web Service from the repo — `render.yaml` (repo root) is already configured:
   - build: `yarn install && yarn build`
   - start: `yarn start:prod`
   - root dir: `frontend`
2. Set the secret env vars (`GOOGLE_ATTENDANCE_API_URL`, `MONGO_URL`, `SESSION_SECRET`, `HOD_PASSCODE`) in the dashboard.
3. Deploy.

### Required env vars
See `frontend/.env.example`.

### Google Apps Script (required for lecturer writes / HOD reads)
Deploy `APPS_SCRIPT_Code.gs` (repo root) into the Sheet's Apps Script editor:
Extensions → Apps Script → replace `Code.gs` → Deploy → Manage deployments → Edit → **New version** → Deploy. Keep the same `/exec` URL as `GOOGLE_ATTENDANCE_API_URL`.

## Notes
- Server routes live under `/gs/*` (not `/api/*`) so they also work behind this platform's ingress.
- Attendance is read-only for students/HOD; lecturer writes are authorized server-side per section+course.
