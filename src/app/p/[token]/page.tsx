import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicRenderer } from "@/components/form-renderer/public-renderer";
import { createAdminClient } from "@/lib/supabase/admin";
import { issueTimetrapToken, TIMETRAP_COOKIE } from "@/lib/timetrap";

export const dynamic = "force-dynamic";
export const metadata = { title: "Form — Altegra" };

export default async function PublicFormPage({
  params,
}: {
  params: { token: string };
}) {
  const admin = createAdminClient();
  const { data: form } = await admin
    .from("forms")
    .select("*")
    .eq("public_token", params.token)
    .maybeSingle();
  if (!form || form.status !== "published" || !form.settings.allow_anonymous) {
    notFound();
  }

  const closeAt = form.settings.close_at ? new Date(form.settings.close_at) : null;
  if (closeAt && closeAt < new Date()) {
    return (
      <main className="container py-10">
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
      </main>
    );
  }

  const { data: questions } = await admin
    .from("questions")
    .select("*")
    .eq("form_id", form.id)
    .order("position");

  const jwt = await issueTimetrapToken(params.token);
  cookies().set(TIMETRAP_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 2,
  });

  return (
    <main className="container py-10">
      <PublicRenderer form={form} questions={questions ?? []} token={params.token} />
    </main>
  );
}
