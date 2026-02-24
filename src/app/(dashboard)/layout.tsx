// src/app/(dashboard)/layout.tsx
// Shared shell for all authenticated pages — includes navigation bar.

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import NavBar from "@/components/nav-bar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Belt-and-braces check (middleware already guards these routes).
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar user={session.user} />
      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
