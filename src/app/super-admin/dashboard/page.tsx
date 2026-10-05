"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/src/app/services/api";
import {
  RiBuilding4Line,
  RiShieldCheckLine,
  RiForbidLine,
  RiAwardLine,
  RiGroupLine,
  RiUserFollowLine,
  RiTimeLine,
  RiArrowRightLine,
  RiAddCircleLine,
} from "react-icons/ri";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await api.get("/super-admin/stats");
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load platform stats", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-slate-400 py-20 text-center">Loading platform metrics...</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800/40">
            SaaS Platform Control Center
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-2">Product Owner Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Global metrics across all customer organizations, licenses, and platform activity.
          </p>
        </div>

        <Link
          href="/super-admin/organizations/create"
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-orange-950/50 transition transform hover:-translate-y-0.5"
        >
          <RiAddCircleLine size={19} />
          <span>Onboard Hotel Customer</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Organizations */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Organizations</span>
            <span className="p-2.5 bg-blue-950 text-blue-400 rounded-xl border border-blue-800/30">
              <RiBuilding4Line size={20} />
            </span>
          </div>
          <div className="text-3xl font-black text-white mt-4">{stats?.totalOrganizations || 0}</div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-emerald-400 font-semibold">{stats?.activeOrganizations || 0} Active</span>
            <span className="text-slate-600">•</span>
            <span className="text-rose-400 font-semibold">{stats?.suspendedOrganizations || 0} Suspended</span>
          </div>
        </div>

        {/* Customer Licenses */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Licenses</span>
            <span className="p-2.5 bg-amber-950 text-amber-400 rounded-xl border border-amber-800/30">
              <RiAwardLine size={20} />
            </span>
          </div>
          <div className="text-3xl font-black text-amber-400 mt-4">{stats?.lifetimeCustomers || 0}</div>
          <div className="text-xs text-slate-400 mt-2">
            Lifetime Customers ({stats?.subscriptionCustomers || 0} Subscriptions)
          </div>
        </div>

        {/* Platform Users */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</span>
            <span className="p-2.5 bg-purple-950 text-purple-400 rounded-xl border border-purple-800/30">
              <RiGroupLine size={20} />
            </span>
          </div>
          <div className="text-3xl font-black text-white mt-4">{stats?.totalUsers || 0}</div>
          <div className="text-xs text-emerald-400 font-semibold mt-2">
            {stats?.activeUsers || 0} Active Staff & Admins
          </div>
        </div>

        {/* System Health */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tenant Health</span>
            <span className="p-2.5 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-800/30">
              <RiShieldCheckLine size={20} />
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-4">100%</div>
          <div className="text-xs text-slate-400 mt-2">Multi-Tenant Isolation Strict</div>
        </div>
      </div>

      {/* Main Grid: Recent Organizations & Recent Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Organizations */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <RiBuilding4Line className="text-amber-400" />
                <span>Recent Hotel Organizations</span>
              </h2>
              <Link
                href="/super-admin/organizations"
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <span>View All</span>
                <RiArrowRightLine />
              </Link>
            </div>

            <div className="divide-y divide-slate-800/60 mt-2">
              {(stats?.recentOrganizations || []).map((org: any) => (
                <div key={org._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-slate-100">{org.name}</div>
                    <div className="text-xs text-slate-400">
                      Owner: {org.owner?.name || "Unassigned"} ({org.email})
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        org.status === "ACTIVE"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                          : "bg-rose-950 text-rose-400 border border-rose-800/40"
                      }`}
                    >
                      {org.status}
                    </span>
                    <div className="text-[10px] text-amber-400/90 font-mono mt-0.5">
                      {org.license?.type || "LIFETIME"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Platform Security Audit */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <RiTimeLine className="text-amber-400" />
                <span>Recent Platform Audit Activity</span>
              </h2>
              <Link
                href="/super-admin/audit-logs"
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <span>All Logs</span>
                <RiArrowRightLine />
              </Link>
            </div>

            <div className="divide-y divide-slate-800/60 mt-2">
              {(stats?.recentAuditLogs || []).map((log: any) => (
                <div key={log._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-200">
                      {log.action} • <span className="text-slate-400">{log.module}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-sm">
                      {log.description}
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
