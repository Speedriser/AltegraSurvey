import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InternalRenderer } from "@/components/form-renderer/internal-renderer";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Respond — Altegra Forms" };

export default async function InternalFormPage({
  params,
}: {
  params: { slug: string };
}) {
  const { supabase, user } = await requireUser();

  const { data: form } = await supabase
    .from("forms")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!form) notFound();

  if (form.status !== "published") {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>This form isn&apos;t accepting responses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The form is currently {form.status}.
          </p>
        </CardContent>
      </Card>
    );
  }

  const closeAt = form.settings.close_at
    ? new Date(form.settings.close_at)
    : null;
  if (closeAt && closeAt < new Date()) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>This form is closed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The submission window ended {closeAt.toLocaleString()}.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (form.settings.one_response_per_user) {
    const { count } = await supabase
      .from("responses")
      .select("id", { count: "exact", head: true })
      .eq("form_id", form.id)
      .eq("respondent_id", user.id);
    if ((count ?? 0) > 0) {
      return (
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>You&apos;ve already responded</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                This form only allows one response per user.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("form_id", form.id)
    .order("position");

  return <InternalRenderer form={form} questions={questions ?? []} />;
}
