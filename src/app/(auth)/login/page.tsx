"use client";
// src/app/(auth)/login/page.tsx
// Sign-in form using react-hook-form + zod.

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

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

    if (result?.error) {
      setServerError("Invalid email or password. Please try again.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Kohlico Invoices
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to your account to continue
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {serverError && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                {serverError}
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        {/* Register link — only relevant for first-time setup */}
        <p className="text-center text-xs text-gray-500">
          First time here?{" "}
          <Link
            href="/register"
            className="font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
