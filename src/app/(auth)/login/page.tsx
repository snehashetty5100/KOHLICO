"use client";
// src/app/(auth)/login/page.tsx
// Sign-in form using react-hook-form + zod.

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Logo from "@/components/logo";

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
    <div className="flex min-h-screen items-center justify-center px-4 bg-[#FCFCFB] text-[#1C335E]">
      <div className="w-full max-w-2xl space-y-8 py-8">
        {/* Header */}
        <div>
          <Logo layout="full" className="rounded-none border border-[#D8D6D3] bg-[#F7F5F2]" />
          <p className="mt-4 text-center text-xs font-mono uppercase tracking-wider text-[#6F7B8E]">
            Exporter ledger authorization
          </p>
        </div>

        {/* Card */}
        <div className="max-w-md mx-auto w-full border border-[#D8D6D3] p-8 sm:p-10 rounded-none bg-[#F7F5F2]">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {serverError && (
              <div className="rounded-none bg-[#EF4444]/10 px-4 py-2.5 text-xs text-[#EF4444] border border-[#EF4444]/20 font-mono">
                {serverError}
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-[10px] font-semibold text-[#6F7B8E] uppercase tracking-wider mb-1.5"
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
                <p className="mt-1.5 text-xs text-[#EF4444] font-semibold font-mono">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-[10px] font-semibold text-[#6F7B8E] uppercase tracking-wider mb-1.5"
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
                <p className="mt-1.5 text-xs text-[#EF4444] font-semibold font-mono">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-none bg-[#1C335E] text-white border border-[#1C335E] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider hover:bg-[#16294C] transition-all disabled:opacity-50"
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
