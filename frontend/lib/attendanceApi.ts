import "server-only";

const BASE = process.env.GOOGLE_ATTENDANCE_API_URL;
const TIMEOUT = 25000;

export class ApiUnavailableError extends Error {}
export class ApiNotDeployedError extends Error {
  constructor() {
    super("The attendance API does not yet support this action. Please deploy the upgraded Apps Script.");
  }
}

export const READ_ACTIONS = [
  "health", "sections", "student", "subjects", "authorizesubject",
  "facultysubjects", "students", "attendance", "history",
];

export const WRITE_ACTIONS = ["submitAttendance", "updateAttendance", "undoAttendance"];

function ctrl() {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), TIMEOUT);
  return { signal: c.signal, done: () => clearTimeout(t) };
}

export async function apiGet(
  action: string,
  params: Record<string, string | undefined> = {}
): Promise<any> {
  if (!BASE) throw new ApiUnavailableError("not configured");
  const qs = new URLSearchParams({ action });
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });
  const { signal, done } = ctrl();
  let res: Response;
  try {
    res = await fetch(`${BASE}?${qs.toString()}`, { cache: "no-store", redirect: "follow", signal });
  } catch {
    throw new ApiUnavailableError("network");
  } finally {
    done();
  }
  const text = await res.text();
  if (text.trim().startsWith("<")) throw new ApiNotDeployedError();
  let json: any;
  try { json = JSON.parse(text); } catch { throw new ApiUnavailableError("parse"); }
  if (json && json.success === false && /unknown action/i.test(json.error || "")) {
    throw new ApiNotDeployedError();
  }
  return json;
}

export async function apiPost(payload: Record<string, unknown>): Promise<any> {
  if (!BASE) throw new ApiUnavailableError("not configured");
  const { signal, done } = ctrl();
  let res: Response;
  try {
    res = await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      redirect: "follow",
      signal,
    });
  } catch {
    throw new ApiUnavailableError("network");
  } finally {
    done();
  }
  const text = await res.text();
  if (text.trim().startsWith("<")) throw new ApiNotDeployedError();
  let json: any;
  try { json = JSON.parse(text); } catch { throw new ApiNotDeployedError(); }
  if (json && json.success === false && /unknown (post )?action/i.test(json.error || "")) {
    throw new ApiNotDeployedError();
  }
  return json;
}
