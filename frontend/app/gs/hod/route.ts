import { NextResponse } from "next/server";
import { setHod, getHod, clearHod } from "@/lib/roles-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const passcode = String(body.passcode || "");
  const expected = process.env.HOD_PASSCODE || "";
  if (!expected) return NextResponse.json({ error: "HOD access is not configured." }, { status: 503 });
  if (passcode !== expected) return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  await setHod();
  return NextResponse.json({ success: true });
}

export async function GET() {
  const ok = await getHod();
  if (!ok) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true });
}

export async function DELETE() {
  await clearHod();
  return NextResponse.json({ ok: true });
}
