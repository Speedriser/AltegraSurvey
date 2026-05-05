import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vercel cron hits this with the `Authorization: Bearer <CRON_SECRET>` header
// (when CRON_SECRET is set). Configure schedule in vercel.json.
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  const admin = createAdminClient();

  const { data: forms } = await admin
    .from("forms")
    .select("id, settings");

  let deleted = 0;
  for (const f of forms ?? []) {
    const days = f.settings?.retention_days;
    if (!days) continue;
    const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
    const { error, count } = await admin
      .from("responses")
      .delete({ count: "exact" })
      .eq("form_id", f.id)
      .lt("submitted_at", cutoff);
    if (!error) deleted += count ?? 0;
  }

  return NextResponse.json({ ok: true, deleted });
}
