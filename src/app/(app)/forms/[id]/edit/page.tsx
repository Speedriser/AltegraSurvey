import { notFound } from "next/navigation";
import { FormBuilder } from "@/components/form-builder/form-builder";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Edit form — Altegra Forms" };

export default async function EditFormPage({
  params,
}: {
  params: { id: string };
}) {
  const { supabase, user } = await requireUser();

  const { data: form } = await supabase
    .from("forms")
    .select("*")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!form) notFound();

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("form_id", form.id)
    .order("position");

  return (
    <FormBuilder
      form={form}
      questions={questions ?? []}
      appUrl={process.env.APP_URL ?? ""}
    />
  );
}
