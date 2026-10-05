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
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <RiFileHistoryLine className="text-amber-400" />
          <span>Security & System Audit Logs</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Immutable audit record of user logins, organization lifecycle events, role changes, and administrative actions.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No audit entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold">Action</th>
                  <th className="py-3.5 px-4 font-semibold">Module</th>
                  <th className="py-3.5 px-4 font-semibold">Actor / User</th>
                  <th className="py-3.5 px-4 font-semibold">Organization</th>
                  <th className="py-3.5 px-4 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-amber-400 font-sans text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 uppercase">
                      {log.module}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200 font-sans">
                      {log.user ? `${log.user.name} (${log.user.email})` : "System / Anonymous"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-sans">
                      {log.organization?.name || "Global Platform"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-sans">
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
