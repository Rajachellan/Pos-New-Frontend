"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaCodeBranch } from 'react-icons/fa'
import { PiMapPinSimpleAreaFill, PiForkKnifeBold } from 'react-icons/pi'
import { MdTableRestaurant } from 'react-icons/md'
import {
  RiUserLine,
  RiRestaurantLine,
  RiShieldUserLine,
  RiBuildingLine,
  RiStackLine,
  RiArrowRightLine,
  RiCheckboxCircleLine,
} from 'react-icons/ri'
import api from '../services/api'

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({
    branches: 0,
    areas: 0,
    tables: 0,
    menus: 0,
    loading: true,
  })

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        const [branchRes, areaRes, tableRes, menuRes] = await Promise.allSettled([
          api.get('/get/branch'),
          api.get('/get/area/all'),
          api.get('/get/all/tables'),
          api.get('/get/menus'),
        ])

        setStats({
          branches: branchRes.status === 'fulfilled' && branchRes.value.data.data ? branchRes.value.data.data.length : 0,
          areas: areaRes.status === 'fulfilled' && areaRes.value.data.data ? areaRes.value.data.data.length : 0,
          tables: tableRes.status === 'fulfilled' && tableRes.value.data.data ? tableRes.value.data.data.length : 0,
          menus: menuRes.status === 'fulfilled' && menuRes.value.data.data ? menuRes.value.data.data.length : 0,
          loading: false,
        })
      } catch (err) {
        setStats((prev) => ({ ...prev, loading: false }))
      }
    }

    fetchDashboardStats()
  }, [])

  const quickActions = [
    {
      title: 'Add Branch',
      description: 'Onboard hotel branches, register location details and system codes.',
      href: '/admin-dashboard/add-branch',
      icon: FaCodeBranch,
      gradient: 'from-red-500 to-rose-600',
      badge: `${stats.branches} Registered`,
    },
    {
      title: 'Add Areas',
      description: 'Configure dining zones, rooftop sections, AC halls, and garden spaces.',
      href: '/admin-dashboard/add-areas',
      icon: PiMapPinSimpleAreaFill,
      gradient: 'from-amber-500 to-orange-600',
      badge: `${stats.areas} Sections`,
    },
    {
      title: 'Add Tables',
      description: 'Set up physical table numbers and assign them to active dining areas.',
      href: '/admin-dashboard/add-tables',
      icon: MdTableRestaurant,
      gradient: 'from-blue-500 to-indigo-600',
      badge: `${stats.tables} Tables`,
    },
    {
      title: 'Add Food Menu',
      description: 'Catalog dishes, set item pricing in INR, and define food categories.',
      href: '/admin-dashboard/add-menus',
      icon: PiForkKnifeBold,
      gradient: 'from-purple-500 to-pink-600',
      badge: `${stats.menus} Dishes`,
    },
    {
      title: 'Add Users',
      description: 'Register staff credentials, assign user roles (Admin / Staff), and select branch.',
      href: '/admin-dashboard/add-users',
      icon: RiUserLine,
      gradient: 'from-emerald-500 to-teal-600',
      badge: 'Staff Accounts',
    },
    {
      title: 'POS Staff View',
      description: 'Switch to live floor view for taking orders, managing bills, and kitchen orders.',
      href: '/user-dashboard',
      icon: RiRestaurantLine,
      gradient: 'from-rose-600 to-red-700',
      badge: 'Live POS',
    },
  ]

  const kpiCards = [
    {
      label: 'Active Branches',
      value: stats.branches,
      icon: RiBuildingLine,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Dining Areas',
      value: stats.areas,
      icon: PiMapPinSimpleAreaFill,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Dining Tables',
      value: stats.tables,
      icon: MdTableRestaurant,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Menu Items',
      value: stats.menus,
      icon: PiForkKnifeBold,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 p-8 lg:p-10 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-red-300 backdrop-blur-md border border-white/10">
              <RiShieldUserLine size={16} />
              <span>Super-Admin Portal</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
              Control Center & System Dashboard
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Seamlessly manage your hotel branch hierarchy, configure custom dining layouts, assign floor tables, catalog menu items, and onboard staff accounts across all locations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link
              href="/admin-dashboard/add-branch"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-900/40 hover:bg-red-500 transition duration-200"
            >
              <FaCodeBranch size={15} />
              <span>Add New Branch</span>
            </Link>
            <Link
              href="/user-dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md border border-white/20 hover:bg-white/20 transition duration-200"
            >
              <RiRestaurantLine size={16} />
              <span>Live POS View</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:shadow-md hover:border-slate-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className={`p-2.5 rounded-xl ${kpi.bgColor} ${kpi.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {stats.loading ? '...' : kpi.value}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">Total</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              System Management Modules
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Quick access to operational tools and setup forms
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.title}
                href={action.href}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-red-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`inline-flex p-3 rounded-2xl text-white bg-gradient-to-tr ${action.gradient} shadow-md`}>
                      <Icon size={22} />
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600 group-hover:bg-red-50 group-hover:text-red-700 transition">
                      {action.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition">
                    {action.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    {action.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1 text-xs font-bold text-red-600 group-hover:gap-2 transition-all">
                  <span>Open Configuration</span>
                  <RiArrowRightLine size={16} />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}