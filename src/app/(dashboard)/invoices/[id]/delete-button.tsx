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
      className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
