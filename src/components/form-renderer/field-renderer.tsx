"use client";

import {
  Controller,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionRow } from "@/lib/types";

export function FieldRenderer({
  question,
  control,
  errors,
  disabled = false,
}: {
  question: QuestionRow;
  control: Control<Record<string, unknown>>;
  errors?: FieldErrors;
  disabled?: boolean;
}) {
  const errorMsg = (errors?.[question.id] as { message?: string })?.message;

  return (
    <div className="space-y-2">
      <Label className="text-base">
        {question.label}
        {question.required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {question.description ? (
        <p className="text-sm text-muted-foreground">{question.description}</p>
      ) : null}

      <Controller
        control={control}
        name={question.id}
        render={({ field }) => {
          const v = field.value;
          switch (question.type) {
            case "short_text":
              return (
                <Input
                  disabled={disabled}
                  value={(v as string) ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              );
            case "long_text":
              return (
                <Textarea
                  disabled={disabled}
                  value={(v as string) ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              );
            case "single_choice":
              return (
                <RadioGroup
                  value={(v as string) ?? ""}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  {(question.options?.choices ?? []).map((c) => (
                    <Label
                      key={c.id}
                      className="flex items-center gap-2 font-normal"
                    >
                      <RadioGroupItem value={c.id} />
                      {c.label}
                    </Label>
                  ))}
                </RadioGroup>
              );
            case "multi_choice": {
              const arr = (v as string[]) ?? [];
              return (
                <div className="space-y-2">
                  {(question.options?.choices ?? []).map((c) => (
                    <Label
                      key={c.id}
                      className="flex items-center gap-2 font-normal"
                    >
                      <Checkbox
                        disabled={disabled}
                        checked={arr.includes(c.id)}
                        onCheckedChange={(checked) =>
                          field.onChange(
                            checked
                              ? [...arr, c.id]
                              : arr.filter((x) => x !== c.id),
                          )
                        }
                      />
                      {c.label}
                    </Label>
                  ))}
                </div>
              );
            }
            case "rating": {
              const min = question.options?.min ?? 1;
              const max = question.options?.max ?? 5;
              const current = (v as number) ?? null;
              return (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(
                    (n) => (
                      <button
                        key={n}
                        type="button"
                        disabled={disabled}
                        onClick={() => field.onChange(n)}
                        className={`h-9 w-9 rounded-md border text-sm ${
                          current === n
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-background"
                        }`}
                      >
                        {n}
                      </button>
                    ),
                  )}
                </div>
              );
            }
            case "number":
              return (
                <Input
                  type="number"
                  disabled={disabled}
                  value={(v as number) ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
              );
            case "date":
              return (
                <Input
                  type="date"
                  disabled={disabled}
                  value={(v as string) ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              );
            default:
              return <span>Unsupported question type</span>;
          }
        }}
      />
      {errorMsg ? (
        <p className="text-xs text-destructive">{errorMsg}</p>
      ) : null}
    </div>
  );
}
