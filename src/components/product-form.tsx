"use client";
// src/components/product-form.tsx
// Reusable form for creating and editing products.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const productSchema = z.object({
  description: z.string().min(1, "Description is required"),
  category: z.string().optional(),
  hsCode: z.string().min(1, "HS Code is required"),
  defaultPackaging: z.string().optional(),
  defaultRate: z
    .string()
    .min(1, "Default Rate is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Rate must be a non-negative number",
    }),
  defaultNetWeight: z
    .string()
    .min(1, "Default Net Weight is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Net Weight must be a non-negative number",
    }),
  defaultGrossWeight: z
    .string()
    .min(1, "Default Gross Weight is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Gross Weight must be a non-negative number",
    }),
  igstRate: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 1), {
      message: "IGST Rate must be between 0 and 1",
    }),
});

type ProductValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  defaultValues?: {
    id: string;
    description: string;
    category?: string | null;
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

  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      description: defaultValues?.description ?? "",
      category: defaultValues?.category ?? "",
      hsCode: defaultValues?.hsCode ?? "",
      defaultPackaging: defaultValues?.defaultPackaging ?? "",
      defaultRate: defaultValues?.defaultRate?.toString() ?? "",
      defaultNetWeight: defaultValues?.defaultNetWeight?.toString() ?? "",
      defaultGrossWeight: defaultValues?.defaultGrossWeight?.toString() ?? "",
      igstRate: defaultValues?.igstRate?.toString() ?? "0.05",
    },
  });

  async function onSubmit(data: ProductValues) {
    setError("");

    const url = isEditing ? `/api/products/${defaultValues.id}` : "/api/products";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Something went wrong");
      return;
    }

    router.push("/products");
    router.refresh();
  }

  const labelCls = "block text-[10px] font-semibold text-[#6F7B8E] uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 max-w-lg bg-transparent border-0 p-0 shadow-none">
      {error && (
        <p className="rounded-none bg-[#EF4444]/10 px-4 py-2.5 text-xs text-[#EF4444] border border-[#EF4444]/20 font-mono">
          {error}
        </p>
      )}

      {/* Description */}
      <div>
        <label className={labelCls}>
          Description <span className="text-[#EF4444]">*</span>
        </label>
        <input
          {...register("description")}
          className="w-full"
          placeholder="e.g. ROASTED CHANA W/H SKIN IN POUCH"
        />
        {errors.description && (
          <p className="mt-1 text-xs text-[#EF4444] font-mono">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className={labelCls}>
          Category
        </label>
        <input
          {...register("category")}
          className="w-full"
          placeholder="e.g. SPICES"
        />
        {errors.category && (
          <p className="mt-1 text-xs text-[#EF4444] font-mono">
            {errors.category.message}
          </p>
        )}
      </div>

      {/* HS Code */}
      <div>
        <label className={labelCls}>
          HS Code <span className="text-[#EF4444]">*</span>
        </label>
        <input
          {...register("hsCode")}
          className="w-full font-mono text-xs"
          placeholder="e.g. 21069099"
        />
        {errors.hsCode && (
          <p className="mt-1 text-xs text-[#EF4444] font-mono">
            {errors.hsCode.message}
          </p>
        )}
      </div>

      {/* Default Packaging */}
      <div>
        <label className={labelCls}>
          Default Packaging
        </label>
        <input
          {...register("defaultPackaging")}
          className="w-full"
          placeholder="e.g. 20 X 400 GM"
        />
        {errors.defaultPackaging && (
          <p className="mt-1 text-xs text-[#EF4444] font-mono">
            {errors.defaultPackaging.message}
          </p>
        )}
      </div>

      {/* Default Rate (FOB CAD) */}
      <div>
        <label className={labelCls}>
          Default Rate (FOB CAD / package) <span className="text-[#EF4444]">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          {...register("defaultRate")}
          className="w-full font-mono text-xs"
          placeholder="e.g. 12.50"
        />
        {errors.defaultRate && (
          <p className="mt-1 text-xs text-[#EF4444] font-mono">
            {errors.defaultRate.message}
          </p>
        )}
      </div>

      {/* Net Weight */}
      <div>
        <label className={labelCls}>
          Default Net Weight (kg / package) <span className="text-[#EF4444]">*</span>
        </label>
        <input
          type="number"
          step="0.001"
          {...register("defaultNetWeight")}
          className="w-full font-mono text-xs"
          placeholder="e.g. 8.00"
        />
        {errors.defaultNetWeight && (
          <p className="mt-1 text-xs text-[#EF4444] font-mono">
            {errors.defaultNetWeight.message}
          </p>
        )}
      </div>

      {/* Gross Weight */}
      <div>
        <label className={labelCls}>
          Default Gross Weight (kg / package) <span className="text-[#EF4444]">*</span>
        </label>
        <input
          type="number"
          step="0.001"
          {...register("defaultGrossWeight")}
          className="w-full font-mono text-xs"
          placeholder="e.g. 8.50"
        />
        {errors.defaultGrossWeight && (
          <p className="mt-1 text-xs text-[#EF4444] font-mono">
            {errors.defaultGrossWeight.message}
          </p>
        )}
      </div>

      {/* IGST Rate */}
      <div>
        <label className={labelCls}>
          IGST Rate <span className="text-[#6F7B8E] font-normal font-mono">(default 0.05 = 5%)</span>
        </label>
        <input
          type="number"
          step="0.01"
          {...register("igstRate")}
          className="w-full font-mono text-xs"
        />
        {errors.igstRate && (
          <p className="mt-1 text-xs text-[#EF4444] font-mono">
            {errors.igstRate.message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-[#D8D6D3]">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-none bg-[#1C335E] text-white border border-[#1C335E] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider hover:bg-[#16294C] transition-all disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Create Product"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-none border border-[#D8D6D3] bg-transparent px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#6F7B8E] hover:bg-black/5 transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
