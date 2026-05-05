import Link from "next/link";
import { FileText } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";

export function DashboardNav({ email }: { email: string }) {
  return (
    <header className="border-b">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <FileText className="h-5 w-5" />
          Altegra Forms
        </Link>
        <nav className="flex items-center gap-4">
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
          <UserMenu email={email} />
        </nav>
      </div>
    </header>
  );
}
