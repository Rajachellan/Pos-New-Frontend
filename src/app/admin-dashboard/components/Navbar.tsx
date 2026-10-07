"use client"

import React from 'react'
import Link from 'next/link'
import { RiSearchLine, RiNotification3Line, RiShieldCheckLine, RiRestaurantLine, RiMenuLine } from 'react-icons/ri'
import { useAuth } from '@/src/app/context/AuthContext'

interface NavbarProps {
  onToggleMobileMenu?: () => void
}

function Navbar({ onToggleMobileMenu }: NavbarProps) {
  const { user, organizationName } = useAuth()

  const displayName = user?.name || user?.username || 'User'
  const displayRole = user?.systemRole === 'SUPER_ADMIN'
    ? 'Super Admin'
    : user?.organizationRole === 'OWNER' || user?.organizationRole === 'ADMIN'
      ? 'Admin (Full Access)'
      : 'Staff Access'

  return (
    <header className="sticky top-0 z-20 flex w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 sm:px-6 py-2.5 sm:py-3 backdrop-blur-md shadow-xs lg:px-8">
      {/* Left section: Hamburger (Mobile) + Workspace Title & System Status */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition"
          aria-label="Open Navigation Sidebar"
        >
          <RiMenuLine size={20} />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest text-red-600 truncate max-w-[120px] sm:max-w-none">
              {organizationName || 'HOTEL POS'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] sm:text-[11px] font-bold text-emerald-700 border border-emerald-200/60 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <h1 className="mt-0.5 text-sm sm:text-base lg:text-lg font-extrabold text-slate-900 tracking-tight truncate">
            {organizationName ? `${organizationName} Admin Console` : 'Admin Console'}
          </h1>
        </div>
      </div>

      {/* Right section: POS Switcher, Search, Notifications & User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Launch POS Terminal Button */}
        <Link
          href="/user-dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-white shadow-md shadow-red-900/20 hover:from-red-500 hover:to-rose-500 transition-all duration-200 active:scale-95 shrink-0"
          title="Open POS Terminal Floor & Table View"
        >
          <RiRestaurantLine size={15} />
          <span className="hidden sm:inline">Launch POS Terminal</span>
          <span className="sm:hidden">POS</span>
        </Link>

        {/* Search Input Bar */}
        <div className="hidden md:flex items-center gap-2 rounded-xl bg-slate-100/90 px-3.5 py-2 text-xs text-slate-600 border border-slate-200/60 focus-within:bg-white focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100 transition-all duration-200">
          <RiSearchLine size={15} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search branches, areas, tables..."
            className="bg-transparent border-none outline-none text-xs w-44 text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="hidden sm:block h-6 w-px bg-slate-200" />

        {/* Notifications Button */}
        <button
          type="button"
          className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          title="Notifications"
        >
          <RiNotification3Line size={19} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* User Profile Badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white shadow-sm ring-2 ring-red-500/20">
            <RiShieldCheckLine size={18} className="text-red-400" />
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">{displayName}</p>
            <p className="text-[10px] font-semibold text-red-600">{displayRole}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
