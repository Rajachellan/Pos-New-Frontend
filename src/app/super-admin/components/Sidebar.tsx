"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiDashboard3Line,
  RiBuilding4Line,
  RiUserSharedLine,
  RiShieldFlashLine,
  RiFileHistoryLine,
  RiLogoutBoxRLine,
  RiAppsLine,
} from "react-icons/ri";
import { useAuth } from "@/src/app/context/AuthContext";

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    {
      label: "Platform Overview",
      href: "/super-admin/dashboard",
      icon: RiDashboard3Line,
    },
    {
      label: "Organizations",
      href: "/super-admin/organizations",
      icon: RiBuilding4Line,
    },
    {
      label: "Onboard Customer",
      href: "/super-admin/organizations/create",
      icon: RiAppsLine,
    },
    {
      label: "Platform Users",
      href: "/super-admin/users",
      icon: RiUserSharedLine,
    },
    {
      label: "Audit Logs",
      href: "/super-admin/audit-logs",
      icon: RiFileHistoryLine,
    },
  ];

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-slate-200/80 bg-white p-5 text-slate-800 shadow-sm z-30 flex-shrink-0">
      <div className="flex flex-col gap-6">
        {/* HotelPro Super Admin Branding */}
        <Link href="/super-admin/dashboard" className="flex items-center gap-3 px-1 py-1 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#9b1c1c] via-[#e02424] to-[#f05252] flex items-center justify-center text-white shadow-md shadow-red-500/20 shrink-0 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M19 2H5C3.89543 2 3 2.89543 3 4V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V4C21 2.89543 20.1046 2 19 2ZM7 6H9V8H7V6ZM7 10H9V12H7V10ZM7 14H9V16H7V14ZM17 18H7V20H17V18ZM17 16H15V14H17V16ZM17 12H15V10H17V12ZM17 8H15V6H17V8ZM13 6H11V8H13V6ZM13 10H11V12H13V10ZM13 14H11V16H13V14Z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="font-black tracking-tight text-slate-900 text-lg leading-none">
              Hotel<span className="text-[#e02424]">Pro</span>
            </h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-red-50 text-red-700 border border-red-200/70">
                SUPER ADMIN
              </span>
              <span className="text-[11px] text-slate-500 font-medium truncate max-w-[80px]">{user?.name}</span>
            </div>
          </div>
        </Link>

        <div className="h-px bg-slate-100" />

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-[#9b1c1c] via-[#e02424] to-[#f05252] text-white font-bold shadow-md shadow-red-500/20"
                    : "text-slate-600 hover:bg-red-50/70 hover:text-[#e02424]"
                }`}
              >
                <Icon
                  size={18}
                  className={`transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-[#e02424]"
                  }`}
                />
                <span className="text-[13px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Switch / Logout */}
      <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
        <Link
          href="/admin-dashboard"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 px-3 py-2 text-xs font-semibold text-slate-700 transition"
        >
          <span>View POS / Admin</span>
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 hover:bg-rose-100/80 px-4 py-2 text-xs font-semibold tracking-wide text-rose-700 border border-rose-200/70 transition"
        >
          <RiLogoutBoxRLine size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
