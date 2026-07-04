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

  const labelCls = "block text-[10px] font-semibold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider mb-1.5";

  return (
    <div className="border border-[#D8D3C8] dark:border-[#33312D] p-6 bg-transparent rounded-none">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[#1C2B33] dark:text-[#F7F5F1] mb-4">
        Record New User Account
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {serverError && (
          <div className="rounded-none bg-[#C1443C]/10 dark:bg-[#E8655E]/10 px-4 py-2.5 text-xs text-[#C1443C] dark:text-[#E8655E] border border-[#C1443C]/20 dark:border-[#E8655E]/20 font-mono">
            {serverError}
          </div>
        )}
        {success && (
          <div className="rounded-none bg-[#2E5E4E]/10 dark:bg-[#49826D]/10 px-4 py-2.5 text-xs text-[#2E5E4E] dark:text-[#49826D] border border-[#2E5E4E]/20 dark:border-[#49826D]/20 font-mono">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Email */}
          <div>
            <label
              htmlFor="create-email"
              className={labelCls}
            >
              Email
            </label>
            <input
              id="create-email"
              type="email"
              autoComplete="off"
              {...register("email")}
              className="w-full font-mono text-xs"
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-[#C1443C] dark:text-[#E8655E] font-semibold font-mono">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="create-password"
              className={labelCls}
            >
              Password
            </label>
            <input
              id="create-password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
              className="w-full font-mono text-xs"
              placeholder="Min. 8 characters"
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-[#C1443C] dark:text-[#E8655E] font-semibold font-mono">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="create-role"
              className={labelCls}
            >
              Role
            </label>
            <select
              id="create-role"
              {...register("role")}
              className="w-full"
            >
              <option value="user">User / Staff</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && (
              <p className="mt-1.5 text-xs text-[#C1443C] dark:text-[#E8655E] font-semibold font-mono">
                {errors.role.message}
              </p>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-[#D8D3C8] dark:border-[#33312D]">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-none bg-[#1C2B33] dark:bg-[#F7F5F1] text-[#F7F5F1] dark:text-[#1C2B33] border border-[#1C2B33] dark:border-[#F7F5F1] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Registering…" : "Register Account"}
          </button>
        </div>
      </form>
    </div>
  );
}
