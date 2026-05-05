"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponseDetailDialog } from "./response-detail-dialog";
import type { AnswerRow, QuestionRow, ResponseRow } from "@/lib/types";

export function ResponseTable({
  formId,
  responses,
  answers,
  questions,
}: {
  formId: string;
  responses: ResponseRow[];
  answers: AnswerRow[];
  questions: QuestionRow[];
}) {
  const router = useRouter();
  const [source, setSource] = useState<"all" | "internal" | "public">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ResponseRow | null>(null);

  const answersByResponse = useMemo(() => {
    const m = new Map<string, AnswerRow[]>();
    for (const a of answers) {
      const arr = m.get(a.response_id) ?? [];
      arr.push(a);
      m.set(a.response_id, arr);
    }
    return m;
  }, [answers]);

  const filtered = responses.filter((r) => {
    if (source !== "all" && r.submitted_via !== source) return false;
    if (search) {
      const hay = `${r.respondent_name ?? ""} ${r.respondent_email ?? ""}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="internal">Internal</SelectItem>
            <SelectItem value="public">Public</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Search name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Submitted</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Respondent</TableHead>
              <TableHead>Preview</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => {
              const ans = answersByResponse.get(r.id) ?? [];
              const preview = ans
                .map((a) => stringifyAnswer(a.value))
                .filter(Boolean)
                .slice(0, 2)
                .join(" · ");
              return (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(r)}
                >
                  <TableCell>
                    {new Date(r.submitted_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.submitted_via}</Badge>
                  </TableCell>
                  <TableCell>
                    {r.respondent_name ??
                      r.respondent_email ??
                      (r.respondent_id ? "Internal user" : "Anonymous")}
                  </TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">
                    {preview || "—"}
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No responses match your filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
      <ResponseDetailDialog
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        response={selected}
        answers={selected ? answersByResponse.get(selected.id) ?? [] : []}
        questions={questions}
        formId={formId}
        onChanged={() => router.refresh()}
      />
    </div>
  );
}

function stringifyAnswer(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}
