"use client";

import React, { useEffect, useState } from "react";
import api from "@/src/app/services/api";
import { RiUserSharedLine, RiBuilding4Line, RiShieldCheckLine } from "react-icons/ri";

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await api.get("/super-admin/users");
      if (res.data?.success) {
        setUsers(res.data.data.users || []);
      }
    } catch (err) {
      console.error("Failed to load platform users", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <RiUserSharedLine className="text-amber-400" />
          <span>Platform Users Directory</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Complete cross-tenant directory of platform users, organization owners, administrators, and staff.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">User</th>
                  <th className="py-3.5 px-4 font-semibold">System Role</th>
                  <th className="py-3.5 px-4 font-semibold">Organization</th>
                  <th className="py-3.5 px-4 font-semibold">Org Role / Custom Role</th>
                  <th className="py-3.5 px-4 font-semibold">Branch</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.systemRole === "SUPER_ADMIN"
                            ? "bg-amber-950 text-amber-400 border border-amber-800/40"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {u.systemRole}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.organization ? (
                        <div className="font-semibold text-slate-200">{u.organization.name}</div>
                      ) : (
                        <span className="text-slate-500 italic">Platform Level (None)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-200">
                        {u.organizationRole || u.role?.name || "None"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {u.branch ? `${u.branch.branchName} (${u.branch.branchCode})` : "All Branches"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.status === "ACTIVE"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                            : "bg-rose-950 text-rose-400 border border-rose-800/40"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
