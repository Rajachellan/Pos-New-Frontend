"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  RiDashboardLine,
  RiRestaurantLine,
  RiUserLine,
  RiShieldUserLine,
  RiSettings4Line,
  RiLineChartLine,
} from "react-icons/ri"
import { MdTableRestaurant } from "react-icons/md"
import { PiMapPinSimpleAreaFill, PiForkKnifeBold } from "react-icons/pi"
import { FaCodeBranch } from "react-icons/fa"
import { SiJirasoftware } from "react-icons/si"
import { IoIosLogOut } from "react-icons/io"
import { useAuth } from '@/src/app/context/AuthContext'

function Sidebar() {
  const pathname = usePathname()
  const { user, organizationName, organizationRole, hasPermission, isSuperAdmin, isOrganizationOwner, isAdmin, logout } = useAuth()

  const allMenuItems = [
    {
      label: "Overview",
      href: "/admin-dashboard",
      icon: RiDashboardLine,
      requiredPermission: "dashboard.view",
    },
    {
      label: "Finance & Analytics",
      href: "/admin-dashboard/finance",
      icon: RiLineChartLine,
      requiredPermission: "dashboard.view",
    },
    {
      label: "Branches & Org",
      href: "/admin-dashboard/add-branch",
      icon: FaCodeBranch,
      requiredPermission: "branch.view",
    },
    {
      label: "Dining Areas",
      href: "/admin-dashboard/add-areas",
      icon: PiMapPinSimpleAreaFill,
      requiredPermission: "table.view",
    },
    {
      label: "Tables",
      href: "/admin-dashboard/add-tables",
      icon: MdTableRestaurant,
      requiredPermission: "table.view",
    },
    {
      label: "Food Menu",
      href: "/admin-dashboard/add-menus",
      icon: PiForkKnifeBold,
      requiredPermission: "food_menu.view",
    },
    {
      label: "Staff & Users",
      href: "/admin-dashboard/add-users",
      icon: RiUserLine,
      requiredPermission: "user.view",
    },
    {
      label: "Roles & Permissions",
      href: "/admin-dashboard/roles",
      icon: RiShieldUserLine,
      requiredPermission: "role.view",
    },
    {
      label: "POS Operations",
      href: "/user-dashboard",
      icon: RiRestaurantLine,
      requiredPermission: "cart.view",
    },
  ]

  // Filter items based on user permissions
  const visibleMenuItems = allMenuItems.filter((item) => {
    if (isSuperAdmin() || isOrganizationOwner() || isAdmin()) return true
    return hasPermission(item.requiredPermission)
  })

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-slate-800 bg-slate-900 p-5 text-slate-200 shadow-2xl z-30 flex-shrink-0">
      <div className="flex flex-col gap-5">
        {/* Logo & Tenant Info */}
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 shadow-lg shadow-red-900/40">
            <SiJirasoftware className="text-white" size={22} />
          </div>
          <div className="truncate">
            <h2 className="font-extrabold tracking-wider text-white text-sm leading-none truncate">
              {organizationName || "HOTEL SAAS"}
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-red-950/80 text-red-400 border border-red-800/40">
                {organizationRole || (isSuperAdmin() ? "SUPER ADMIN" : "STAFF")}
              </span>
              <span className="text-[10px] text-slate-400 truncate">{user?.name}</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

        {/* Navigation items */}
        <nav className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-210px)] pr-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-900/30"
                    : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
                }`}
              >
                <Icon
                  size={18}
                  className={`transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-red-400"
                  }`}
                />
                <span className="text-[12.5px] truncate">{item.label}</span>

                {isActive && (
                  <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="border-t border-slate-800/80 pt-3">
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800/90 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-400 border border-slate-700/60 transition duration-200 hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-lg shadow-red-900/20"
        >
          <IoIosLogOut size={17} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar