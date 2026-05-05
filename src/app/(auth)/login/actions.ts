"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().email().max(254),
  next: z.string().optional(),
});

export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string };

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: "Please enter a valid email." };
  }

  const allowed = process.env.ALLOWED_EMAIL_DOMAIN?.toLowerCase();
  const domain = parsed.data.email.split("@")[1]?.toLowerCase();
  if (allowed && domain !== allowed) {
    return {
      status: "error",
      message: `Sign-ins are restricted to @${allowed} addresses.`,
    };
  }

  const supabase = createClient();
  const callback = new URL("/auth/callback", process.env.APP_URL!);
  if (parsed.data.next) callback.searchParams.set("next", parsed.data.next);

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: callback.toString() },
  });

  if (error) {
    return { status: "error", message: "Could not send magic link." };
  }
  return { status: "sent", email: parsed.data.email };
}
