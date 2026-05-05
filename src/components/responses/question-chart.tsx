"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnswerRow, QuestionRow } from "@/lib/types";

export function QuestionChart({
  question,
  answers,
}: {
  question: QuestionRow;
  answers: AnswerRow[];
}) {
  const total = answers.length;
  const values = answers.map((a) => a.value);

  if (
    question.type === "single_choice" ||
    question.type === "multi_choice"
  ) {
    const choices = question.options?.choices ?? [];
    const counts = new Map<string, number>(choices.map((c) => [c.id, 0]));
    for (const v of values) {
      const arr = Array.isArray(v) ? v : [v];
      for (const id of arr) if (typeof id === "string" && counts.has(id)) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    const data = choices.map((c) => ({
      label: c.label,
      count: counts.get(c.id) ?? 0,
      pct: total ? Math.round(((counts.get(c.id) ?? 0) / total) * 100) : 0,
    }));
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{question.label}</CardTitle>
          <p className="text-xs text-muted-foreground">{total} responses</p>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  if (question.type === "rating" || question.type === "number") {
    const nums = values.filter((v): v is number => typeof v === "number");
    const sum = nums.reduce((a, b) => a + b, 0);
    const avg = nums.length ? sum / nums.length : 0;
    const min = nums.length ? Math.min(...nums) : 0;
    const max = nums.length ? Math.max(...nums) : 0;

    const buckets = new Map<number, number>();
    for (const n of nums) buckets.set(n, (buckets.get(n) ?? 0) + 1);
    const data = Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([k, v]) => ({ label: String(k), count: v }));

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{question.label}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {nums.length} responses · avg {avg.toFixed(2)} · min {min} · max {max}
          </p>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  if (question.type === "date") {
    const buckets = new Map<string, number>();
    for (const v of values)
      if (typeof v === "string") buckets.set(v, (buckets.get(v) ?? 0) + 1);
    const data = Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => ({ label: k, count: v }));
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{question.label}</CardTitle>
          <p className="text-xs text-muted-foreground">{total} responses</p>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  // Text answers
  const texts = values
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .slice(0, 10);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{question.label}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {total} responses (showing latest 10)
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {texts.map((t, i) => (
            <li key={i} className="rounded-md border p-2">
              {t}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
