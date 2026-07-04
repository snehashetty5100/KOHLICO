"use client";
// src/app/(dashboard)/invoices/[id]/delete-button.tsx
// Deletes an invoice and redirects to the list.

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteInvoiceButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    setLoading(true);
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    router.push("/invoices");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-none border border-[#C1443C] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#C1443C] hover:bg-[#C1443C]/5 dark:text-[#E8655E] dark:border-[#E8655E] dark:hover:bg-[#E8655E]/5 transition-all disabled:opacity-50"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
