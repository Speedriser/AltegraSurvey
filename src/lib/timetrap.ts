import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { MIN_PUBLIC_SUBMIT_MS } from "@/lib/constants";

export const TIMETRAP_COOKIE = "altegra_tt";

function key() {
  const secret = process.env.TIMETRAP_SECRET;
  if (!secret) throw new Error("TIMETRAP_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

export async function issueTimetrapToken(token: string) {
  return new SignJWT({ t: token })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(await key());
}

export async function verifyTimetrap(jwt: string, expectedToken: string) {
  try {
    const { payload } = await jwtVerify(jwt, await key());
    if (payload.t !== expectedToken) return { ok: false as const };
    const issuedAt = (payload.iat ?? 0) * 1000;
    const elapsed = Date.now() - issuedAt;
    if (elapsed < MIN_PUBLIC_SUBMIT_MS) return { ok: false as const };
    return { ok: true as const };
  } catch {
    return { ok: false as const };
  }
}
