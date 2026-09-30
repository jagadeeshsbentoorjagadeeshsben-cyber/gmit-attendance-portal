import { NextResponse } from "next/server";
import { getFaculty, clearFaculty } from "@/lib/roles-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const f = await getFaculty();
  if (!f) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, faculty: f });
}

export async function DELETE() {
  await clearFaculty();
  return NextResponse.json({ ok: true });
}
