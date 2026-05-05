"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import {
  formDetailsSchema,
  formSettingsSchema,
  questionDraftSchema,
} from "@/lib/validations";
import type { FormSettings, QuestionType } from "@/lib/types";

const slugAlphabet = "abcdefghijklmnopqrstuvwxyz0123456789";

function makeSlug() {
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += slugAlphabet[Math.floor(Math.random() * slugAlphabet.length)];
  }
  return out;
}

const defaultSettings: FormSettings = {
  allow_anonymous: false,
  collect_respondent_info: false,
  one_response_per_user: false,
  close_at: null,
  privacy_notice: null,
  retention_days: 90,
  public_submission_cap: null,
};

export async function createForm() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("forms")
    .insert({
      owner_id: user.id,
      title: "Untitled form",
      slug: makeSlug(),
      status: "draft",
      settings: defaultSettings,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error("Could not create form");

  await writeAudit({
    actorId: user.id,
    action: "form.created",
    targetType: "form",
    targetId: data.id,
  });

  revalidatePath("/dashboard");
  redirect(`/forms/${data.id}/edit`);
}

async function ownForm(formId: string) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .eq("id", formId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (error || !data) throw new Error("Form not found");
  return { supabase, user, form: data };
}

export async function updateFormDetails(
  formId: string,
  input: { title: string; description: string | null },
) {
  const parsed = formDetailsSchema.parse(input);
  const { supabase, form } = await ownForm(formId);
  const { error } = await supabase
    .from("forms")
    .update({
      title: parsed.title,
      description: parsed.description ?? null,
    })
    .eq("id", form.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/forms/${form.id}/edit`);
}

export async function updateFormSettings(
  formId: string,
  input: FormSettings,
) {
  const parsed = formSettingsSchema.parse(input);
  const { supabase, form } = await ownForm(formId);
  // Privacy notice required when public sharing is enabled.
  if (parsed.allow_anonymous && !parsed.privacy_notice?.trim()) {
    throw new Error(
      "A privacy notice is required when public sharing is enabled.",
    );
  }
  const { error } = await supabase
    .from("forms")
    .update({ settings: parsed })
    .eq("id", form.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/forms/${form.id}/edit`);
}

const questionsInputSchema = z.object({
  questions: z.array(questionDraftSchema),
});

export async function saveQuestions(
  formId: string,
  questions: z.infer<typeof questionsInputSchema>["questions"],
) {
  const { questions: parsed } = questionsInputSchema.parse({ questions });
  const { supabase, form } = await ownForm(formId);

  // Replace strategy: delete then insert. Cascades to answers via FK on delete cascade,
  // but in practice this should only run before any responses are collected.
  const { error: delErr } = await supabase
    .from("questions")
    .delete()
    .eq("form_id", form.id);
  if (delErr) throw new Error(delErr.message);

  if (parsed.length === 0) {
    revalidatePath(`/forms/${form.id}/edit`);
    return;
  }

  const rows = parsed.map((q, idx) => ({
    form_id: form.id,
    type: q.type as QuestionType,
    label: q.label,
    description: q.description ?? null,
    position: idx,
    required: q.required,
    options: q.options ?? null,
  }));
  const { error } = await supabase.from("questions").insert(rows);
  if (error) throw new Error(error.message);

  revalidatePath(`/forms/${form.id}/edit`);
  revalidatePath(`/forms/${form.id}/preview`);
}

export async function publishForm(formId: string) {
  const { supabase, user, form } = await ownForm(formId);
  const { count } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("form_id", form.id);
  if (!count) throw new Error("Add at least one question before publishing.");

  const { error } = await supabase
    .from("forms")
    .update({ status: "published" })
    .eq("id", form.id);
  if (error) throw new Error(error.message);

  await writeAudit({
    actorId: user.id,
    action: "form.published",
    targetType: "form",
    targetId: form.id,
  });
  revalidatePath(`/forms/${form.id}/edit`);
  revalidatePath("/dashboard");
}

export async function unpublishForm(formId: string) {
  const { supabase, user, form } = await ownForm(formId);
  const { error } = await supabase
    .from("forms")
    .update({ status: "draft" })
    .eq("id", form.id);
  if (error) throw new Error(error.message);
  await writeAudit({
    actorId: user.id,
    action: "form.unpublished",
    targetType: "form",
    targetId: form.id,
  });
  revalidatePath(`/forms/${form.id}/edit`);
  revalidatePath("/dashboard");
}

export async function closeForm(formId: string) {
  const { supabase, user, form } = await ownForm(formId);
  const { error } = await supabase
    .from("forms")
    .update({ status: "closed" })
    .eq("id", form.id);
  if (error) throw new Error(error.message);
  await writeAudit({
    actorId: user.id,
    action: "form.closed",
    targetType: "form",
    targetId: form.id,
  });
  revalidatePath(`/forms/${form.id}/edit`);
  revalidatePath("/dashboard");
}

export async function deleteForm(formId: string) {
  const { supabase, user, form } = await ownForm(formId);
  const { error } = await supabase.from("forms").delete().eq("id", form.id);
  if (error) throw new Error(error.message);
  await writeAudit({
    actorId: user.id,
    action: "form.deleted",
    targetType: "form",
    targetId: form.id,
  });
  revalidatePath("/dashboard");
}

export async function duplicateForm(formId: string) {
  const { supabase, user, form } = await ownForm(formId);
  const { data: questions } = await supabase
    .from("questions")
    .select("type, label, description, position, required, options")
    .eq("form_id", form.id)
    .order("position");

  const { data: clone, error } = await supabase
    .from("forms")
    .insert({
      owner_id: user.id,
      title: `${form.title} (copy)`,
      description: form.description,
      slug: makeSlug(),
      status: "draft",
      settings: { ...form.settings, close_at: null },
      public_token: null,
    })
    .select("id")
    .single();
  if (error || !clone) throw new Error("Could not duplicate form");

  if (questions?.length) {
    await supabase.from("questions").insert(
      questions.map((q) => ({ ...q, form_id: clone.id })),
    );
  }

  await writeAudit({
    actorId: user.id,
    action: "form.created",
    targetType: "form",
    targetId: clone.id,
    metadata: { duplicated_from: form.id },
  });
  revalidatePath("/dashboard");
  return clone.id;
}

// Public sharing
export async function generatePublicToken(formId: string) {
  const { supabase, user, form } = await ownForm(formId);
  const token = nanoid(21);
  const { error } = await supabase
    .from("forms")
    .update({ public_token: token })
    .eq("id", form.id);
  if (error) throw new Error(error.message);
  await writeAudit({
    actorId: user.id,
    action: "form.public_token_generated",
    targetType: "form",
    targetId: form.id,
  });
  revalidatePath(`/forms/${form.id}/edit`);
  return token;
}

export async function regeneratePublicToken(formId: string) {
  const { supabase, user, form } = await ownForm(formId);
  const token = nanoid(21);
  const { error } = await supabase
    .from("forms")
    .update({ public_token: token })
    .eq("id", form.id);
  if (error) throw new Error(error.message);
  await writeAudit({
    actorId: user.id,
    action: "form.public_token_regenerated",
    targetType: "form",
    targetId: form.id,
  });
  revalidatePath(`/forms/${form.id}/edit`);
  return token;
}

export async function disablePublicToken(formId: string) {
  const { supabase, user, form } = await ownForm(formId);
  const { error } = await supabase
    .from("forms")
    .update({ public_token: null })
    .eq("id", form.id);
  if (error) throw new Error(error.message);
  await writeAudit({
    actorId: user.id,
    action: "form.public_token_disabled",
    targetType: "form",
    targetId: form.id,
  });
  revalidatePath(`/forms/${form.id}/edit`);
}
