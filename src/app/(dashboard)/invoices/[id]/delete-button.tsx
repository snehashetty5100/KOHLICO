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
      className="rounded-none border border-[#EF4444] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#EF4444] hover:bg-[#EF4444]/5 transition-all disabled:opacity-50"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
