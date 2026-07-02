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
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#0b0e14]">
      {/* Sidebar Navigation */}
      <NavBar user={session.user} />
      
      {/* Main Page Layout Container */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Sticky Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200/80 bg-white/80 dark:bg-[#0b0e14]/80 backdrop-blur-md px-6 md:px-8 dark:border-gray-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <span className="text-gray-400">Workspace</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 dark:text-white capitalize">Kohlico system</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Custom search bar */}
            <div className="relative hidden sm:block">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="w-48 md:w-64 rounded-xl border border-gray-200/80 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-950/40 pl-9 pr-4 py-1.5 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-primary-600 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:outline-none transition-all"
              />
            </div>
            
            {/* Quick Action */}
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary-500 hover:scale-[1.01] transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>New Invoice</span>
            </Link>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 px-6 py-8 md:px-8 lg:px-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

