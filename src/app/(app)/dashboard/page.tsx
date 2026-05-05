import Link from "next/link";
import { Plus, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Dashboard — Altegra Forms" };

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();

  const { data: forms } = await supabase
    .from("forms")
    .select("id, title, status, public_token, updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  const list = forms ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your forms</h1>
          <p className="text-sm text-muted-foreground">
            Create internal or public forms and view all responses you receive.
          </p>
        </div>
        <Button asChild>
          <Link href="/forms/new">
            <Plus className="mr-2 h-4 w-4" /> New form
          </Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FilePlus className="h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-medium">No forms yet</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Create your first form to start collecting responses internally
              or via public link.
            </p>
            <Button asChild>
              <Link href="/forms/new">
                <Plus className="mr-2 h-4 w-4" /> Create form
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <ul className="divide-y">
            {list.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <Link
                    href={`/forms/${f.id}/edit`}
                    className="font-medium hover:underline"
                  >
                    {f.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {f.status} · updated {new Date(f.updated_at).toLocaleString()}
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/forms/${f.id}/responses`}>Responses</Link>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
