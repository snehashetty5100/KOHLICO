"use client";
// src/app/(dashboard)/users/edit-user-button.tsx
// Client component — Edit button and form modal for editing user details.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const editUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  role: z.enum(["admin", "user"], {
    message: "Role is required",
  }),
  password: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || val.length >= 8, {
      message: "Password must be at least 8 characters",
    }),
});

type EditUserValues = z.infer<typeof editUserSchema>;

interface EditUserButtonProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  currentUserId: string;
}

export default function EditUserButton({ user, currentUserId }: EditUserButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role as "admin" | "user",
      password: "",
    },
  });

  const selectedRole = watch("role");

  async function onSubmit(data: EditUserValues) {
    setServerError(null);
    setSuccess(null);

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      const msg =
        typeof json.error === "string"
          ? json.error
          : "Failed to update user. Please check your inputs.";
      setServerError(msg);
      return;
    }

    setSuccess("User updated successfully.");
    router.refresh();
    setTimeout(() => {
      setIsOpen(false);
      setSuccess(null);
    }, 1000);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:underline cursor-pointer"
      >
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 text-left">
              Edit User
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 text-left">
              {serverError && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                  {serverError}
                </div>
              )}
              {success && (
                <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-200">
                  {success}
                </div>
              )}

              {/* Name */}
              <div>
                <label
                  htmlFor="edit-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  autoComplete="off"
                  {...register("name")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-950 bg-white"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="edit-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="edit-email"
                  type="email"
                  autoComplete="off"
                  {...register("email")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-950 bg-white"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="edit-password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="edit-password"
                  type="password"
                  autoComplete="new-password"
                  {...register("password")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-950 bg-white"
                  placeholder="Leave blank to keep current password."
                />
                <span className="text-[11px] text-gray-400 block mt-1">
                  Leave blank to keep current password.
                </span>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label
                  htmlFor="edit-role"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Role
                </label>
                <select
                  id="edit-role"
                  {...register("role")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-950 bg-white"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.role.message}
                  </p>
                )}
                {user.id === currentUserId && selectedRole !== "admin" && (
                  <p className="text-xs text-amber-700 font-medium bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-2">
                    Warning: Demoting yourself will remove your admin permissions immediately.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
