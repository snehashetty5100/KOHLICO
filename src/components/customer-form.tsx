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

  const labelCls = "block text-[10px] font-semibold text-[#6F7B8E] uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 max-w-lg bg-transparent border-0 p-0 shadow-none">
      {error && (
        <p className="rounded-none bg-[#EF4444]/10 px-4 py-2.5 text-xs text-[#EF4444] border border-[#EF4444]/20 font-mono">
          {error}
        </p>
      )}

      {/* Name */}
      <div>
        <label className={labelCls}>
          Name <span className="text-[#EF4444]">*</span>
        </label>
        <input
          {...register("name")}
          className="w-full"
          placeholder="e.g. ABC Imports Ltd."
        />
        {errors.name && (
          <p className="mt-1 text-xs text-[#EF4444] font-mono">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Address */}
      <div>
        <label className={labelCls}>
          Address <span className="text-[#EF4444]">*</span>
        </label>
        <textarea
          {...register("address")}
          rows={3}
          className="w-full"
          placeholder="Full address"
        />
        {errors.address && (
          <p className="mt-1 text-xs text-[#EF4444] font-mono">
            {errors.address.message}
          </p>
        )}
      </div>

      {/* Country */}
      <div>
        <label className={labelCls}>
          Country <span className="text-[#EF4444]">*</span>
        </label>
        <input
          {...register("country")}
          className="w-full"
          placeholder="e.g. CANADA"
        />
        {errors.country && (
          <p className="mt-1 text-xs text-[#EF4444] font-mono">
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
          <p className="mt-1 text-xs text-[#EF4444] font-mono">
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
          <p className="mt-1 text-xs text-[#EF4444] font-mono">
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
          <p className="mt-1 text-xs text-[#EF4444] font-mono">
            {errors.email.message}
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
          {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Create Customer"}
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
