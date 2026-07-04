"use client";
// src/components/search-bar.tsx
// Client component for the topbar search input.
// Syncs query string 'q' to the route url.

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function SearchBarInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") || "");

  // Update field value when url updates (e.g. clear button clicked elsewhere)
  useEffect(() => {
    setValue(searchParams.get("q") || "");
  }, [searchParams]);

  // Determine current context path
  function getTargetPath() {
    let targetPath = pathname;
    const isListPage = ["/invoices", "/customers", "/products", "/users"].some(
      (path) => pathname === path || pathname.startsWith(path + "/")
    );
    const isDetailPage = ["/invoices/", "/customers/", "/products/"].some(
      (prefix) => pathname.startsWith(prefix) && pathname !== prefix
    );

    if (!isListPage || isDetailPage) {
      return "/invoices";
    }
    return targetPath;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    
    if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }

    router.push(`${getTargetPath()}?${params.toString()}`);
  }

  function handleClear() {
    setValue("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    router.push(`${getTargetPath()}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative hidden sm:block">
      {/* Search Icon */}
      <button type="submit" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1C335E] hover:opacity-80 transition-all flex items-center justify-center z-10">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {/* Input text field - Override base border and padding with !important */}
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search..."
        className="w-40 md:w-56 bg-transparent border-t-0 border-l-0 border-r-0 border-b border-solid !border-b-[#1C335E] text-[#1C335E] rounded-none !pl-8 !pr-8 py-1 text-xs focus:ring-0 focus:outline-none transition-all placeholder:text-[#1C335E]/40"
      />

      {/* Clear 'X' Mark */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#1C335E] hover:opacity-80 transition-all cursor-pointer flex items-center justify-center z-10 p-0.5"
          aria-label="Clear search"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </form>
  );
}

export default function SearchBar() {
  return (
    <Suspense fallback={<div className="w-40 md:w-56 h-8 bg-transparent" />}>
      <SearchBarInner />
    </Suspense>
  );
}
