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
      <div className="border-b border-slate-200/80 pb-6">
        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-red-50 text-[#e02424] border border-red-100">
            <RiUserSharedLine size={24} />
          </span>
          <span>Platform Users Directory</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1.5">
          Complete cross-tenant directory of platform users, organization owners, administrators, and staff.
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-red-200 border-t-[#e02424] rounded-full animate-spin"></div>
            <span>Loading users...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4 font-bold">User</th>
                  <th className="py-3.5 px-4 font-bold">System Role</th>
                  <th className="py-3.5 px-4 font-bold">Organization</th>
                  <th className="py-3.5 px-4 font-bold">Org Role / Custom Role</th>
                  <th className="py-3.5 px-4 font-bold">Branch</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-red-50/20 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          u.systemRole === "SUPER_ADMIN"
                            ? "bg-red-50 text-red-700 border border-red-200/70"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {u.systemRole}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.organization ? (
                        <div className="font-bold text-slate-800">{u.organization.name}</div>
                      ) : (
                        <span className="text-slate-400 italic">Platform Level (None)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded text-[11px]">
                        {u.organizationRole || u.role?.name || "None"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {u.branch ? `${u.branch.branchName} (${u.branch.branchCode})` : "All Branches"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                            : "bg-rose-50 text-rose-700 border border-rose-200/80"
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
