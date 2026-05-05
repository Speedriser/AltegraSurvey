"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCsv, type ExportRow } from "@/lib/csv";
import { logExport } from "@/app/(app)/forms/[id]/responses/actions";
import type { AnswerRow, QuestionRow, ResponseRow } from "@/lib/types";

export function ExportTab({
  formId,
  formTitle,
  responses,
  answers,
  questions,
}: {
  formId: string;
  formTitle: string;
  responses: ResponseRow[];
  answers: AnswerRow[];
  questions: QuestionRow[];
}) {
  const rows: ExportRow[] = responses.map((r) => {
    const myAns = answers.filter((a) => a.response_id === r.id);
    const map: Record<string, unknown> = {};
    for (const a of myAns) map[a.question_id] = a.value;
    return {
      responseId: r.id,
      source: r.submitted_via,
      respondent:
        r.respondent_name ??
        r.respondent_email ??
        (r.respondent_id ? "Internal user" : "Anonymous"),
      submittedAt: r.submitted_at,
      answers: map,
    };
  });

  const safeTitle = formTitle.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60) || "form";

  function downloadBlob(content: string, mime: string, ext: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeTitle}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCsv() {
    const csv = buildCsv(rows, questions);
    downloadBlob(csv, "text/csv", "csv");
    await logExport(formId, "csv");
  }

  async function handleJson() {
    const json = JSON.stringify({ form: formTitle, rows }, null, 2);
    downloadBlob(json, "application/json", "json");
    await logExport(formId, "json");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Export all responses as CSV or JSON. Each export is recorded in the
          audit log.
        </p>
        <div className="flex gap-2">
          <Button onClick={handleCsv}>
            <Download className="mr-2 h-4 w-4" /> Download CSV
          </Button>
          <Button variant="outline" onClick={handleJson}>
            <Download className="mr-2 h-4 w-4" /> Download JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
