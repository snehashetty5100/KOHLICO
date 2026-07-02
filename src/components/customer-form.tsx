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

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 max-w-lg">
      {error && (
        <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700 border border-red-200">
          {error}
        </p>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register("name")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register("address")}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Country <span className="text-red-500">*</span>
        </label>
        <input
          {...register("country")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contact Person
        </label>
        <input
          {...register("contactPerson")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone
        </label>
        <input
          {...register("phone")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          {...register("email")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Optional"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">
            {errors.email.message}
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
          {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Create Customer"}
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
