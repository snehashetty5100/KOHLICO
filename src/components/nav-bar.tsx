"use client";
// src/components/nav-bar.tsx
// Left sidebar navigation (icons + labels) with responsive hamburger menu for smaller screens.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

interface NavBarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
  };
}

export default function NavBar({ user }: NavBarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/invoices", label: "Invoices" },
    { href: "/customers", label: "Customers" },
    { href: "/products", label: "Products" },
  ];

  if (user.role === "admin") {
    links.push({ href: "/users", label: "Users" });
  }

  const renderNavLinks = (onClick?: () => void) => {
    return links.map((link) => {
      const active =
        pathname === link.href ||
        (link.href !== "/dashboard" && pathname.startsWith(link.href));
      return (
        <Link
          key={link.href}
          href={link.href}
          onClick={onClick}
          className={`block py-2 text-xs tracking-wider uppercase font-semibold transition-all duration-100 ${
            active
              ? "text-[#2E5E4E] dark:text-[#49826D]"
              : "text-[#7A756B] hover:text-[#1C2B33] dark:hover:text-[#F7F5F1]"
          }`}
        >
          {active ? `[ ${link.label} ]` : `  ${link.label}`}
        </Link>
      );
    });
  };

  return (
    <>
      {/* Mobile Top Header (hidden on large screens) */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-[#F7F5F1] dark:bg-[#1C2B33] border-b border-[#D8D3C8] dark:border-[#33312D] w-full">
        <Link href="/dashboard" className="text-lg font-serif font-bold text-[#1C2B33] dark:text-[#F7F5F1] tracking-tight">
          KOHLICO
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 text-[#1C2B33] dark:text-[#F7F5F1] border border-[#D8D3C8] dark:border-[#33312D] hover:bg-black/5"
        >
          {isOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile Sidebar overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/10 transition-opacity duration-100"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between w-60 bg-[#F7F5F1] dark:bg-[#1C2B33] border-r border-[#D8D3C8] dark:border-[#33312D] p-8 transition-transform duration-100 transform lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="space-y-12">
          {/* Logo */}
          <div className="hidden lg:block">
            <Link
              href="/dashboard"
              className="text-2xl font-serif font-bold text-[#1C2B33] dark:text-[#F7F5F1] tracking-tight hover:opacity-90"
            >
              KOHLICO
            </Link>
          </div>

          {/* Links */}
          <nav className="flex flex-col space-y-2">{renderNavLinks(() => setIsOpen(false))}</nav>
        </div>

        {/* Footer / User menu */}
        <div className="pt-6 border-t border-[#D8D3C8] dark:border-[#33312D] space-y-4">
          <div className="flex flex-col gap-1 px-1 font-mono text-xs">
            <div className="flex items-center justify-between text-[#1C2B33] dark:text-[#F7F5F1] truncate">
              <span className="font-semibold truncate">{user.name ?? user.email}</span>
              {user.role === "admin" && (
                <span className="text-[10px] text-[#2E5E4E] dark:text-[#49826D] font-bold">[ADMIN]</span>
              )}
            </div>
            <span className="text-[10px] text-[#7A756B] truncate">{user.email}</span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center justify-center w-full gap-2 py-2 text-xs font-semibold text-[#1C2B33] dark:text-[#F7F5F1] border border-[#1C2B33] dark:border-[#F7F5F1] bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-all rounded-none uppercase tracking-wider"
          >
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

