import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";
import type { SessionData } from "./types";

const SECRET = process.env.SESSION_SECRET ?? "";
const COOKIE = "gmit_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(payload: string): string {
  return b64url(
    crypto.createHmac("sha256", SECRET).update(payload).digest()
  );
}

export function createToken(data: SessionData): string {
  const payload = b64url(Buffer.from(JSON.stringify(data), "utf8"));
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined): SessionData | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }
  try {
    const json = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
        "utf8"
      )
    ) as SessionData;
    if (!json.usn || !json.section) return null;
    return json;
  } catch {
    return null;
  }
}

export async function setSession(data: SessionData): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, createToken(data), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/** Read + verify the current session. Returns null if unauthenticated. */
export async function getSession(): Promise<SessionData | null> {
  const jar = await cookies();
  return verifyToken(jar.get(COOKIE)?.value);
}
