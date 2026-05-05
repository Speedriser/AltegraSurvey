// SERVICE-ROLE CLIENT — bypasses RLS.
// Import ONLY from server-only contexts: route handlers under /app/api/*,
// server actions, or cron handlers. NEVER import from a file with "use client".
// Never expose this client or its key to the browser bundle.

import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
