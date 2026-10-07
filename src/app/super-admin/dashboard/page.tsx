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
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
        <div className="w-10 h-10 border-3 border-red-200 border-t-[#e02424] rounded-full animate-spin"></div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Loading platform metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200/70 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e02424]"></span>
            HotelPro Control Center
          </span>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mt-2.5">
            Product Owner Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Global metrics across all customer organizations, licenses, and platform activity.
          </p>
        </div>

        <Link
          href="/super-admin/organizations/create"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-tr from-[#9b1c1c] via-[#e02424] to-[#f05252] hover:opacity-95 text-white font-bold px-5 py-3 rounded-xl text-sm shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/35 transition transform hover:-translate-y-0.5 shrink-0"
        >
          <RiAddCircleLine size={20} />
          <span>Onboard Hotel Customer</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Organizations */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-red-200 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Organizations</span>
            <span className="p-2.5 bg-red-50 text-[#e02424] rounded-xl border border-red-100 group-hover:scale-105 transition-transform">
              <RiBuilding4Line size={20} />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-4 tracking-tight">{stats?.totalOrganizations || 0}</div>
          <div className="flex items-center gap-2 mt-2.5 text-xs">
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md font-semibold">
              {stats?.activeOrganizations || 0} Active
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-rose-700 bg-rose-50 border border-rose-200/70 px-2 py-0.5 rounded-md font-semibold">
              {stats?.suspendedOrganizations || 0} Suspended
            </span>
          </div>
        </div>

        {/* Customer Licenses */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-amber-200 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Licenses</span>
            <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 group-hover:scale-105 transition-transform">
              <RiAwardLine size={20} />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-4 tracking-tight">{stats?.lifetimeCustomers || 0}</div>
          <div className="text-xs text-slate-500 mt-2.5 font-medium">
            Lifetime Customers ({stats?.subscriptionCustomers || 0} Subscriptions)
          </div>
        </div>

        {/* Platform Users */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-purple-200 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Users</span>
            <span className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 group-hover:scale-105 transition-transform">
              <RiGroupLine size={20} />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-4 tracking-tight">{stats?.totalUsers || 0}</div>
          <div className="text-xs text-emerald-700 font-semibold mt-2.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {stats?.activeUsers || 0} Active Staff & Admins
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant Health</span>
            <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 group-hover:scale-105 transition-transform">
              <RiShieldCheckLine size={20} />
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-4 tracking-tight">100%</div>
          <div className="text-xs text-slate-500 mt-2.5 font-medium">Multi-Tenant Isolation Strict</div>
        </div>
      </div>

      {/* Main Grid: Recent Organizations & Recent Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Organizations */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-bold text-base text-slate-900 flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-red-50 text-[#e02424]">
                  <RiBuilding4Line size={18} />
                </span>
                <span>Recent Hotel Organizations</span>
              </h2>
              <Link
                href="/super-admin/organizations"
                className="text-xs font-bold text-[#e02424] hover:text-[#9b1c1c] flex items-center gap-1 transition"
              >
                <span>View All</span>
                <RiArrowRightLine />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {(stats?.recentOrganizations || []).map((org: any) => (
                <div key={org._id} className="py-3 px-2 -mx-2 hover:bg-slate-50/80 rounded-xl transition flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{org.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Owner: {org.owner?.name || "Unassigned"} ({org.email})
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        org.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                          : "bg-rose-50 text-rose-700 border border-rose-200/80"
                      }`}
                    >
                      {org.status}
                    </span>
                    <div className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">
                      {org.license?.type || "LIFETIME"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Platform Security Audit */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-bold text-base text-slate-900 flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-red-50 text-[#e02424]">
                  <RiTimeLine size={18} />
                </span>
                <span>Recent Platform Audit Activity</span>
              </h2>
              <Link
                href="/super-admin/audit-logs"
                className="text-xs font-bold text-[#e02424] hover:text-[#9b1c1c] flex items-center gap-1 transition"
              >
                <span>All Logs</span>
                <RiArrowRightLine />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {(stats?.recentAuditLogs || []).map((log: any) => (
                <div key={log._id} className="py-2.5 px-2 -mx-2 hover:bg-slate-50/80 rounded-xl transition flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-3">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      <span>{log.action}</span>
                      <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200/60 px-1.5 py-0.2 rounded">
                        {log.module}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-sm mt-0.5">
                      {log.description}
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 font-medium whitespace-nowrap">
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
