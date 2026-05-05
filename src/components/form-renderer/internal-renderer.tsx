"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldRenderer } from "./field-renderer";
import { buildSubmissionSchema } from "@/lib/validations";
import type { FormRow, QuestionRow } from "@/lib/types";
import { submitInternal } from "@/app/f/[slug]/actions";

export function InternalRenderer({
  form,
  questions,
}: {
  form: FormRow;
  questions: QuestionRow[];
}) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const schema = buildSubmissionSchema(questions);
  const methods = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(
      questions.map((q) => [q.id, q.type === "multi_choice" ? [] : ""]),
    ),
  });
  const { control, handleSubmit, formState } = methods;

  if (submitted) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Thanks for responding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your response has been recorded.
          </p>
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const answers = questions.map((q) => ({
        question_id: q.id,
        value: values[q.id] ?? null,
      }));
      await submitInternal(form.id, answers);
      setSubmitted(true);
      toast.success("Response submitted");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message || "Submission failed");
    }
  });

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{form.title}</CardTitle>
        {form.description ? (
          <p className="text-sm text-muted-foreground">{form.description}</p>
        ) : null}
      </CardHeader>
      <CardContent>
        <FormProvider {...methods}>
          <form onSubmit={onSubmit} className="space-y-6">
            {questions.map((q) => (
              <FieldRenderer
                key={q.id}
                question={q}
                control={control}
                errors={formState.errors}
              />
            ))}
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Submitting…" : "Submit"}
            </Button>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
