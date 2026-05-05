import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/types";

export type AuditAction =
  | "form.created"
  | "form.published"
  | "form.unpublished"
  | "form.closed"
  | "form.deleted"
  | "form.public_token_generated"
  | "form.public_token_regenerated"
  | "form.public_token_disabled"
  | "response.deleted"
  | "response.spam_marked"
  | "data.exported";

export async function writeAudit(params: {
  actorId: string | null;
  action: AuditAction;
  targetType?: string;
  targetId?: string | null;
  metadata?: Json;
}) {
  const admin = createAdminClient();
  await admin.from("audit_log").insert({
    actor_id: params.actorId,
    action: params.action,
    target_type: params.targetType ?? null,
    target_id: params.targetId ?? null,
    metadata: params.metadata ?? null,
  });
}
