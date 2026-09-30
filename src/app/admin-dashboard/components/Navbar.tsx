"use client"

import React from 'react'
import { RiSearchLine, RiNotification3Line, RiShieldCheckLine, RiUser3Line } from 'react-icons/ri'

function Navbar() {
  return (
    <header className="sticky top-0 z-20 flex w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 py-3.5 backdrop-blur-md shadow-xs lg:px-8">
      {/* Left section: Workspace Title & System Status */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Workspace
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live System
            </span>
          </div>
          <h1 className="mt-0.5 text-lg font-extrabold text-slate-900 tracking-tight">
            Hotel & POS Admin Console
          </h1>
        </div>
      </div>

      {/* Right section: Global Search, Notifications & User Avatar */}
      <div className="flex items-center gap-4">
        {/* Search Input Bar */}
        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-100/80 px-3.5 py-2 text-xs text-slate-600 border border-slate-200/60 focus-within:bg-white focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100 transition-all duration-200">
          <RiSearchLine size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search branches, areas, tables..."
            className="bg-transparent border-none outline-none text-xs w-48 text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="h-6 w-px bg-slate-200" />

        {/* Notifications Button */}
        <button
          type="button"
          className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          title="Notifications"
        >
          <RiNotification3Line size={20} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* User Profile Badge */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white shadow-sm ring-2 ring-red-500/20">
            <RiShieldCheckLine size={18} className="text-red-400" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">Super Admin</p>
            <p className="text-[10px] font-semibold text-red-600">Owner Access</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar