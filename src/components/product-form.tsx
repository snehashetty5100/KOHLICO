"use client";
// src/components/product-form.tsx
// Reusable form for creating and editing products.

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProductFormProps {
  defaultValues?: {
    id: string;
    description: string;
    hsCode: string;
    defaultPackaging?: string | null;
    defaultRate: number;
    defaultNetWeight: number;
    defaultGrossWeight: number;
    igstRate: number;
  };
}

export default function ProductForm({ defaultValues }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!defaultValues;

  const [form, setForm] = useState({
    description: defaultValues?.description ?? "",
    hsCode: defaultValues?.hsCode ?? "",
    defaultPackaging: defaultValues?.defaultPackaging ?? "",
    defaultRate: defaultValues?.defaultRate?.toString() ?? "",
    defaultNetWeight: defaultValues?.defaultNetWeight?.toString() ?? "",
    defaultGrossWeight: defaultValues?.defaultGrossWeight?.toString() ?? "",
    igstRate: defaultValues?.igstRate?.toString() ?? "0.05",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = isEditing ? `/api/products/${defaultValues.id}` : "/api/products";
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

    router.push("/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg glass-card p-6 sm:p-8 rounded-2xl">
      {error && (
        <p className="rounded-xl bg-red-50 dark:bg-red-950/20 px-4 py-2.5 text-sm text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-900/50">
          {error}
        </p>
      )}

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-gray-950 dark:text-gray-300 mb-1.5">
          Description <span className="text-red-500">*</span>
        </label>
        <input
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm transition-all focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
          placeholder="e.g. ROASTED CHANA W/H SKIN IN POUCH"
        />
      </div>

      {/* HS Code */}
      <div>
        <label className="block text-xs font-semibold text-gray-950 dark:text-gray-300 mb-1.5">
          HS Code <span className="text-red-500">*</span>
        </label>
        <input
          name="hsCode"
          value={form.hsCode}
          onChange={handleChange}
          required
          className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm transition-all focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
          placeholder="e.g. 21069099"
        />
      </div>

      {/* Default Packaging */}
      <div>
        <label className="block text-xs font-semibold text-gray-950 dark:text-gray-300 mb-1.5">
          Default Packaging
        </label>
        <input
          name="defaultPackaging"
          value={form.defaultPackaging}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm transition-all focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
          placeholder="e.g. 20 X 400 GM"
        />
      </div>

      {/* Default Rate (FOB CAD) */}
      <div>
        <label className="block text-xs font-semibold text-gray-950 dark:text-gray-300 mb-1.5">
          Default Rate (FOB CAD / package) <span className="text-red-500">*</span>
        </label>
        <input
          name="defaultRate"
          type="number"
          step="0.01"
          min="0"
          value={form.defaultRate}
          onChange={handleChange}
          required
          className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm transition-all focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
          placeholder="e.g. 12.50"
        />
      </div>

      {/* Net Weight */}
      <div>
        <label className="block text-xs font-semibold text-gray-950 dark:text-gray-300 mb-1.5">
          Default Net Weight (kg / package) <span className="text-red-500">*</span>
        </label>
        <input
          name="defaultNetWeight"
          type="number"
          step="0.001"
          min="0"
          value={form.defaultNetWeight}
          onChange={handleChange}
          required
          className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm transition-all focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
          placeholder="e.g. 8.00"
        />
      </div>

      {/* Gross Weight */}
      <div>
        <label className="block text-xs font-semibold text-gray-950 dark:text-gray-300 mb-1.5">
          Default Gross Weight (kg / package) <span className="text-red-500">*</span>
        </label>
        <input
          name="defaultGrossWeight"
          type="number"
          step="0.001"
          min="0"
          value={form.defaultGrossWeight}
          onChange={handleChange}
          required
          className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm transition-all focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
          placeholder="e.g. 8.50"
        />
      </div>

      {/* IGST Rate */}
      <div>
        <label className="block text-xs font-semibold text-gray-950 dark:text-gray-300 mb-1.5">
          IGST Rate <span className="text-gray-400 dark:text-gray-500 font-normal">(default 0.05 = 5%)</span>
        </label>
        <input
          name="igstRate"
          type="number"
          step="0.01"
          min="0"
          max="1"
          value={form.igstRate}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm transition-all focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-900">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 transition-all disabled:opacity-50"
        >
          {loading ? "Saving…" : isEditing ? "Save Changes" : "Create Product"}
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
