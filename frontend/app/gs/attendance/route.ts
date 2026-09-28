import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getAttendance,
  cacheAge,
  StudentNotFoundError,
  AttendanceUnavailableError,
} from "@/lib/attendance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Authorization: always use the authenticated identity from the session.
  // Any section/usn in the query string is ignored so a student can never
  // read another student's data by manipulating request parameters.
  const { searchParams } = new URL(req.url);
  const force = searchParams.get("refresh") === "1";

  try {
    const data = await getAttendance(session.section, session.usn, force);
    return NextResponse.json({
      ...data,
      cacheAgeMs: cacheAge(session.section, session.usn) ?? 0,
    });
  } catch (err) {
    if (err instanceof StudentNotFoundError) {
      return NextResponse.json(
        { error: "Your attendance record could not be found." },
        { status: 404 }
      );
    }
    if (err instanceof AttendanceUnavailableError) {
      return NextResponse.json(
        { error: "Attendance data couldn't be loaded." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Attendance data couldn't be loaded." },
      { status: 500 }
    );
  }
}
