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

  const labelCls = "block text-[10px] font-semibold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg bg-transparent border-0 p-0 shadow-none">
      {error && (
        <p className="rounded-none bg-[#C1443C]/10 dark:bg-[#E8655E]/10 px-4 py-2.5 text-xs text-[#C1443C] dark:text-[#E8655E] border border-[#C1443C]/20 dark:border-[#E8655E]/20 font-mono">
          {error}
        </p>
      )}

      {/* Description */}
      <div>
        <label className={labelCls}>
          Description <span className="text-[#C1443C]">*</span>
        </label>
        <input
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          className="w-full"
          placeholder="e.g. ROASTED CHANA W/H SKIN IN POUCH"
        />
      </div>

      {/* HS Code */}
      <div>
        <label className={labelCls}>
          HS Code <span className="text-[#C1443C]">*</span>
        </label>
        <input
          name="hsCode"
          value={form.hsCode}
          onChange={handleChange}
          required
          className="w-full font-mono text-xs"
          placeholder="e.g. 21069099"
        />
      </div>

      {/* Default Packaging */}
      <div>
        <label className={labelCls}>
          Default Packaging
        </label>
        <input
          name="defaultPackaging"
          value={form.defaultPackaging}
          onChange={handleChange}
          className="w-full"
          placeholder="e.g. 20 X 400 GM"
        />
      </div>

      {/* Default Rate (FOB CAD) */}
      <div>
        <label className={labelCls}>
          Default Rate (FOB CAD / package) <span className="text-[#C1443C]">*</span>
        </label>
        <input
          name="defaultRate"
          type="number"
          step="0.01"
          min="0"
          value={form.defaultRate}
          onChange={handleChange}
          required
          className="w-full font-mono text-xs"
          placeholder="e.g. 12.50"
        />
      </div>

      {/* Net Weight */}
      <div>
        <label className={labelCls}>
          Default Net Weight (kg / package) <span className="text-[#C1443C]">*</span>
        </label>
        <input
          name="defaultNetWeight"
          type="number"
          step="0.001"
          min="0"
          value={form.defaultNetWeight}
          onChange={handleChange}
          required
          className="w-full font-mono text-xs"
          placeholder="e.g. 8.00"
        />
      </div>

      {/* Gross Weight */}
      <div>
        <label className={labelCls}>
          Default Gross Weight (kg / package) <span className="text-[#C1443C]">*</span>
        </label>
        <input
          name="defaultGrossWeight"
          type="number"
          step="0.001"
          min="0"
          value={form.defaultGrossWeight}
          onChange={handleChange}
          required
          className="w-full font-mono text-xs"
          placeholder="e.g. 8.50"
        />
      </div>

      {/* IGST Rate */}
      <div>
        <label className={labelCls}>
          IGST Rate <span className="text-[#7A756B] dark:text-[#9E998F] font-normal font-mono">(default 0.05 = 5%)</span>
        </label>
        <input
          name="igstRate"
          type="number"
          step="0.01"
          min="0"
          max="1"
          value={form.igstRate}
          onChange={handleChange}
          className="w-full font-mono text-xs"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-[#D8D3C8] dark:border-[#33312D]">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-none bg-[#1C2B33] dark:bg-[#F7F5F1] text-[#F7F5F1] dark:text-[#1C2B33] border border-[#1C2B33] dark:border-[#F7F5F1] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
        >
          {loading ? "Saving…" : isEditing ? "Save Changes" : "Create Product"}
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
