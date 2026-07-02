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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg glass-card p-6 sm:p-8 rounded-2xl">
      {error && (
        <p className="rounded-xl bg-red-50 dark:bg-red-950/20 px-4 py-2.5 text-sm text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-900/50">
          {error}
        </p>
      )}

      {/* Name */}
      <div>
        <label className="block text-xs font-semibold text-gray-950 dark:text-gray-300 mb-1.5">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm transition-all focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
          placeholder="e.g. ABC Imports Ltd."
        />
      </div>

      {/* Address */}
      <div>
        <label className="block text-xs font-semibold text-gray-950 dark:text-gray-300 mb-1.5">
          Address <span className="text-red-500">*</span>
        </label>
        <textarea
          name="address"
          value={form.address}
          onChange={handleChange}
          required
          rows={3}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm transition-all focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
          placeholder="Full address"
        />
      </div>

      {/* Country */}
      <div>
        <label className="block text-xs font-semibold text-gray-950 dark:text-gray-300 mb-1.5">
          Country <span className="text-red-500">*</span>
        </label>
        <input
          name="country"
          value={form.country}
          onChange={handleChange}
          required
          className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm transition-all focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
          placeholder="e.g. CANADA"
        />
      </div>

      {/* Contact Person */}
      <div>
        <label className="block text-xs font-semibold text-gray-950 dark:text-gray-300 mb-1.5">
          Contact Person
        </label>
        <input
          name="contactPerson"
          value={form.contactPerson}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm transition-all focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
          placeholder="Optional"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-xs font-semibold text-gray-950 dark:text-gray-300 mb-1.5">
          Phone
        </label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm transition-all focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
          placeholder="Optional"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-semibold text-gray-950 dark:text-gray-300 mb-1.5">
          Email
        </label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm transition-all focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
          placeholder="Optional"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-900">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 transition-all disabled:opacity-50"
        >
          {loading ? "Saving…" : isEditing ? "Save Changes" : "Create Customer"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-5 py-2.5 text-sm font-semibold text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
