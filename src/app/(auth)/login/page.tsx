import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in — Altegra Forms" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(searchParams.next ?? "/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to Altegra Forms</CardTitle>
          <CardDescription>
            We&apos;ll email you a magic link. Only @
            {process.env.ALLOWED_EMAIL_DOMAIN ?? "altegra.com"} addresses are
            permitted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm next={searchParams.next} />
        </CardContent>
      </Card>
    </div>
  );
}
