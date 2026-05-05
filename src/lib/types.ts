// Hand-written stubs for the schema in /supabase/migrations/0001_init.sql.
// Replace with `supabase gen types typescript` output when the project is provisioned.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type QuestionType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multi_choice"
  | "rating"
  | "date"
  | "number";

export type FormStatus = "draft" | "published" | "closed";
export type SubmittedVia = "internal" | "public";

export type FormSettings = {
  allow_anonymous?: boolean;
  collect_respondent_info?: boolean;
  one_response_per_user?: boolean;
  close_at?: string | null;
  privacy_notice?: string | null;
  retention_days?: number | null;
  public_submission_cap?: number | null;
};

export type ChoiceOption = { id: string; label: string };
export type RatingOptions = { min: number; max: number };
export type QuestionOptions = { choices?: ChoiceOption[] } & Partial<RatingOptions>;

type Tbl<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Tbl<{
        id: string;
        email: string;
        full_name: string | null;
        created_at: string;
      }>;
      forms: Tbl<{
        id: string;
        owner_id: string;
        title: string;
        description: string | null;
        slug: string;
        public_token: string | null;
        status: FormStatus;
        settings: FormSettings;
        created_at: string;
        updated_at: string;
      }>;
      questions: Tbl<{
        id: string;
        form_id: string;
        type: QuestionType;
        label: string;
        description: string | null;
        position: number;
        required: boolean;
        options: QuestionOptions | null;
      }>;
      responses: Tbl<{
        id: string;
        form_id: string;
        respondent_id: string | null;
        respondent_name: string | null;
        respondent_email: string | null;
        submitted_via: SubmittedVia;
        ip_hash: string | null;
        user_agent: string | null;
        submitted_at: string;
      }>;
      answers: Tbl<{
        id: string;
        response_id: string;
        question_id: string;
        value: Json;
      }>;
      audit_log: Tbl<{
        id: string;
        actor_id: string | null;
        action: string;
        target_type: string | null;
        target_id: string | null;
        metadata: Json | null;
        created_at: string;
      }>;
      notifications: Tbl<{
        id: string;
        user_id: string;
        kind: string;
        message: string;
        metadata: Json | null;
        read_at: string | null;
        created_at: string;
      }>;
      spam_blocks: Tbl<{
        ip_hash: string;
        count: number;
        blocked_until: string | null;
        updated_at: string;
      }>;
      app_settings: Tbl<{
        id: boolean;
        allowed_email_domain: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      submit_internal_response: {
        Args: { p_form_id: string; p_answers: Json };
        Returns: string;
      };
      submit_public_response: {
        Args: {
          p_form_id: string;
          p_answers: Json;
          p_name: string | null;
          p_email: string | null;
          p_ip_hash: string;
          p_user_agent: string;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type FormRow = Database["public"]["Tables"]["forms"]["Row"];
export type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];
export type ResponseRow = Database["public"]["Tables"]["responses"]["Row"];
export type AnswerRow = Database["public"]["Tables"]["answers"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
