"use client";

import React, { useEffect, useState } from "react";
import api from "@/src/app/services/api";
import { RiFileHistoryLine, RiShieldLine, RiTimeLine } from "react-icons/ri";

export default function SuperAdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await api.get("/super-admin/audit-logs");
      if (res.data?.success) {
        setLogs(res.data.data.logs || []);
      }
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-slate-200/80 pb-6">
        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-red-50 text-[#e02424] border border-red-100">
            <RiFileHistoryLine size={24} />
          </span>
          <span>Security & System Audit Logs</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1.5">
          Immutable audit record of user logins, organization lifecycle events, role changes, and administrative actions.
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-red-200 border-t-[#e02424] rounded-full animate-spin"></div>
            <span>Loading audit logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">No audit entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Timestamp</th>
                  <th className="py-3.5 px-4 font-bold">Action</th>
                  <th className="py-3.5 px-4 font-bold">Module</th>
                  <th className="py-3.5 px-4 font-bold">Actor / User</th>
                  <th className="py-3.5 px-4 font-bold">Organization</th>
                  <th className="py-3.5 px-4 font-bold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-red-50/20 transition">
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#e02424] font-sans text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[10px] uppercase">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-bold font-sans">
                      {log.user ? `${log.user.name} (${log.user.email})` : "System / Anonymous"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium font-sans">
                      {log.organization?.name || "Global Platform"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-sans">
                      {log.description}
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
