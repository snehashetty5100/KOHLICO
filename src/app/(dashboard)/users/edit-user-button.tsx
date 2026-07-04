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

  const labelCls = "block text-[10px] font-semibold text-[#6F7B8E] uppercase tracking-wider mb-1.5";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center rounded-none border border-[#1C335E] bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#1C335E] hover:bg-[#1C335E]/5 transition-all cursor-pointer"
      >
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C335E]/20 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-none border border-[#D8D6D3] bg-[#F7F5F2] p-6 shadow-none">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#1C335E] mb-4 text-left">
              Edit User
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 text-left">
              {serverError && (
                <div className="rounded-none bg-[#EF4444]/10 px-4 py-2.5 text-xs text-[#EF4444] border border-[#EF4444]/20 font-mono">
                  {serverError}
                </div>
              )}
              {success && (
                <div className="rounded-none bg-[#22C55E]/10 px-4 py-2.5 text-xs text-[#22C55E] border border-[#22C55E]/20 font-mono">
                  {success}
                </div>
              )}

              {/* Name */}
              <div>
                <label
                  htmlFor="edit-name"
                  className={labelCls}
                >
                  Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  autoComplete="off"
                  {...register("name")}
                  className="w-full font-mono text-xs"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-[#EF4444] font-mono">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="edit-email"
                  className={labelCls}
                >
                  Email
                </label>
                <input
                  id="edit-email"
                  type="email"
                  autoComplete="off"
                  {...register("email")}
                  className="w-full font-mono text-xs"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-[#EF4444] font-mono">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="edit-password"
                  className={labelCls}
                >
                  Password
                </label>
                <input
                  id="edit-password"
                  type="password"
                  autoComplete="new-password"
                  {...register("password")}
                  className="w-full font-mono text-xs"
                  placeholder="Leave blank to keep current password."
                />
                <span className="text-[10px] text-[#9CA3AF] block mt-1">
                  Leave blank to keep current password.
                </span>
                {errors.password && (
                  <p className="mt-1 text-xs text-[#EF4444] font-mono">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label
                  htmlFor="edit-role"
                  className={labelCls}
                >
                  Role
                </label>
                <select
                  id="edit-role"
                  {...register("role")}
                  className="w-full"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-xs text-[#EF4444] font-mono">
                    {errors.role.message}
                  </p>
                )}
                {user.id === currentUserId && selectedRole !== "admin" && (
                  <p className="rounded-none bg-[#F59E0B]/10 px-4 py-2.5 text-xs text-[#F59E0B] border border-[#F59E0B]/20 font-mono mt-2 uppercase tracking-wider font-semibold">
                    Warning: Demoting yourself will remove your admin permissions immediately.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#D8D6D3]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center justify-center rounded-none border border-[#D8D6D3] bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#6F7B8E] hover:bg-black/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-none bg-[#1C335E] text-white border border-[#1C335E] px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-[#16294C] transition-all disabled:opacity-50 cursor-pointer"
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
