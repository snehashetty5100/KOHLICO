"use client";
// src/app/(dashboard)/users/create-user-form.tsx
// Inline form for admins to create new users.

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

const createUserSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "user"], {
    message: "Role is required",
  }),
});

type CreateUserValues = z.infer<typeof createUserSchema>;

export default function CreateUserForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "user" },
  });

  async function onSubmit(data: CreateUserValues) {
    setServerError(null);
    setSuccess(null);

    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      const msg =
        typeof json.error === "string"
          ? json.error
          : "Failed to create user. Please check your inputs.";
      setServerError(msg);
      return;
    }

    setSuccess(`User "${json.user.email}" created successfully.`);
    reset();
    router.refresh();
  }

  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-bold tracking-tight text-gray-950 dark:text-white mb-4">
        Create new user
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {serverError && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/20 px-4 py-2.5 text-sm text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-900/50">
            {serverError}
          </div>
        )}
        {success && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Email */}
          <div>
            <label
              htmlFor="create-email"
              className="block text-xs font-semibold text-gray-950 dark:text-gray-300 mb-1.5"
            >
              Email
            </label>
            <input
              id="create-email"
              type="email"
              autoComplete="off"
              {...register("email")}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm transition-all focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-650 dark:text-red-400 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="create-password"
              className="block text-xs font-semibold text-gray-950 dark:text-gray-300 mb-1.5"
            >
              Password
            </label>
            <input
              id="create-password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm transition-all focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
              placeholder="Min. 8 characters"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-655 dark:text-red-400 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="create-role"
              className="block text-xs font-semibold text-gray-950 dark:text-gray-300 mb-1.5"
            >
              Role
            </label>
            <select
              id="create-role"
              {...register("role")}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-955 px-4 py-2.5 text-sm transition-all focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-xs text-red-650 dark:text-red-400 font-medium">
                {errors.role.message}
              </p>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 dark:border-gray-900">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Creating…" : "Create user"}
          </button>
        </div>
      </form>
    </div>
  );
}
