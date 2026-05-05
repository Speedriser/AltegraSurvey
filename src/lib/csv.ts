import type { QuestionRow } from "@/lib/types";

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s: string;
  if (typeof v === "string") s = v;
  else if (Array.isArray(v)) s = v.join(", ");
  else s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export type ExportRow = {
  responseId: string;
  source: string;
  respondent: string;
  submittedAt: string;
  answers: Record<string, unknown>;
};

export function buildCsv(rows: ExportRow[], questions: QuestionRow[]): string {
  const header = [
    "response_id",
    "source",
    "respondent",
    "submitted_at",
    ...questions.map((q) => q.label),
  ];
  const lines = [header.map(csvEscape).join(",")];
  for (const r of rows) {
    const cols: unknown[] = [
      r.responseId,
      r.source,
      r.respondent,
      r.submittedAt,
      ...questions.map((q) => formatAnswer(q, r.answers[q.id])),
    ];
    lines.push(cols.map(csvEscape).join(","));
  }
  return lines.join("\n");
}

function formatAnswer(q: QuestionRow, value: unknown): unknown {
  if (value === null || value === undefined) return "";
  if (q.type === "single_choice") {
    const c = (q.options?.choices ?? []).find((c) => c.id === value);
    return c?.label ?? value;
  }
  if (q.type === "multi_choice" && Array.isArray(value)) {
    const labels = value.map((id) => {
      const c = (q.options?.choices ?? []).find((c) => c.id === id);
      return c?.label ?? id;
    });
    return labels.join(", ");
  }
  return value;
}
