// src/app/(dashboard)/layout.tsx
// Shared shell for all authenticated pages — includes sidebar navigation and top bar.

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import NavBar from "@/components/nav-bar";
import Link from "next/link";

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
    <div className="min-h-screen bg-[#F7F5F1] dark:bg-[#1C2B33]">
      {/* Sidebar Navigation */}
      <NavBar user={session.user} />
      
      {/* Main Page Layout Container */}
      <div className="lg:pl-60 flex flex-col min-h-screen">
        {/* Sticky Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#D8D3C8] dark:border-[#33312D] bg-[#F7F5F1]/90 dark:bg-[#1C2B33]/90 backdrop-blur-sm px-6 md:px-8">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#7A756B]">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-[#1C2B33] dark:text-[#F7F5F1]">Kohlico Invoicing</span>
          </div>
          <div className="flex items-center gap-6">
            {/* Custom search bar */}
            <div className="relative hidden sm:block">
              <svg className="absolute left-1 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7A756B]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="w-40 md:w-56 bg-transparent border-t-0 border-l-0 border-r-0 border-b border-solid border-[#D8D3C8] dark:border-[#33312D] text-[#1C2B33] dark:text-[#F7F5F1] rounded-none pl-6 pr-2 py-1 text-xs focus:border-[#1C2B33] dark:focus:border-[#F7F5F1] focus:ring-0 focus:outline-none transition-all placeholder:text-[#7A756B]/60"
              />
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 px-6 py-10 md:px-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

