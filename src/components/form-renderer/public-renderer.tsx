"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldRenderer } from "./field-renderer";
import { ConsentBlock } from "./consent-block";
import { HoneypotField } from "./honeypot-field";
import { TurnstileWidget } from "./turnstile-widget";
import { buildSubmissionSchema } from "@/lib/validations";
import type { FormRow, QuestionRow } from "@/lib/types";

type SubmittedState = {
  responseId: string;
};

export function PublicRenderer({
  form,
  questions,
  token,
}: {
  form: FormRow;
  questions: QuestionRow[];
  token: string;
}) {
  const collectInfo = !!form.settings.collect_respondent_info;
  const [step, setStep] = useState<"intro" | "form">(
    collectInfo ? "intro" : "form",
  );
  const [submitted, setSubmitted] = useState<SubmittedState | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstile, setTurnstile] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = buildSubmissionSchema(questions);
  const methods = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(
      questions.map((q) => [q.id, q.type === "multi_choice" ? [] : ""]),
    ),
  });

  if (submitted) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Thanks for responding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Keep your response ID in case you need to request deletion. Email
              the form owner with this ID to exercise your right to erasure.
            </AlertDescription>
          </Alert>
          <div className="flex items-center gap-2">
            <Input readOnly value={submitted.responseId} />
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigator.clipboard
                  .writeText(submitted.responseId)
                  .then(() => toast.success("Copied"))
              }
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            See <Link href="/privacy" className="underline">privacy info</Link>{" "}
            for how to contact the form owner.
          </p>
        </CardContent>
      </Card>
    );
  }

  const onSubmit = methods.handleSubmit(async (values) => {
    setSubmitError(null);
    if (honeypot) {
      // Silent reject for bots — pretend we submitted.
      setSubmitted({ responseId: "—" });
      return;
    }
    if (!consent) {
      setSubmitError("Please confirm you've read how your data is used.");
      return;
    }
    if (!turnstile) {
      setSubmitError("Please complete the bot challenge.");
      return;
    }

    const answers = questions.map((q) => ({
      question_id: q.id,
      value: values[q.id] ?? null,
    }));

    try {
      const res = await fetch("/api/public/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          consent: true,
          honeypot: "",
          turnstileToken: turnstile,
          respondent: collectInfo ? { name, email } : undefined,
          answers,
        }),
      });
      const data = (await res.json()) as
        | { success: true; responseId: string }
        | { success: false };
      if (!res.ok || !data.success) {
        setSubmitError("Submission failed, please try again.");
        return;
      }
      setSubmitted({ responseId: data.responseId });
    } catch {
      setSubmitError("Submission failed, please try again.");
    }
  });

  if (step === "intro") {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>{form.title}</CardTitle>
          {form.description ? (
            <p className="text-sm text-muted-foreground">{form.description}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <ConsentBlock
            notice={form.settings.privacy_notice ?? null}
            retentionDays={form.settings.retention_days ?? null}
            consent={consent}
            onConsentChange={setConsent}
          />
          <div className="space-y-2">
            <Label>Your name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Your email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button
            type="button"
            disabled={!consent}
            onClick={() => setStep("form")}
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

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
                control={methods.control}
                errors={methods.formState.errors}
              />
            ))}

            {!collectInfo ? (
              <ConsentBlock
                notice={form.settings.privacy_notice ?? null}
                retentionDays={form.settings.retention_days ?? null}
                consent={consent}
                onConsentChange={setConsent}
              />
            ) : null}

            <HoneypotField value={honeypot} onChange={setHoneypot} />
            <TurnstileWidget onToken={setTurnstile} />

            {submitError ? (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="submit"
              disabled={methods.formState.isSubmitting || !consent || !turnstile}
            >
              {methods.formState.isSubmitting ? "Submitting…" : "Submit"}
            </Button>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
