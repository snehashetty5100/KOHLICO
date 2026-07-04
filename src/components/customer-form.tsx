"use client";
// src/components/customer-form.tsx
// Reusable form for creating and editing customers.

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CustomerFormProps {
  /** When editing, pass the existing customer data */
  defaultValues?: {
    id: string;
    name: string;
    address: string;
    country: string;
    contactPerson?: string | null;
    phone?: string | null;
    email?: string | null;
  };
}

export default function CustomerForm({ defaultValues }: CustomerFormProps) {
  const router = useRouter();
  const isEditing = !!defaultValues;

  const [form, setForm] = useState({
    name: defaultValues?.name ?? "",
    address: defaultValues?.address ?? "",
    country: defaultValues?.country ?? "",
    contactPerson: defaultValues?.contactPerson ?? "",
    phone: defaultValues?.phone ?? "",
    email: defaultValues?.email ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = isEditing
      ? `/api/customers/${defaultValues.id}`
      : "/api/customers";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    router.push("/customers");
    router.refresh();
  }

  const labelCls = "block text-[10px] font-semibold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg bg-transparent border-0 p-0 shadow-none">
      {error && (
        <p className="rounded-none bg-[#C1443C]/10 dark:bg-[#E8655E]/10 px-4 py-2.5 text-xs text-[#C1443C] dark:text-[#E8655E] border border-[#C1443C]/20 dark:border-[#E8655E]/20 font-mono">
          {error}
        </p>
      )}

      {/* Name */}
      <div>
        <label className={labelCls}>
          Name <span className="text-[#C1443C]">*</span>
        </label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full"
          placeholder="e.g. ABC Imports Ltd."
        />
      </div>

      {/* Address */}
      <div>
        <label className={labelCls}>
          Address <span className="text-[#C1443C]">*</span>
        </label>
        <textarea
          name="address"
          value={form.address}
          onChange={handleChange}
          required
          rows={3}
          className="w-full"
          placeholder="Full address"
        />
      </div>

      {/* Country */}
      <div>
        <label className={labelCls}>
          Country <span className="text-[#C1443C]">*</span>
        </label>
        <input
          name="country"
          value={form.country}
          onChange={handleChange}
          required
          className="w-full"
          placeholder="e.g. CANADA"
        />
      </div>

      {/* Contact Person */}
      <div>
        <label className={labelCls}>
          Contact Person
        </label>
        <input
          name="contactPerson"
          value={form.contactPerson}
          onChange={handleChange}
          className="w-full"
          placeholder="Optional"
        />
      </div>

      {/* Phone */}
      <div>
        <label className={labelCls}>
          Phone
        </label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full font-mono text-xs"
          placeholder="Optional"
        />
      </div>

      {/* Email */}
      <div>
        <label className={labelCls}>
          Email
        </label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          className="w-full font-mono text-xs"
          placeholder="Optional"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-[#D8D3C8] dark:border-[#33312D]">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-none bg-[#1C2B33] dark:bg-[#F7F5F1] text-[#F7F5F1] dark:text-[#1C2B33] border border-[#1C2B33] dark:border-[#F7F5F1] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
        >
          {loading ? "Saving…" : isEditing ? "Save Changes" : "Create Customer"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-none border border-[#1C2B33] dark:border-[#F7F5F1] bg-transparent px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#1C2B33] dark:text-[#F7F5F1] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
