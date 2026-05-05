"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

const answerSchema = z.object({
  question_id: z.string().uuid(),
  value: z.unknown(),
});

export async function submitInternal(
  formId: string,
  answers: z.infer<typeof answerSchema>[],
) {
  const parsed = z.array(answerSchema).parse(answers);
  await requireUser();
  const supabase = createClient();
  const { error } = await supabase.rpc("submit_internal_response", {
    p_form_id: formId,
    p_answers: parsed,
  });
  if (error) {
    if (error.message.includes("already_responded")) {
      throw new Error("You've already responded to this form.");
    }
    if (error.message.includes("form_closed")) {
      throw new Error("This form is closed.");
    }
    if (error.message.includes("form_not_published")) {
      throw new Error("This form isn't currently accepting responses.");
    }
    throw new Error("Submission failed. Please try again.");
  }
  revalidatePath("/me/responses");
}
