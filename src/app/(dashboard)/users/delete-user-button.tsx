"use client";
// src/app/(dashboard)/users/delete-user-button.tsx
// Client component — DELETE button for a single user row.

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteUserButton({
  id,
  email,
}: {
  id: string;
  email: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete user "${email}"? This cannot be undone.`)) return;
    setLoading(true);

    const res = await fetch(`/api/admin/delete-user/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const json = await res.json();
      alert(json.error ?? "Failed to delete user");
      setLoading(false);
      return;
    }

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
