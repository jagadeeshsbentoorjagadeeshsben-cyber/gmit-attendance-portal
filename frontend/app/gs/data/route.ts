import { NextResponse } from "next/server";
import { apiGet, READ_ACTIONS, ApiNotDeployedError, ApiUnavailableError } from "@/lib/attendanceApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") ?? "";
  if (!READ_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  }
  const params: Record<string, string> = {};
  ["section", "usn", "courseCode", "teacher", "date"].forEach((k) => {
    const v = searchParams.get(k);
    if (v) params[k] = v;
  });
  try {
    const json = await apiGet(action, params);
    return NextResponse.json(json);
  } catch (err) {
    if (err instanceof ApiNotDeployedError) {
      return NextResponse.json({ error: err.message, code: "API_NOT_DEPLOYED" }, { status: 501 });
    }
    if (err instanceof ApiUnavailableError) {
      return NextResponse.json({ error: "Attendance data couldn't be loaded." }, { status: 503 });
    }
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
