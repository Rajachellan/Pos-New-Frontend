"use client"

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import api from '../services/api'
import { getSocket } from '../services/socket'
import { AxiosError } from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  FiRefreshCw,
  FiGrid,
  FiCheckCircle,
  FiClock,
  FiArrowRight,
  FiShoppingBag,
  FiTrendingUp,
  FiUsers,
  FiLayers,
  FiPlus,
  FiActivity,
  FiAlertCircle
} from 'react-icons/fi'
import {
  PiTableBold,
  PiMapPinSimpleAreaFill,
  PiChairBold
} from 'react-icons/pi'
import {
  RiRestaurantLine,
  RiDashboardLine,
  RiTableLine,
  RiFireLine,
  RiShieldUserLine,
  RiStore2Line
} from 'react-icons/ri'
import { MdMeetingRoom, MdOutlineRestaurantMenu } from 'react-icons/md'
import { FaUtensils, FaReceipt, FaCircleCheck } from 'react-icons/fa6'

interface TableData {
  _id: string
  tableNumber: string
  areaName?: {
    _id?: string
    areaName?: string
  }
  availabilityStatus: 'AVAILABLE' | 'OCCUPIED'
}

interface AreaData {
  _id: string
  areaName: string
  areaCode?: string
}

interface KitchenOrderItem {
  name: string
  quantity: number
}

interface KitchenOrder {
  _id: string
  tableNumber?: string
  areaName?: string
  items?: KitchenOrderItem[]
  orderStatus: 'PENDING' | 'PREPARING' | 'SERVED'
  createdAt?: string
}

interface UserData {
  _id: string
  name: string
  email: string
  role: string
}

interface BranchData {
  _id: string
  branchName: string
  branchCode: string
  address?: string
}

