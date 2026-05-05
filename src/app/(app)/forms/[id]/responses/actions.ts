"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

async function ensureOwner(formId: string) {
  const { user } = await requireUser();
  const supabase = createClient();
  const { data: form } = await supabase
    .from("forms")
    .select("id, owner_id")
    .eq("id", formId)
    .maybeSingle();
  if (!form || form.owner_id !== user.id) throw new Error("Not allowed");
  return { user, supabase };
}

export async function deleteResponse(formId: string, responseId: string) {
  const { user, supabase } = await ensureOwner(formId);
  const { error } = await supabase
    .from("responses")
    .delete()
    .eq("id", responseId)
    .eq("form_id", formId);
  if (error) throw new Error(error.message);
  await writeAudit({
    actorId: user.id,
    action: "response.deleted",
    targetType: "response",
    targetId: responseId,
  });
  revalidatePath(`/forms/${formId}/responses`);
}

export async function markResponseSpam(formId: string, responseId: string) {
  const { user, supabase } = await ensureOwner(formId);
  const { data: response } = await supabase
    .from("responses")
    .select("ip_hash")
    .eq("id", responseId)
    .eq("form_id", formId)
    .maybeSingle();
  if (!response?.ip_hash) {
    // Internal responses don't have ip_hash; just delete the response.
    await supabase.from("responses").delete().eq("id", responseId);
  } else {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("spam_blocks")
      .select("count")
      .eq("ip_hash", response.ip_hash)
      .maybeSingle();
    const nextCount = (existing?.count ?? 0) + 1;
    const blockedUntil =
      nextCount > 3 ? new Date(Date.now() + 24 * 3600 * 1000).toISOString() : null;
    await admin.from("spam_blocks").upsert({
      ip_hash: response.ip_hash,
      count: nextCount,
      blocked_until: blockedUntil,
      updated_at: new Date().toISOString(),
    });
    await supabase.from("responses").delete().eq("id", responseId);
  }
  await writeAudit({
    actorId: user.id,
    action: "response.spam_marked",
    targetType: "response",
    targetId: responseId,
  });
  revalidatePath(`/forms/${formId}/responses`);
}

export async function logExport(formId: string, kind: "csv" | "json") {
  const { user } = await ensureOwner(formId);
  await writeAudit({
    actorId: user.id,
    action: "data.exported",
    targetType: "form",
    targetId: formId,
    metadata: { kind },
  });
}
