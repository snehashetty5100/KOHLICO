"use client";
// src/components/customer-form.tsx
// Reusable form for creating and editing customers.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  country: z.string().min(1, "Country is required"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Enter a valid email").or(z.literal("")).optional(),
});

type CustomerValues = z.infer<typeof customerSchema>;

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

  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      address: defaultValues?.address ?? "",
      country: defaultValues?.country ?? "",
      contactPerson: defaultValues?.contactPerson ?? "",
      phone: defaultValues?.phone ?? "",
      email: defaultValues?.email ?? "",
    },
  });

  async function onSubmit(data: CustomerValues) {
    setError("");

    const url = isEditing
      ? `/api/customers/${defaultValues.id}`
      : "/api/customers";
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

    router.push("/customers");
    router.refresh();
  }

  const labelCls = "block text-[10px] font-semibold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 max-w-lg bg-transparent border-0 p-0 shadow-none">
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
          {...register("name")}
          className="w-full"
          placeholder="e.g. ABC Imports Ltd."
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Address */}
      <div>
        <label className={labelCls}>
          Address <span className="text-[#C1443C]">*</span>
        </label>
        <textarea
          {...register("address")}
          rows={3}
          className="w-full"
          placeholder="Full address"
        />
        {errors.address && (
          <p className="mt-1 text-xs text-red-600">
            {errors.address.message}
          </p>
        )}
      </div>

      {/* Country */}
      <div>
        <label className={labelCls}>
          Country <span className="text-[#C1443C]">*</span>
        </label>
        <input
          {...register("country")}
          className="w-full"
          placeholder="e.g. CANADA"
        />
        {errors.country && (
          <p className="mt-1 text-xs text-red-600">
            {errors.country.message}
          </p>
        )}
      </div>

      {/* Contact Person */}
      <div>
        <label className={labelCls}>
          Contact Person
        </label>
        <input
          {...register("contactPerson")}
          className="w-full"
          placeholder="Optional"
        />
        {errors.contactPerson && (
          <p className="mt-1 text-xs text-red-600">
            {errors.contactPerson.message}
          </p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className={labelCls}>
          Phone
        </label>
        <input
          {...register("phone")}
          className="w-full font-mono text-xs"
          placeholder="Optional"
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-red-600">
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className={labelCls}>
          Email
        </label>
        <input
          type="email"
          {...register("email")}
          className="w-full font-mono text-xs"
          placeholder="Optional"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-[#D8D3C8] dark:border-[#33312D]">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-none bg-[#1C2B33] dark:bg-[#F7F5F1] text-[#F7F5F1] dark:text-[#1C2B33] border border-[#1C2B33] dark:border-[#F7F5F1] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Create Customer"}
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
