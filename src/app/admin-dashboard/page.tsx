import React from 'react'
import Link from 'next/link'
import { FaCodeBranch } from 'react-icons/fa'
import { PiMapPinSimpleAreaFill } from 'react-icons/pi'
import { RiUserLine, RiRestaurantLine, RiShieldUserLine, RiBuildingLine } from 'react-icons/ri'

function Page() {
  const quickActions = [
    {
      title: 'Add Branch',
      description: 'Create and configure new hotel or restaurant branches.',
      href: '/admin-dashboard/add-branch',
      icon: FaCodeBranch,
      color: 'bg-red-500',
    },
    {
      title: 'Add Areas',
      description: 'Define dining areas, floor sections, and table groupings.',
      href: '/admin-dashboard/add-areas',
      icon: PiMapPinSimpleAreaFill,
      color: 'bg-amber-500',
    },
    {
      title: 'Add Users',
      description: 'Register admins, branch managers, and staff accounts.',
      href: '/admin-dashboard/add-users',
      icon: RiUserLine,
      color: 'bg-blue-500',
    },
    {
      title: 'POS Staff View',
      description: 'Switch to live floor operations, tables, and order entry.',
      href: '/user-dashboard',
      icon: RiRestaurantLine,
      color: 'bg-emerald-500',
    },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#9b1c1c] via-[#c81e1e] to-[#e02424] p-8 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <RiShieldUserLine className="text-red-200" size={28} />
          <span className="text-xs font-semibold uppercase tracking-widest text-red-200">Super-Admin Portal</span>
        </div>
        <h1 className="font-playfair text-3xl font-bold">Welcome to Admin Control Center</h1>
        <p className="mt-2 max-w-2xl text-sm text-red-100">
          Manage system configurations, onboard hotel branches, set up dining areas, and manage user permissions across all locations.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 font-playfair">Quick Management Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.title}
                href={action.href}
                className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-100 transition duration-200 hover:-translate-y-1 hover:shadow-md hover:border-red-200 flex flex-col justify-between"
              >
                <div>
                  <div className={`inline-flex p-3 rounded-lg text-white mb-4 ${action.color}`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#9b1c1c] transition">
                    {action.title}
                  </h3>
                  <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                    {action.description}
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center text-xs font-semibold text-[#9b1c1c] group-hover:underline">
                  Launch Action &rarr;
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Page