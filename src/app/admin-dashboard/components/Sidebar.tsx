"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  RiDashboardLine,
  RiRestaurantLine,
  RiUserLine,
  RiFileList3Line,
} from "react-icons/ri"
import { MdTableRestaurant } from "react-icons/md"
import { PiMapPinSimpleAreaFill, PiForkKnifeBold } from "react-icons/pi"
import { FaCodeBranch } from "react-icons/fa"
import { SiJirasoftware } from "react-icons/si"
import { IoIosLogOut } from "react-icons/io"

function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const menuList = [
    {
      label: "Admin Overview",
      href: "/admin-dashboard",
      icon: RiDashboardLine,
    },
    {
      label: "Add Branch",
      href: "/admin-dashboard/add-branch",
      icon: FaCodeBranch,
    },
    {
      label: "Add Areas",
      href: "/admin-dashboard/add-areas",
      icon: PiMapPinSimpleAreaFill,
    },
    {
      label: "Add Tables",
      href: "/admin-dashboard/add-tables",
      icon: MdTableRestaurant,
    },
    {
      label: "Add Food Menu",
      href: "/admin-dashboard/add-menus",
      icon: PiForkKnifeBold,
    },
    {
      label: "Add Users",
      href: "/admin-dashboard/add-users",
      icon: RiUserLine,
    },
    {
      label: "POS Staff View",
      href: "/user-dashboard",
      icon: RiRestaurantLine,
    },
  ]

  function logOut() {
    localStorage.removeItem("Token")
    router.push('/user/login')
  }

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-slate-800 bg-slate-900 p-5 text-slate-200 shadow-2xl z-30 flex-shrink-0">
      <div className="flex flex-col gap-6">
        {/* Logo Branding */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 shadow-lg shadow-red-900/40">
            <SiJirasoftware className="text-white" size={22} />
          </div>
          <div>
            <h2 className="font-extrabold tracking-wider text-white text-base leading-none">
              POS <span className="text-red-500">ADMIN</span>
            </h2>
            <p className="mt-1 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
              Management Portal
            </p>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

        {/* Navigation items */}
        <nav className="flex flex-col gap-1.5">
          {menuList.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-900/30"
                    : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
                }`}
              >
                <Icon
                  size={19}
                  className={`transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-red-400"
                  }`}
                />
                <span className="text-[13px]">{item.label}</span>

                {isActive && (
                  <span className="absolute right-2 h-2 w-2 rounded-full bg-white animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="border-t border-slate-800/80 pt-4">
        <button
          onClick={logOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800/90 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-red-400 border border-slate-700/60 transition duration-200 hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-lg shadow-red-900/20"
        >
          <IoIosLogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar