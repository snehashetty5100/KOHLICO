"use client";
// src/app/(dashboard)/customers/delete-button.tsx
// Client component — DELETE button for a single customer row.

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteCustomerButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this customer? This cannot be undone.")) return;
    setLoading(true);
    await fetch(`/api/customers/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 hover:underline disabled:opacity-50"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
