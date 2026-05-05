import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsesTabs } from "@/components/responses/responses-tabs";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Responses — Altegra Forms" };

export default async function ResponsesPage({
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

  const { data: responses } = await supabase
    .from("responses")
    .select("*")
    .eq("form_id", form.id)
    .order("submitted_at", { ascending: false });

  const responseIds = (responses ?? []).map((r) => r.id);
  const { data: answers } = responseIds.length
    ? await supabase
        .from("answers")
        .select("*")
        .in("response_id", responseIds)
    : { data: [] };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <ChevronLeft className="mr-1 h-4 w-4" /> Forms
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{form.title}</h1>
          <p className="text-xs text-muted-foreground">Responses dashboard</p>
        </div>
      </div>
      <ResponsesTabs
        formId={form.id}
        formTitle={form.title}
        questions={questions ?? []}
        responses={responses ?? []}
        answers={answers ?? []}
      />
    </div>
  );
}
