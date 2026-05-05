import { z } from "zod";
import type {
  ChoiceOption,
  FormSettings,
  QuestionRow,
  QuestionType,
} from "@/lib/types";

export const questionTypeSchema = z.enum([
  "short_text",
  "long_text",
  "single_choice",
  "multi_choice",
  "rating",
  "date",
  "number",
]);

export const choiceOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(200),
});

export const questionOptionsSchema = z
  .object({
    choices: z.array(choiceOptionSchema).optional(),
    min: z.number().int().min(1).max(10).optional(),
    max: z.number().int().min(1).max(10).optional(),
  })
  .nullable()
  .optional();

export const questionDraftSchema = z.object({
  id: z.string().uuid().optional(),
  type: questionTypeSchema,
  label: z.string().min(1, "Question label is required").max(500),
  description: z.string().max(1000).optional().nullable(),
  position: z.number().int().min(0),
  required: z.boolean().default(false),
  options: questionOptionsSchema,
});
export type QuestionDraft = z.infer<typeof questionDraftSchema>;

export const formSettingsSchema = z.object({
  allow_anonymous: z.boolean().default(false),
  collect_respondent_info: z.boolean().default(false),
  one_response_per_user: z.boolean().default(false),
  close_at: z.string().datetime().nullable().default(null),
  privacy_notice: z.string().max(2000).nullable().default(null),
  retention_days: z
    .union([z.literal(30), z.literal(90), z.literal(180), z.literal(365), z.null()])
    .default(90),
  public_submission_cap: z.number().int().min(1).nullable().default(null),
}) satisfies z.ZodType<FormSettings>;

export const formDetailsSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
});

// Build a Zod schema from a question list to validate a submission payload.
// Returns a schema mapping question_id -> typed value.
export function buildSubmissionSchema(questions: QuestionRow[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const q of questions) {
    let field: z.ZodTypeAny;
    switch (q.type as QuestionType) {
      case "short_text":
        field = z.string().max(500);
        break;
      case "long_text":
        field = z.string().max(5000);
        break;
      case "single_choice": {
        const ids = (q.options?.choices ?? []).map((c: ChoiceOption) => c.id);
        field = ids.length ? z.enum(ids as [string, ...string[]]) : z.string();
        break;
      }
      case "multi_choice": {
        const ids = (q.options?.choices ?? []).map((c: ChoiceOption) => c.id);
        const inner = ids.length ? z.enum(ids as [string, ...string[]]) : z.string();
        field = z.array(inner).max(50);
        break;
      }
      case "rating":
        field = z.number().min(q.options?.min ?? 1).max(q.options?.max ?? 5);
        break;
      case "date":
        field = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
        break;
      case "number":
        field = z.number().finite();
        break;
      default:
        field = z.unknown();
    }

    if (!q.required) field = field.nullable().optional();
    shape[q.id] = field;
  }

  return z.object(shape);
}

export const publicRespondentSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().max(254).optional(),
});

export const publicSubmitPayloadSchema = z.object({
  token: z.string().min(10).max(64),
  consent: z.literal(true),
  honeypot: z.string().max(0).optional().or(z.literal("")),
  turnstileToken: z.string().min(1),
  respondent: publicRespondentSchema.optional(),
  answers: z.record(z.unknown()),
});
