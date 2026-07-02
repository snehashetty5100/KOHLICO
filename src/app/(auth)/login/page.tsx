"use client";
// src/app/(auth)/login/page.tsx
// Sign-in form using react-hook-form + zod.

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginFormValues) {
    setServerError(null);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (!result || !result.ok) {
      setServerError("Invalid email or password. Please try again.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-gray-50/50 dark:bg-[#0b0e14]">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto bg-primary-600 text-white w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold shadow-md mb-6">
            K
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 dark:text-white">
            Kohlico Invoices
          </h1>
          <p className="mt-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
            Sign in to your billing account to continue
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 sm:p-10 rounded-2xl">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {serverError && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/20 px-4 py-2.5 text-sm text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-900/50">
                {serverError}
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-gray-950 dark:text-gray-300 mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3 text-sm transition-all focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10 outline-none disabled:opacity-50"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-650 dark:text-red-400 font-semibold">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-gray-950 dark:text-gray-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3 text-sm transition-all focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10 outline-none disabled:opacity-50"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-655 dark:text-red-400 font-semibold">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
