"use client";

import { Card, CardContent } from "@/components/ui/card";
import { QuestionChart } from "./question-chart";
import type { AnswerRow, QuestionRow, ResponseRow } from "@/lib/types";

export function SummaryView({
  questions,
  responses,
  answers,
}: {
  questions: QuestionRow[];
  responses: ResponseRow[];
  answers: AnswerRow[];
}) {
  const total = responses.length;
  const internal = responses.filter((r) => r.submitted_via === "internal").length;
  const publicCount = total - internal;
  const last = responses[0]?.submitted_at;

  const byQuestion = new Map<string, AnswerRow[]>();
  for (const a of answers) {
    const arr = byQuestion.get(a.question_id) ?? [];
    arr.push(a);
    byQuestion.set(a.question_id, arr);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Stat label="Total responses" value={total} />
        <Stat label="Internal" value={internal} />
        <Stat label="Public" value={publicCount} />
        <Stat
          label="Latest"
          value={last ? new Date(last).toLocaleString() : "—"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {questions.map((q) => (
          <QuestionChart
            key={q.id}
            question={q}
            answers={byQuestion.get(q.id) ?? []}
          />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
