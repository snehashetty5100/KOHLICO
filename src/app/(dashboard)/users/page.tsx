// src/app/(dashboard)/users/page.tsx
// Admin-only user management page.
// Lists all users and provides a form to create new ones.

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import CreateUserForm from "./create-user-form";
import DeleteUserButton from "./delete-user-button";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  // Non-admins are redirected to the dashboard.
  if (!session || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage team member accounts. Only admins can access this page.
        </p>
      </div>

      {/* Create user form */}
      <CreateUserForm />

      {/* Users table */}
      {users.length === 0 ? (
        <p className="text-gray-500 text-sm">No users found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Role
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Created
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {u.email}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {u.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString("en-CA")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id === session.user.id ? (
                      <span className="text-xs text-gray-400">You</span>
                    ) : (
                      <DeleteUserButton id={u.id} email={u.email} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
