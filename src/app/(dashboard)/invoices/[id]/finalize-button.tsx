"use client";
// src/app/(dashboard)/invoices/[id]/finalize-button.tsx
// Marks an invoice as final.

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FinalizeButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleFinalize() {
    if (!confirm("Mark this invoice as final? It cannot be edited after this.")) return;
    setLoading(true);
    await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "final" }),
    });
    router.refresh();
  }

  return (
    <button
      onClick={handleFinalize}
      disabled={loading}
      className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
    >
      {loading ? "Finalizing…" : "Mark as Final"}
    </button>
  );
}
