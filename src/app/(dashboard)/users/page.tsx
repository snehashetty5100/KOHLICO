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
      <div className="border-b border-gray-100 dark:border-gray-900 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
          User Management
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage team member accounts and administrative permissions.
        </p>
      </div>

      {/* Create user form */}
      <CreateUserForm />

      {/* Users table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-gray-950 dark:text-white">
          Active Users
        </h2>

        {users.length === 0 ? (
          <p className="text-gray-500 text-sm">No users found.</p>
        ) : (
          <div className="overflow-hidden glass-card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-900 text-sm">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-900/10 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-900 bg-white dark:bg-gray-950/20">
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-900/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-gray-950 dark:text-white">
                        {u.email}
                      </td>

                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium">
                        {u.name ?? "—"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${u.role === "admin"
                              ? "bg-primary-50 text-primary-700 dark:bg-primary-950/20 dark:text-primary-400 border-primary-200/50 dark:border-primary-900/50"
                              : "bg-gray-50 text-gray-700 dark:bg-gray-950/20 dark:text-gray-400 border-gray-200/50 dark:border-gray-800/50"
                            }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono">
                        {new Date(u.createdAt).toLocaleDateString("en-CA")}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <EditUserButton
                            user={u}
                            currentUserId={session.user.id}
                          />

                          {u.id === session.user.id ? (
                            <span className="text-xs text-gray-400 font-semibold">
                              You
                            </span>
                          ) : (
                            <DeleteUserButton id={u.id} email={u.email} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}