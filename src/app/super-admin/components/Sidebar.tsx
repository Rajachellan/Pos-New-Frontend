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
    <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-slate-800 bg-slate-950 p-5 text-slate-200 shadow-2xl z-30 flex-shrink-0">
      <div className="flex flex-col gap-6">
        {/* SaaS Super Admin Branding */}
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 shadow-lg shadow-orange-900/40 text-slate-950 font-black text-xl">
            S
          </div>
          <div>
            <h2 className="font-extrabold tracking-wider text-white text-sm leading-none flex items-center gap-1.5">
              SAAS <span className="text-amber-500">PLATFORM</span>
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-amber-950 text-amber-400 border border-amber-800/40">
                SUPER ADMIN
              </span>
              <span className="text-[10px] text-slate-400 truncate max-w-[80px]">{user?.name}</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

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
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold shadow-md shadow-orange-900/30"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`}
              >
                <Icon
                  size={18}
                  className={`transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-slate-950" : "text-slate-400 group-hover:text-amber-400"
                  }`}
                />
                <span className="text-[13px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Switch / Logout */}
      <div className="border-t border-slate-900 pt-3 flex flex-col gap-2">
        <Link
          href="/admin-dashboard"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <span>View POS / Admin</span>
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900/80 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-400 border border-slate-800 hover:bg-rose-600 hover:text-white transition"
        >
          <RiLogoutBoxRLine size={17} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
