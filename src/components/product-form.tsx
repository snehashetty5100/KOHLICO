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

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 max-w-lg">
      {error && (
        <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700 border border-red-200">
          {error}
        </p>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <input
          {...register("description")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. ROASTED CHANA W/H SKIN IN POUCH"
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* HS Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          HS Code <span className="text-red-500">*</span>
        </label>
        <input
          {...register("hsCode")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 21069099"
        />
        {errors.hsCode && (
          <p className="mt-1 text-xs text-red-600">
            {errors.hsCode.message}
          </p>
        )}
      </div>

      {/* Default Packaging */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Default Packaging
        </label>
        <input
          {...register("defaultPackaging")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 20 X 400 GM"
        />
        {errors.defaultPackaging && (
          <p className="mt-1 text-xs text-red-600">
            {errors.defaultPackaging.message}
          </p>
        )}
      </div>

      {/* Default Rate (FOB CAD) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Default Rate (FOB CAD / package) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          {...register("defaultRate")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 12.50"
        />
        {errors.defaultRate && (
          <p className="mt-1 text-xs text-red-600">
            {errors.defaultRate.message}
          </p>
        )}
      </div>

      {/* Net Weight */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Default Net Weight (kg / package) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.001"
          {...register("defaultNetWeight")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 8.00"
        />
        {errors.defaultNetWeight && (
          <p className="mt-1 text-xs text-red-600">
            {errors.defaultNetWeight.message}
          </p>
        )}
      </div>

      {/* Gross Weight */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Default Gross Weight (kg / package) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.001"
          {...register("defaultGrossWeight")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 8.50"
        />
        {errors.defaultGrossWeight && (
          <p className="mt-1 text-xs text-red-600">
            {errors.defaultGrossWeight.message}
          </p>
        )}
      </div>

      {/* IGST Rate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          IGST Rate <span className="text-gray-400 font-normal">(default 0.05 = 5%)</span>
        </label>
        <input
          type="number"
          step="0.01"
          {...register("igstRate")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.igstRate && (
          <p className="mt-1 text-xs text-red-600">
            {errors.igstRate.message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Create Product"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
