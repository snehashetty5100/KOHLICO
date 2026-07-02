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

interface NavLinkItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export default function NavBar({ user }: NavBarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links: NavLinkItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      href: "/invoices",
      label: "Invoices",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      href: "/customers",
      label: "Customers",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      href: "/products",
      label: "Products",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
  ];

  if (user.role === "admin") {
    links.push({
      href: "/users",
      label: "Users",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
    });
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
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-155 ${
            active
              ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-800/40"
          }`}
        >
          {link.icon}
          <span>{link.label}</span>
        </Link>
      );
    });
  };

  return (
    <>
      {/* Mobile Top Header (hidden on large screens) */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-900 w-full">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-extrabold text-primary-600 tracking-tight">
          <span className="bg-primary-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
            K
          </span>
          Kohlico Invoices
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-500 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 focus:outline-none"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile Sidebar overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-xs transition-opacity duration-205"
        />
      )}

      {/* Sidebar Navigation (floating drawer on mobile, persistent column on desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between w-64 bg-white dark:bg-gray-950 border-r border-gray-200/80 dark:border-gray-800/80 p-6 transition-transform duration-200 transform lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="space-y-8">
          {/* Logo */}
          <div className="hidden lg:flex items-center gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 text-xl font-extrabold text-gray-900 dark:text-white tracking-tight hover:opacity-90"
            >
              <span className="bg-primary-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-md shadow-primary-500/10">
                K
              </span>
              Kohlico Invoices
            </Link>
          </div>

          {/* Links */}
          <nav className="flex flex-col gap-1.5">{renderNavLinks(() => setIsOpen(false))}</nav>
        </div>

        {/* Footer / User menu */}
        <div className="pt-6 border-t border-gray-100 dark:border-gray-900 space-y-4">
          <div className="flex flex-col gap-1 px-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user.name ?? user.email}
              </span>
              {user.role === "admin" && (
                <span className="rounded-full bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50">
                  Admin
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 truncate">{user.email}</span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

