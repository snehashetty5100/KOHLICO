"use client";
// src/components/nav-bar.tsx
// Top navigation bar shown on all authenticated pages.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface NavBarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
  };
}

function getNavLinks(role: string) {
  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/invoices", label: "Invoices" },
    { href: "/customers", label: "Customers" },
    { href: "/products", label: "Products" },
  ];

  if (role === "admin") {
    links.push({ href: "/users", label: "Users" });
  }

  return links;
}

export default function NavBar({ user }: NavBarProps) {
  const pathname = usePathname();
  const navLinks = getNavLinks(user.role);

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / brand */}
          <Link
            href="/dashboard"
            className="text-xl font-bold text-blue-600 tracking-tight"
          >
            Kohlico Invoices
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-600">
              {user.name ?? user.email}
              {user.role === "admin" && (
                <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                  Admin
                </span>
              )}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
