"use client";
// src/app/(dashboard)/products/delete-button.tsx
// Client component — DELETE button for a single product row.

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteProductButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setLoading(true);
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-none border border-[#EF4444] bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#EF4444] hover:bg-[#EF4444]/5 transition-all disabled:opacity-50"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
