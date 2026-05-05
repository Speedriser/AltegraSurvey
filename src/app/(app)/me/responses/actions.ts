"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function deleteOwnResponse(responseId: string) {
  const { user } = await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("responses")
    .delete()
    .eq("id", responseId)
    .eq("respondent_id", user.id);
  if (error) throw new Error(error.message);
  await writeAudit({
    actorId: user.id,
    action: "response.deleted",
    targetType: "response",
    targetId: responseId,
    metadata: { source: "self_service" },
  });
  revalidatePath("/me/responses");
}
