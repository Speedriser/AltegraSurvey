export const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/privacy",
] as const;

export const PUBLIC_PATH_PREFIXES = ["/p/", "/api/public/"] as const;

export const QUESTION_TYPES = [
  "short_text",
  "long_text",
  "single_choice",
  "multi_choice",
  "rating",
  "date",
  "number",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const FORM_STATUSES = ["draft", "published", "closed"] as const;
export type FormStatus = (typeof FORM_STATUSES)[number];

export const RETENTION_OPTIONS = [
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: 180, label: "180 days" },
  { value: 365, label: "365 days" },
  { value: null, label: "Indefinite" },
] as const;

// Time-trap minimum render-to-submit duration for public forms
export const MIN_PUBLIC_SUBMIT_MS = 3000;