export default function UserDashboardPage() {
  const { user: authUser, isAdmin, isManager, isStaff, isSuperAdmin } = useAuth()
  const [tables, setTables] = useState<TableData[]>([])
  const [areas, setAreas] = useState<AreaData[]>([])
  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>([])
  const [user, setUser] = useState<UserData | null>(null)
  const [branch, setBranch] = useState<BranchData | null>(null)
  
  const [loading, setLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [selectedArea, setSelectedArea] = useState<string>('ALL')
  const [currentTime, setCurrentTime] = useState<string>('')

  // Compute time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }, [])

  // Format live current time
  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      )
    }
    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch all dashboard metrics
  const fetchDashboardData = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true)
    else setLoading(true)

    const savedBranchId = typeof window !== 'undefined' ? localStorage.getItem('pos_selected_branch') : null
    const branchQuery = savedBranchId && savedBranchId !== 'ALL' ? `?branchId=${savedBranchId}` : ''

    try {
      const [tablesRes, areasRes, kitchenRes, userRes, branchRes] = await Promise.allSettled([
        api.get(`/get/tables/branch${branchQuery}`),
        api.get(`/get/area/branch${branchQuery}`),
        api.get(`/kitchen/orders${branchQuery}`),
        api.get('/user/get'),
        api.get('/get/branch/role')
      ])

      if (tablesRes.status === 'fulfilled' && Array.isArray(tablesRes.value?.data?.data)) {
        setTables(tablesRes.value.data.data)
      }

      if (areasRes.status === 'fulfilled' && Array.isArray(areasRes.value?.data?.data)) {
        setAreas(areasRes.value.data.data)
      }

      if (kitchenRes.status === 'fulfilled' && Array.isArray(kitchenRes.value?.data?.data)) {
        setKitchenOrders(kitchenRes.value.data.data)
      }

      if (userRes.status === 'fulfilled' && userRes.value?.data?.data) {
        setUser(userRes.value.data.data)
      }

      if (branchRes.status === 'fulfilled' && Array.isArray(branchRes.value?.data?.data)) {
        const branchList = branchRes.value.data.data
        const chosen = savedBranchId
          ? branchList.find((b: any) => b._id === savedBranchId) || branchList[0]
          : branchList[0]
        setBranch(chosen || null)
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    const socket = getSocket()
    const handleTableUpdated = (data: { tableId: string; availabilityStatus: 'AVAILABLE' | 'OCCUPIED' }) => {
      if (!data?.tableId) return
      setTables((prev) =>
        prev.map((t) => (t._id === data.tableId ? { ...t, availabilityStatus: data.availabilityStatus } : t))
      )
    }

    const handleKotReceived = () => {
      fetchDashboardData(true)
    }

    const handleOrderUpdated = () => {
      fetchDashboardData(true)
    }

    const handleBranchChange = () => {
      fetchDashboardData(true)
    }

    socket.on('table_updated', handleTableUpdated)
    socket.on('kot_received', handleKotReceived)
    socket.on('order_updated', handleOrderUpdated)
    window.addEventListener('pos_branch_changed', handleBranchChange)

    return () => {
      socket.off('table_updated', handleTableUpdated)
      socket.off('kot_received', handleKotReceived)
      socket.off('order_updated', handleOrderUpdated)
      window.removeEventListener('pos_branch_changed', handleBranchChange)
    }
  }, [])

  const handleReleaseTable = async (tableId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await api.post(`/tables/${tableId}/release`)
      setTables((prev) =>
        prev.map((t) => (t._id === tableId ? { ...t, availabilityStatus: 'AVAILABLE' } : t))
      )
    } catch (err) {
      console.error('Failed to release table:', err)
    }
  }

  // Stat calculations
  const totalTablesCount = tables.length
  const availableTablesCount = tables.filter((t) => t.availabilityStatus === 'AVAILABLE').length
  const occupiedTablesCount = tables.filter((t) => t.availabilityStatus === 'OCCUPIED').length
  const occupancyRate = totalTablesCount > 0 ? Math.round((occupiedTablesCount / totalTablesCount) * 100) : 0
  const activeKitchenCount = kitchenOrders.filter((o) => o.orderStatus !== 'SERVED').length

  // Filtered tables for snapshot
  const filteredTables = useMemo(() => {
    if (selectedArea === 'ALL') return tables
    return tables.filter((t) => t.areaName?._id === selectedArea || t.areaName?.areaName === selectedArea)
  }, [tables, selectedArea])

  const quickNavCards = [
    {
      title: 'Areas & Floor Tables',
      subtitle: 'Seating map & live status',
      description: 'View dining areas, check seating availability, and manage table allocation.',
      href: '/user-dashboard/tables',
      icon: PiMapPinSimpleAreaFill,
      badgeText: `${availableTablesCount} Free Tables`,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      gradient: 'from-amber-500 to-red-600',
      shadowColor: 'hover:shadow-red-500/20'
    },
    {
      title: 'Kitchen Display (KDS)',
      subtitle: 'Real-time order board',
      description: 'Track live kitchen tickets, preparation progress, and expediters queue.',
      href: '/user-dashboard/kitchen',
      icon: RiRestaurantLine,
      badgeText: `${activeKitchenCount} Active Orders`,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      gradient: 'from-red-600 to-rose-700',
      shadowColor: 'hover:shadow-rose-500/20'
    },
    {
      title: 'Menu & POS Ordering',
      subtitle: 'Take table orders',
      description: 'Browse menu categories, customize food items, and dispatch kitchen orders.',
      href: '/user-dashboard/menus',
      icon: MdOutlineRestaurantMenu,
      badgeText: 'Order Entry',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      gradient: 'from-rose-600 to-orange-600',
      shadowColor: 'hover:shadow-orange-500/20'
    },
    isAdmin()
      ? {
          title: 'Admin Control Center',
          subtitle: 'Branch & User setup',
          description: 'Configure branches, define floor areas, user accounts, and roles.',
          href: '/admin-dashboard',
          icon: RiShieldUserLine,
          badgeText: 'Admin Only',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
          gradient: 'from-gray-800 to-gray-950',
          shadowColor: 'hover:shadow-gray-700/20'
        }
      : {
          title: 'Menu Management',
          subtitle: 'Dishes & Categories',
          description: 'Manage menu items, prices, active dishes, and item categories.',
          href: '/user-dashboard/menu-management',
          icon: MdOutlineRestaurantMenu,
          badgeText: 'Operations',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
          gradient: 'from-amber-600 to-rose-600',
          shadowColor: 'hover:shadow-amber-500/20'
        }
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-gray-50/60 min-h-[calc(100vh-73px)]">
      {/* Top Welcome Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#8b1515] via-[#b91c1c] to-[#dc2626] p-6 sm:p-8 text-white shadow-xl shadow-red-900/10"
      >
        {/* Abstract Background Decorative Circles */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-black/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-medium text-white shadow-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                POS Operational Mode
              </span>
              {branch?.branchName && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/30 backdrop-blur-md text-xs font-semibold text-red-100">
                  <RiStore2Line size={13} />
                  {branch.branchName}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-playfair drop-shadow-xs">
              {greeting}, {authUser?.name ?? user?.name ?? 'Team'}!
            </h1>
            <p className="text-sm text-red-100/90 max-w-xl leading-relaxed">
              Welcome to your live operational portal. Monitor active floor tables, real-time kitchen orders, and floor seating availability at a glance.
            </p>
          </div>

          {/* Quick Action CTA & Clock */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="bg-black/30 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-right">
              <p className="text-[10px] uppercase font-bold tracking-widest text-red-200/80">Live Time</p>
              <p className="text-base font-mono font-bold text-white tracking-wider">
                {currentTime || '12:00:00 PM'}
              </p>
            </div>

            <button
              onClick={() => fetchDashboardData(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#9b1c1c] font-semibold text-sm shadow-md hover:bg-red-50 hover:shadow-lg transition duration-200 disabled:opacity-70 cursor-pointer active:scale-95"
            >
              <FiRefreshCw className={`text-lg ${isRefreshing ? 'animate-spin text-red-600' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Live Data'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Tables */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs border border-gray-100 hover:shadow-md hover:border-red-200 transition duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Tables</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
                {loading ? (
                  <span className="inline-block w-12 h-7 bg-gray-200 animate-pulse rounded" />
                ) : (
                  totalTablesCount
                )}
              </h3>
            </div>
            <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition duration-300">
              <PiTableBold size={26} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
            <span>Configured Capacity</span>
            <span className="font-semibold text-indigo-600">{areas.length} Floor Areas</span>
          </div>
        </motion.div>

        {/* Card 2: Available Tables */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs border border-gray-100 hover:shadow-md hover:border-emerald-200 transition duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available Tables</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                {loading ? (
                  <span className="inline-block w-12 h-7 bg-gray-200 animate-pulse rounded" />
                ) : (
                  availableTablesCount
                )}
              </h3>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition duration-300">
              <FaCircleCheck size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">Ready for Seating</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              {totalTablesCount > 0 ? `${Math.round((availableTablesCount / totalTablesCount) * 100)}% Free` : '0%'}
            </span>
          </div>
        </motion.div>

        {/* Card 3: Occupied Tables */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs border border-gray-100 hover:shadow-md hover:border-amber-200 transition duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Occupied Tables</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
                {loading ? (
                  <span className="inline-block w-12 h-7 bg-gray-200 animate-pulse rounded" />
                ) : (
                  occupiedTablesCount
                )}
              </h3>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 group-hover:scale-110 transition duration-300">
              <PiChairBold size={26} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 space-y-1">
            <div className="flex justify-between text-xs font-semibold text-gray-600">
              <span>Occupancy Rate</span>
              <span>{occupancyRate}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-red-500 transition-all duration-500"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Card 4: Active Kitchen Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs border border-gray-100 hover:shadow-md hover:border-rose-200 transition duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kitchen Queue</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">
                {loading ? (
                  <span className="inline-block w-12 h-7 bg-gray-200 animate-pulse rounded" />
                ) : (
                  activeKitchenCount
                )}
              </h3>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-600 group-hover:scale-110 transition duration-300">
              <RiFireLine size={26} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
            <span>Live KDS Tickets</span>
            <span className="font-semibold text-rose-600">Cooking & Pending</span>
          </div>
        </motion.div>
      </div>

      {/* Quick POS Workflow Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 font-playfair tracking-tight">
            Quick Operational Workflows
          </h2>
          <span className="text-xs text-gray-400 font-medium">Select a station to launch</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {quickNavCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * idx }}
              >
                <Link
                  href={card.href}
                  className={`group relative flex flex-col justify-between h-full rounded-2xl bg-white p-6 shadow-xs border border-gray-100 transition duration-200 hover:-translate-y-1 hover:shadow-xl ${card.shadowColor}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-tr ${card.gradient} text-white shadow-sm`}>
                        <Icon size={24} />
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${card.badgeColor}`}>
                        {card.badgeText}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 group-hover:text-[#9b1c1c] transition">
                      {card.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">{card.subtitle}</p>

                    <p className="mt-2.5 text-xs text-gray-500 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#9b1c1c] group-hover:translate-x-1 transition duration-200">
                    <span>Open Module</span>
                    <FiArrowRight size={15} />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Live Floor & Table Seating Snapshot */}
      <div className="rounded-2xl bg-white p-6 shadow-xs border border-gray-100 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <PiMapPinSimpleAreaFill className="text-[#9b1c1c]" size={20} />
              <h2 className="text-lg font-bold text-gray-900 font-playfair tracking-tight">
                Live Floor & Seating Snapshot
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Interactive overview of dining tables across floor sections.
            </p>
          </div>

          {/* Area Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedArea('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                selectedArea === 'ALL'
                  ? 'bg-[#9b1c1c] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Areas ({tables.length})
            </button>
            {areas.map((area) => (
              <button
                key={area._id}
                onClick={() => setSelectedArea(area._id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                  selectedArea === area._id
                    ? 'bg-[#9b1c1c] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {area.areaName}
              </button>
            ))}
          </div>
        </div>

        {/* Tables Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="py-12 text-center rounded-xl bg-gray-50 border border-dashed border-gray-200">
            <FiAlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-sm font-semibold text-gray-600">No tables found in this section</p>
            <p className="text-xs text-gray-400 mt-1">
              Add tables from the Admin Control Center or select a different floor area.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredTables.map((t) => {
              const isAvailable = t.availabilityStatus === 'AVAILABLE'
              return (
                <div
                  key={t._id}
                  className={`group relative flex flex-col justify-between rounded-xl p-4 border transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    isAvailable
                      ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400'
                      : 'bg-rose-50/40 border-rose-200 hover:border-rose-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                        {t.areaName?.areaName ?? 'Main Floor'}
                      </span>
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isAvailable ? 'bg-emerald-500 shadow-xs shadow-emerald-400' : 'bg-rose-500 shadow-xs shadow-rose-400 animate-pulse'
                        }`}
                      />
                    </div>

                    <h4 className="text-base font-black text-gray-900">
                      Table {t.tableNumber}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-200/60 flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        isAvailable
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isAvailable ? 'Available' : 'Occupied'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {!isAvailable && (
                        <button
                          type="button"
                          onClick={(e) => handleReleaseTable(t._id, e)}
                          title="Free Table / Release"
                          className="px-2 py-0.5 rounded bg-white hover:bg-rose-50 text-gray-700 hover:text-rose-700 border border-gray-200 text-[10px] font-bold transition shadow-2xs"
                        >
                          Free
                        </button>
                      )}
                      <Link
                        href={`/user-dashboard/menus?tableId=${t._id}`}
                        className="text-[11px] font-bold text-[#9b1c1c] hover:underline"
                      >
                        {isAvailable ? 'Order \u2192' : 'Bill \u2192'}
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Kitchen Display System Feed & Operational Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Kitchen Ticket Preview (2 Columns) */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-xs border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RiFireLine className="text-rose-600" size={22} />
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-playfair tracking-tight">
                  Kitchen Orders Queue (KDS Feed)
                </h3>
                <p className="text-xs text-gray-500">Live order tickets pending kitchen prep</p>
              </div>
            </div>

            <Link
              href="/user-dashboard/kitchen"
              className="text-xs font-bold text-[#9b1c1c] hover:underline inline-flex items-center gap-1"
            >
              Full KDS Screen <FiArrowRight size={13} />
            </Link>
          </div>

          {kitchenOrders.length === 0 ? (
            <div className="py-10 text-center rounded-xl bg-gray-50 border border-dashed border-gray-200">
              <FaUtensils className="mx-auto text-gray-300 mb-2" size={28} />
              <p className="text-sm font-semibold text-gray-600">No active kitchen orders</p>
              <p className="text-xs text-gray-400 mt-1">Orders sent from table menus will automatically appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {kitchenOrders.slice(0, 4).map((order) => (
                <div
                  key={order._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-gray-100/60 transition gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-rose-100 text-rose-700 font-extrabold text-sm shrink-0">
                      T-{order.tableNumber ?? 'N/A'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">
                          Table {order.tableNumber ?? 'Unassigned'}
                        </span>
                        {order.areaName && (
                          <span className="text-[10px] text-gray-400 font-medium uppercase">
                            • {order.areaName}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {order.items && order.items.length > 0
                          ? order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')
                          : 'Custom Order Items'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        order.orderStatus === 'PREPARING'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System & Staff Overview Card (1 Column) */}
        <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-black p-6 text-white shadow-xl space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-gray-800">
              <RiShieldUserLine className="text-red-400" size={22} />
              <div>
                <h3 className="text-base font-bold font-playfair text-white">System Status</h3>
                <p className="text-xs text-gray-400">Live operational details</p>
              </div>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-gray-800/60">
                <span className="text-gray-400">Current User:</span>
                <span className="font-semibold text-white">{authUser?.name ?? user?.name ?? 'Staff User'}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-800/60">
                <span className="text-gray-400">System Role:</span>
                <span className="font-semibold uppercase tracking-wider text-red-400">
                  {isSuperAdmin()
                    ? 'Super Admin'
                    : isAdmin()
                    ? 'Admin'
                    : isManager()
                    ? 'Manager'
                    : 'Staff'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-800/60">
                <span className="text-gray-400">Active Branch:</span>
                <span className="font-semibold text-white">{branch?.branchName ?? 'Main Branch'}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400">Backend API:</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Connected
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800 flex flex-col gap-2">
            <Link
              href="/user-dashboard/tables"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#9b1c1c] to-[#dc2626] font-bold text-xs text-white shadow-lg hover:from-[#8b1515] hover:to-[#b91c1c] transition cursor-pointer"
            >
              <span>Manage Floor Seating</span>
              <FiArrowRight size={14} />
            </Link>
            {isAdmin() && (
              <Link
                href="/admin-dashboard"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                <span>Switch to Admin Console</span>
                <RiShieldUserLine size={14} className="text-red-400" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}