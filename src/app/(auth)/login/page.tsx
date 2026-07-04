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
    <div className="flex min-h-screen items-center justify-center px-4 bg-[#F7F5F1] dark:bg-[#1C2B33] text-[#1C2B33] dark:text-[#F7F5F1]">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto border border-[#1C2B33] dark:border-[#F7F5F1] text-[#1C2B33] dark:text-[#F7F5F1] bg-transparent w-12 h-12 rounded-none flex items-center justify-center text-xl font-serif font-bold mb-6">
            K
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1C2B33] dark:text-[#F7F5F1]">
            Kohlico Invoices
          </h1>
          <p className="mt-2 text-xs font-mono uppercase tracking-wider text-[#7A756B] dark:text-[#9E998F]">
            Exporter ledger authorization
          </p>
        </div>

        {/* Card */}
        <div className="border border-[#D8D3C8] dark:border-[#33312D] p-8 sm:p-10 rounded-none bg-transparent">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {serverError && (
              <div className="rounded-none bg-[#C1443C]/10 dark:bg-[#E8655E]/10 px-4 py-2.5 text-xs text-[#C1443C] dark:text-[#E8655E] border border-[#C1443C]/20 dark:border-[#E8655E]/20 font-mono">
                {serverError}
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-[10px] font-semibold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                className="w-full font-mono text-xs"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-[#C1443C] dark:text-[#E8655E] font-semibold font-mono">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-[10px] font-semibold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                className="w-full font-mono text-xs"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-[#C1443C] dark:text-[#E8655E] font-semibold font-mono">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-none bg-[#1C2B33] dark:bg-[#F7F5F1] text-[#F7F5F1] dark:text-[#1C2B33] border border-[#1C2B33] dark:border-[#F7F5F1] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Verifying Credentials…" : "Authorize Session"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
