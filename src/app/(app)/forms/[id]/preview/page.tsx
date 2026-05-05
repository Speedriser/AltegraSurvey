import { notFound } from "next/navigation";
import { PreviewRenderer } from "@/components/form-renderer/preview-renderer";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Preview — Altegra Forms" };

export default async function PreviewPage({
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

  return <PreviewRenderer form={form} questions={questions ?? []} />;
}
