import { DashboardNav } from "@/components/layout/dashboard-nav";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireUser();
  return (
    <div className="min-h-screen">
      <DashboardNav email={user.email ?? "user"} />
      <main className="container py-6">{children}</main>
    </div>
  );
}
