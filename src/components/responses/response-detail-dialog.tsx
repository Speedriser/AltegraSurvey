"use client";

import { useTransition } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  deleteResponse,
  markResponseSpam,
} from "@/app/(app)/forms/[id]/responses/actions";
import type { AnswerRow, QuestionRow, ResponseRow } from "@/lib/types";

export function ResponseDetailDialog({
  open,
  onOpenChange,
  response,
  answers,
  questions,
  formId,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  response: ResponseRow | null;
  answers: AnswerRow[];
  questions: QuestionRow[];
  formId: string;
  onChanged: () => void;
}) {
  const [pending, start] = useTransition();
  if (!response) return null;

  const byQuestion = new Map(answers.map((a) => [a.question_id, a]));
  const respondent =
    response.respondent_name ??
    response.respondent_email ??
    (response.respondent_id ? "Internal user" : "Anonymous");

  function exportJson() {
    const blob = new Blob(
      [
        JSON.stringify(
          { response, answers: questions.map((q) => byQuestion.get(q.id) ?? null) },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${response.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDelete() {
    start(async () => {
      try {
        await deleteResponse(formId, response.id);
        toast.success("Response deleted");
        onOpenChange(false);
        onChanged();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function handleSpam() {
    start(async () => {
      try {
        await markResponseSpam(formId, response.id);
        toast.success("Marked as spam");
        onOpenChange(false);
        onChanged();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Response
            <Badge variant="outline">{response.submitted_via}</Badge>
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {respondent} · {new Date(response.submitted_at).toLocaleString()}
          </p>
          {response.submitted_via === "public" &&
          (response.respondent_name || response.respondent_email) ? (
            <p className="text-xs text-yellow-700">
              self-reported, unverified
            </p>
          ) : null}
        </DialogHeader>

        <div className="space-y-4">
          {questions.map((q) => {
            const a = byQuestion.get(q.id);
            return (
              <div key={q.id} className="space-y-1">
                <p className="text-sm font-medium">{q.label}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDisplay(q, a?.value)}
                </p>
              </div>
            );
          })}
        </div>

        <Separator />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="outline" onClick={exportJson}>
            Export JSON
          </Button>
          <div className="flex gap-2">
            {response.submitted_via === "public" ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={pending}>
                    <AlertTriangle className="mr-2 h-4 w-4" /> Mark spam
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mark as spam?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This deletes the response and increments the
                      per-IP-hash spam counter. Three or more strikes from
                      the same IP hash trigger a 24h block.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSpam}>
                      Mark spam
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={pending}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete response?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes the response and its answers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatDisplay(q: QuestionRow, v: unknown) {
  if (v === null || v === undefined || v === "") return "—";
  if (q.type === "single_choice") {
    return (q.options?.choices ?? []).find((c) => c.id === v)?.label ?? String(v);
  }
  if (q.type === "multi_choice" && Array.isArray(v)) {
    return v
      .map(
        (id) =>
          (q.options?.choices ?? []).find((c) => c.id === id)?.label ?? String(id),
      )
      .join(", ");
  }
  return String(v);
}
