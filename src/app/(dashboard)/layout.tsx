// src/app/(dashboard)/layout.tsx
// Shared shell for all authenticated pages — includes sidebar navigation and top bar.

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import NavBar from "@/components/nav-bar";
import Link from "next/link";
import SearchBar from "@/components/search-bar";

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
    <div className="min-h-screen bg-[#FCFCFB]">
      {/* Sidebar Navigation */}
      <NavBar user={session.user} />
      
      {/* Main Page Layout Container */}
      <div className="lg:pl-60 flex flex-col min-h-screen">
        {/* Sticky Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#D8D6D3] bg-[#FCFCFB]/90 backdrop-blur-sm px-6 md:px-8">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#6F7B8E]">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-[#1C335E]">Kohlico Invoicing</span>
          </div>
          <div className="flex items-center gap-6">
            {/* Custom search bar */}
            <SearchBar />
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

