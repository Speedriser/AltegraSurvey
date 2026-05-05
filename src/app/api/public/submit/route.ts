import { cookies, headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { publicSubmitPayloadSchema, buildSubmissionSchema } from "@/lib/validations";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTurnstile } from "@/lib/turnstile";
import { hashIp } from "@/lib/ip-hash";
import { TIMETRAP_COOKIE, verifyTimetrap } from "@/lib/timetrap";
import {
  globalIpHourLimit,
  perFormHourLimit,
  perFormShortLimit,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(req: NextRequest) {
  const fwd = headers().get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.ip ?? "0.0.0.0";
}

function genericFail() {
  return NextResponse.json({ success: false }, { status: 400 });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return genericFail();
  }

  const parsed = publicSubmitPayloadSchema.safeParse(body);
  if (!parsed.success) return genericFail();

  const { token, turnstileToken, honeypot, respondent, answers } = parsed.data;
  // Honeypot: silent reject by returning a synthetic success.
  if (honeypot && honeypot.length > 0) {
    return NextResponse.json({ success: true, responseId: "bot" });
  }

  const ip = clientIp(req);
  const ipHash = hashIp(ip);
  const ua = req.headers.get("user-agent")?.slice(0, 200) ?? "";

  // Time-trap: cookie must exist and minimum render-to-submit time elapsed.
  const ttCookie = cookies().get(TIMETRAP_COOKIE)?.value;
  if (!ttCookie) return genericFail();
  const tt = await verifyTimetrap(ttCookie, token);
  if (!tt.ok) return genericFail();

  // Turnstile
  const turnOk = await verifyTurnstile(turnstileToken, ip);
  if (!turnOk) return genericFail();

  // Rate limits
  const rlShort = await perFormShortLimit().limit(`${token}:${ipHash}`);
  if (!rlShort.success) return genericFail();
  const rlHour = await perFormHourLimit().limit(`${token}:${ipHash}`);
  if (!rlHour.success) return genericFail();
  const rlGlobal = await globalIpHourLimit().limit(ipHash);
  if (!rlGlobal.success) return genericFail();

  const admin = createAdminClient();

  // Lookup form by token
  const { data: form } = await admin
    .from("forms")
    .select("*")
    .eq("public_token", token)
    .maybeSingle();
  if (!form || form.status !== "published" || !form.settings.allow_anonymous) {
    return genericFail();
  }
  const closeAt = form.settings.close_at ? new Date(form.settings.close_at) : null;
  if (closeAt && closeAt < new Date()) return genericFail();

  // Spam blocklist
  const { data: block } = await admin
    .from("spam_blocks")
    .select("blocked_until")
    .eq("ip_hash", ipHash)
    .maybeSingle();
  if (block?.blocked_until && new Date(block.blocked_until) > new Date()) {
    // Treat blocked IPs the same as a bot — synthetic success.
    return NextResponse.json({ success: true, responseId: "blocked" });
  }

  // Optional submission cap
  if (form.settings.public_submission_cap) {
    const { count } = await admin
      .from("responses")
      .select("id", { count: "exact", head: true })
      .eq("form_id", form.id)
      .eq("submitted_via", "public");
    if ((count ?? 0) >= form.settings.public_submission_cap) {
      await admin.from("forms").update({ status: "closed" }).eq("id", form.id);
      return genericFail();
    }
  }

  // Validate answers against the form's questions
  const { data: questions } = await admin
    .from("questions")
    .select("*")
    .eq("form_id", form.id)
    .order("position");
  const schema = buildSubmissionSchema(questions ?? []);

  const answerMap: Record<string, unknown> = {};
  for (const a of answers as Record<string, unknown>[] | { question_id: string; value: unknown }[]) {
    const entry = a as { question_id: string; value: unknown };
    if (entry.question_id) answerMap[entry.question_id] = entry.value;
  }
  const validated = schema.safeParse(answerMap);
  if (!validated.success) return genericFail();

  const rpcAnswers = (questions ?? []).map((q) => ({
    question_id: q.id,
    value: answerMap[q.id] ?? null,
  }));

  const { data: rpcResult, error } = await admin.rpc("submit_public_response", {
    p_form_id: form.id,
    p_answers: rpcAnswers,
    p_name: respondent?.name ?? null,
    p_email: respondent?.email ?? null,
    p_ip_hash: ipHash,
    p_user_agent: ua,
  });
  if (error) return genericFail();

  // Burst detection: notify the form owner once per burst window.
  const burstSince = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { count: burstCount } = await admin
    .from("responses")
    .select("id", { count: "exact", head: true })
    .eq("form_id", form.id)
    .eq("submitted_via", "public")
    .gt("submitted_at", burstSince);
  if ((burstCount ?? 0) > 20) {
    const { count: existing } = await admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", form.owner_id)
      .eq("kind", "burst_detected")
      .is("read_at", null)
      .gt("created_at", burstSince);
    if (!existing) {
      await admin.from("notifications").insert({
        user_id: form.owner_id,
        kind: "burst_detected",
        message: `Unusual activity on "${form.title}": ${burstCount} public submissions in 5 minutes.`,
        metadata: { form_id: form.id, count: burstCount },
      });
    }
  }

  return NextResponse.json({ success: true, responseId: rpcResult });
}
