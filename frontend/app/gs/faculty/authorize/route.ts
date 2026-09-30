import { NextResponse } from "next/server";
import { apiGet, ApiNotDeployedError, ApiUnavailableError } from "@/lib/attendanceApi";
import { setFaculty } from "@/lib/roles-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const section = String(body.section || "").trim().toUpperCase();
  const courseCode = String(body.courseCode || "").trim().toUpperCase();
  if (!section || !courseCode) {
    return NextResponse.json({ error: "Section and subject code are required." }, { status: 400 });
  }
  try {
    const json = await apiGet("authorizesubject", { section, courseCode });
    if (!json.success) {
      return NextResponse.json({ error: json.error || "Subject not found for this section." }, { status: 404 });
    }
    await setFaculty({ section: json.section, courseCode: json.courseCode, subject: json.subject, teacher: json.teacher });
    return NextResponse.json({ success: true, faculty: {
      section: json.section, courseCode: json.courseCode, subject: json.subject, teacher: json.teacher, conducted: json.conducted } });
  } catch (err) {
    if (err instanceof ApiNotDeployedError) return NextResponse.json({ error: err.message, code: "API_NOT_DEPLOYED" }, { status: 501 });
    if (err instanceof ApiUnavailableError) return NextResponse.json({ error: "Authorization service unavailable." }, { status: 503 });
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
