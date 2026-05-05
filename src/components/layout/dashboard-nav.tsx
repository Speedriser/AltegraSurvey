import Link from "next/link";
import { FileText } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import { createClient } from "@/lib/supabase/server";

export async function DashboardNav({
  email,
  userId,
}: {
  email: string;
  userId: string;
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, message, created_at, read_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <header className="border-b">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <FileText className="h-5 w-5" />
          Altegra Forms
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Forms
          </Link>
          <Link
            href="/me/responses"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            My responses
          </Link>
          <NotificationsBell items={data ?? []} />
          <UserMenu email={email} />
        </nav>
      </div>
    </header>
  );
}
