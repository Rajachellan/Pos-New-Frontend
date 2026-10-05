"use client"

import React from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  RiDashboardLine,
  RiRestaurantLine,
  RiFileList3Line,
  RiTv2Line,
  RiUserLine,
  RiSettings3Line,
  RiLogoutBoxLine,
  RiShieldUserLine,
  RiShieldCheckLine,
} from "react-icons/ri"
import { MdMeetingRoom, MdOutlineBorderColor, MdRestaurantMenu } from "react-icons/md"
import { PiMapPinSimpleAreaFill } from "react-icons/pi"
import { FaHistory } from "react-icons/fa"
import { SiJirasoftware } from "react-icons/si"
import { useAuth } from '@/src/app/context/AuthContext'

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, organizationName, organizationRole, isAdmin, isManager, isStaff, isSuperAdmin, logout } = useAuth()

  const displayName = user?.name || user?.username || "Staff User"
  const userRoleDisplay = isSuperAdmin()
    ? "Super Admin"
    : isAdmin()
    ? "Admin"
    : isManager()
    ? "Manager"
    : "Staff"

  const roleColorBadge = isSuperAdmin()
    ? "bg-purple-950/80 text-purple-300 border-purple-800/50"
    : isAdmin()
    ? "bg-red-950/80 text-red-300 border-red-800/50"
    : isManager()
    ? "bg-amber-950/80 text-amber-300 border-amber-800/50"
    : "bg-slate-800 text-slate-300 border-slate-700/60"

  const operationalMenuItems = [
    {
      label: "Dashboard",
      href: "/user-dashboard",
      icon: RiDashboardLine,
    },
    {
      label: "Floors & Tables",
      href: "/user-dashboard/tables",
      icon: PiMapPinSimpleAreaFill,
    },
    {
      label: "POS Menu",
      href: "/user-dashboard/menus",
      icon: RiRestaurantLine,
    },
    {
      label: "Menu Management",
      href: "/user-dashboard/menu-management",
      icon: MdRestaurantMenu,
    },
    {
      label: "Current Orders",
      href: "/user-dashboard/order-history?tab=ACTIVE",
      icon: MdOutlineBorderColor,
    },
    {
      label: "Order History",
      href: "/user-dashboard/order-history",
      icon: FaHistory,
    },
    {
      label: "KDS (Kitchen)",
      href: "/user-dashboard/kitchen",
      icon: RiFileList3Line,
    },
    {
      label: "Customer TV",
      href: "/user-dashboard/kitchen/customer-tv",
      icon: RiTv2Line,
    },
    {
      label: "Rooms",
      href: "/user-dashboard/rooms",
      icon: MdMeetingRoom,
    },
    {
      label: "Room History",
      href: "/user-dashboard/rooms/history",
      icon: FaHistory,
    },
    {
      label: "Settings",
      href: "/user-dashboard/settings",
      icon: RiSettings3Line,
    },
    {
      label: "Profile",
      href: "/user-dashboard/profile",
      icon: RiUserLine,
    },
  ]

  return (
    <aside className="h-screen sticky left-0 top-0 flex flex-col justify-between bg-[#0b101b] border-r border-slate-800/80 w-64 p-4 text-white z-40 select-none flex-shrink-0 shadow-2xl">
      <div className="flex flex-col gap-4 overflow-y-auto pr-1">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 shadow-md shadow-red-900/40">
            <SiJirasoftware className="text-white" size={20} />
          </div>
          <div className="truncate">
            <h2 className="font-black text-sm tracking-wide text-white uppercase truncate">
              {organizationName || "HOTEL POS"}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider uppercase border ${roleColorBadge}`}>
                {userRoleDisplay}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Terminal</span>
            </div>
          </div>
        </div>

        {/* Quick Link to Admin Console (Only visible to Admins) */}
        {isAdmin() && (
          <div className="px-1 pt-1">
            <Link
              href="/admin-dashboard"
              className="group flex items-center justify-between gap-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-2.5 border border-red-900/40 hover:border-red-600/70 hover:bg-slate-800/90 transition shadow-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 group-hover:bg-red-600 group-hover:text-white transition">
                  <RiShieldCheckLine size={15} />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white group-hover:text-red-400 transition truncate leading-tight">
                    Admin Console
                  </p>
                  <p className="text-[9px] text-slate-400">Branches, Users, Roles</p>
                </div>
              </div>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                Manage
              </span>
            </Link>
          </div>
        )}

        <div className="border-b border-slate-800/80 my-1"></div>

        {/* Navigation List */}
        <nav className="flex flex-col gap-1">
          {operationalMenuItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== "/user-dashboard" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-red-600 text-white shadow-md shadow-red-900/40 font-bold"
                    : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                }`}
              >
                <Icon size={18} className={isActive ? "text-white" : "text-slate-400"} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom User Card & Sign Out */}
      <div className="pt-3 border-t border-slate-800/80 space-y-2">
        <div
          onClick={() => router.push("/user-dashboard/profile")}
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:bg-slate-800/90 transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {displayName}
              </p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5 capitalize">
                {userRoleDisplay}
              </p>
            </div>
          </div>
          <svg className="text-slate-400 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition cursor-pointer"
        >
          <RiLogoutBoxLine size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}