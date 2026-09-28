import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAttendance,
  isValidSection,
  isValidUsn,
  normalizeSection,
  normalizeUsn,
  StudentNotFoundError,
  AttendanceUnavailableError,
} from "@/lib/attendance";
import { setSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  section: z.string().min(1),
  usn: z.string().min(1),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter your section and USN." },
      { status: 400 }
    );
  }

  const section = normalizeSection(parsed.data.section);
  const usn = normalizeUsn(parsed.data.usn);

  if (!isValidSection(section)) {
    return NextResponse.json(
      { error: "Please choose a valid section." },
      { status: 400 }
    );
  }
  if (!isValidUsn(usn)) {
    return NextResponse.json(
      { error: "That doesn't look like a valid USN." },
      { status: 400 }
    );
  }

  try {
    const data = await getAttendance(section, usn, false);
    await setSession({
      usn: data.student.usn,
      section: data.student.section,
      name: data.student.name,
    });
    return NextResponse.json({ student: data.student });
  } catch (err) {
    if (err instanceof StudentNotFoundError) {
      return NextResponse.json(
        { error: "We couldn't find a student with that Section and USN." },
        { status: 404 }
      );
    }
    if (err instanceof AttendanceUnavailableError) {
      return NextResponse.json(
        { error: "Attendance service is unavailable. Please try again." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
