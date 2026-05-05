import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { DeleteOwnResponseButton } from "./delete-button";

export const metadata = { title: "My responses — Altegra Forms" };

type Row = {
  id: string;
  submitted_at: string;
  forms: { id: string; title: string } | null;
  answers: { question_id: string; value: unknown }[];
};

export default async function MyResponsesPage() {
  const { supabase, user } = await requireUser();

  const { data: responses } = await supabase
    .from("responses")
    .select("id, submitted_at, forms ( id, title ), answers ( question_id, value )")
    .eq("respondent_id", user.id)
    .order("submitted_at", { ascending: false });

  const rows = ((responses as unknown) as Row[] | null) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">My responses</h1>
        <p className="text-sm text-muted-foreground">
          Forms you&apos;ve responded to. You can request deletion of any
          response at any time.
        </p>
      </div>
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You haven&apos;t responded to any forms yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">
                    {r.forms?.title ?? "Form removed"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(r.submitted_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{r.answers.length} answers</Badge>
                  <DeleteOwnResponseButton responseId={r.id} />
                </div>
              </CardHeader>
              <CardContent>
                <details>
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    View answers
                  </summary>
                  <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify(r.answers, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
