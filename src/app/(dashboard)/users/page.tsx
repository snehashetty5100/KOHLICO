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
import Link from "next/link";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getServerSession(authOptions);

  // Non-admins are redirected to the dashboard.
  if (!session || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const { q } = await searchParams;
  const query = q?.trim() || "";

  const users = await db.user.findMany({
    where: query
      ? {
          OR: [
            { email: { contains: query } },
            { name: { contains: query } },
          ],
        }
      : undefined,
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
      <div className="border-b border-[#D8D6D3] pb-6">
        <h1 className="text-3xl font-serif font-bold text-[#1C335E]">
          User Management
        </h1>
        <p className="mt-1.5 text-xs text-[#6F7B8E] uppercase tracking-wider font-mono">
          Manage team member accounts and administrative permissions.
        </p>
      </div>

      {/* Create user form */}
      <CreateUserForm />

      {/* Users table */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-[#D8D6D3]/40 pb-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#1C335E]">
            Active Accounts
          </h2>
          {query && (
            <Link
              href="/users"
              className="text-xs font-semibold text-[#E28924] hover:underline uppercase tracking-wider font-sans"
            >
              Clear Search
            </Link>
          )}
        </div>

        {/* Active search filter details */}
        {query && users.length > 0 && (
          <div className="flex items-center justify-between bg-[#F7F5F2] border border-[#D8D6D3] px-4 py-2 text-xs text-[#1C335E] font-mono rounded-none">
            <span>
              SHOWING SEARCH RESULTS FOR: <span className="font-bold">"{query}"</span> ({users.length} {users.length === 1 ? "match" : "matches"} found)
            </span>
          </div>
        )}

        {users.length === 0 ? (
          <div className="border border-dashed border-[#D8D6D3] p-12 text-center">
            <p className="text-sm font-serif text-[#1C335E] mb-2">
              {query ? "No Search Results" : "No Accounts Recorded"}
            </p>
            <p className="text-xs text-[#6F7B8E] max-w-sm mx-auto">
              {query
                ? `We couldn't find any users matching "${query}".`
                : "No accounts recorded."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#D8D6D3] text-xs font-semibold text-[#6F7B8E] uppercase tracking-wider">
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#D8D6D3]">
                {users.map((u) => {
                  const isAdmin = u.role === "admin";
                  const roleLabel = isAdmin ? "[ADMIN]" : "[STAFF]";
                  const roleColor = isAdmin ? "text-[#1C335E]" : "text-[#6F7B8E]";

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[#F7F5F2] transition-colors duration-100"
                    >
                      <td className="py-3 pr-4 font-mono font-bold text-[#1C335E]">
                        {u.email}
                      </td>

                      <td className="py-3 px-4 text-[#1C335E]">
                        {u.name ?? "—"}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`font-mono text-xs font-semibold tracking-wider ${roleColor}`}>
                          {roleLabel}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[#6F7B8E] font-mono text-xs">
                        {new Date(u.createdAt).toLocaleDateString("en-CA")}
                      </td>

                      <td className="py-3 pl-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <EditUserButton
                            user={u}
                            currentUserId={session.user.id}
                          />

                          {u.id === session.user.id ? (
                            <span className="inline-flex items-center justify-center border border-transparent px-3 py-1 text-xs font-semibold uppercase tracking-wider font-mono text-[#6F7B8E]">
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