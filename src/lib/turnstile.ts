import "server-only";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Hard-fail if Turnstile isn't configured — never silently let public submits through.
    throw new Error("Turnstile is not configured");
  }
  const body = new URLSearchParams({ secret, response: token, remoteip: ip });
  const res = await fetch(SITEVERIFY, { method: "POST", body });
  if (!res.ok) return false;
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}
