"use client";

import { useForm } from "react-hook-form";
import { FieldRenderer } from "./field-renderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { FormRow, QuestionRow } from "@/lib/types";

export function PreviewRenderer({
  form,
  questions,
}: {
  form: FormRow;
  questions: QuestionRow[];
}) {
  const { control, formState } = useForm<Record<string, unknown>>({
    defaultValues: {},
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Alert>
        <AlertDescription>
          This is a preview. Submissions are not saved.
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle>{form.title}</CardTitle>
          {form.description ? (
            <p className="text-sm text-muted-foreground">{form.description}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((q) => (
            <FieldRenderer
              key={q.id}
              question={q}
              control={control}
              errors={formState.errors}
            />
          ))}
          <Button type="button" disabled>
            Submit (preview)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
