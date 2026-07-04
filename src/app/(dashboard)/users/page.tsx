// src/app/(dashboard)/users/page.tsx
// Admin-only user management page.
// Lists all users and provides a form to create new ones.

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import CreateUserForm from "./create-user-form";
import DeleteUserButton from "./delete-user-button";
import EditUserButton from "./edit-user-button";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  // Non-admins are redirected to the dashboard.
  if (!session || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-[#D8D3C8] dark:border-[#33312D] pb-6">
        <h1 className="text-3xl font-serif font-bold text-[#1C2B33] dark:text-[#F7F5F1]">
          User Management
        </h1>
        <p className="mt-1.5 text-xs text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider font-mono">
          Manage team member accounts and administrative permissions.
        </p>
      </div>

      {/* Create user form */}
      <CreateUserForm />

      {/* Users table */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#1C2B33] dark:text-[#F7F5F1]">
          Active Accounts
        </h2>

        {users.length === 0 ? (
          <p className="text-xs text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider font-mono">No accounts recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#D8D3C8] dark:border-[#33312D] text-xs font-semibold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider">
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#D8D3C8] dark:divide-[#33312D]">
                {users.map((u) => {
                  const isAdmin = u.role === "admin";
                  const roleLabel = isAdmin ? "[ADMIN]" : "[STAFF]";
                  const roleColor = isAdmin ? "text-[#2E5E4E] dark:text-[#49826D]" : "text-[#7A756B]";

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors duration-100"
                    >
                      <td className="py-3 pr-4 font-mono font-bold text-[#1C2B33] dark:text-[#F7F5F1]">
                        {u.email}
                      </td>

                      <td className="py-3 px-4 text-[#1C2B33] dark:text-[#F7F5F1]">
                        {u.name ?? "—"}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`font-mono text-xs font-semibold tracking-wider ${roleColor}`}>
                          {roleLabel}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[#7A756B] dark:text-[#9E998F] font-mono text-xs">
                        {new Date(u.createdAt).toLocaleDateString("en-CA")}
                      </td>

                      <td className="py-3 pl-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <EditUserButton
                            user={u}
                            currentUserId={session.user.id}
                          />

                          {u.id === session.user.id ? (
                            <span className="text-xs text-[#7A756B] font-semibold px-2 uppercase tracking-wider font-mono">
                              [YOU]
                            </span>
                          ) : (
                            <DeleteUserButton id={u.id} email={u.email} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}