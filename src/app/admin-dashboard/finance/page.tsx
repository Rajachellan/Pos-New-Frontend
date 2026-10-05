"use client"

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RiLineChartLine,
  RiMoneyDollarCircleLine,
  RiExchangeDollarLine,
  RiFundsLine,
  RiArrowRightLine,
  RiRestaurantLine,
  RiShoppingBag3Line,
  RiDownload2Line,
  RiRefreshLine,
  RiFilter3Line,
  RiCloseLine,
  RiPrinterLine,
  RiPieChartLine,
  RiCheckDoubleLine,
  RiShieldCheckLine,
} from 'react-icons/ri'
import {
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiDollarSign,
  FiCreditCard,
  FiSmartphone,
  FiSearch,
  FiEye,
  FiLayers,
  FiAlertCircle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from 'react-icons/fi'
import { FaRupeeSign, FaReceipt, FaMotorcycle, FaUtensils } from 'react-icons/fa'
import { PiForkKnifeBold, PiMapPinSimpleAreaFill } from 'react-icons/pi'
import { MdTableRestaurant } from 'react-icons/md'
import api from '../../services/api'
import { useAuth } from '@/src/app/context/AuthContext'

interface OrderItem {
  _id?: string
  name: string
  price: number
  quantity: number
}

interface TableInfo {
  _id?: string
  tableNumber?: string | number
  areaId?: string
}

interface OrderRecord {
  _id: string
  orderNumber?: string
  tableId?: TableInfo
  items: OrderItem[]
  subtotal?: number
  gstAmount?: number
  totalAmount: number
  paymentMethod?: string
  orderType?: 'DINE-IN' | 'TAKEAWAY' | 'DELIVERY' | string
  roomNumber?: string
  status: 'PENDING' | 'ORDERED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  updatedAt?: string
  branchId?: any
}

interface BranchItem {
  _id: string
  branchName: string
  branchCode: string
}

export default function FinanceAnalyticsPage() {
  const { user, organizationName, isAdmin, canViewFinances } = useAuth()

  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [branches, setBranches] = useState<BranchItem[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL')
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL'>('MONTH')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [selectedOrderReceipt, setSelectedOrderReceipt] = useState<OrderRecord | null>(null)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  // Reset to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, dateFilter, selectedBranch, pageSize])

  // 1. Fetch Branches
  const fetchBranches = async () => {
    try {
      const res = await api.get('/get/branch')
      if (res.data?.data) {
        setBranches(res.data.data)
      }
    } catch (err) {
      console.error('Failed to load branches:', err)
    }
  }

  // 2. Fetch Orders for Analytics
  const fetchFinancialData = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    else setLoading(true)

    try {
      const branchQuery = selectedBranch && selectedBranch !== 'ALL' ? `?branchId=${selectedBranch}` : ''
      const res = await api.get(`/orders/history${branchQuery}`)
      if (res.data?.success && Array.isArray(res.data.data)) {
        setOrders(res.data.data)
      }
      setLastRefreshedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch (err) {
      console.error('Failed to load financial records:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchBranches()
  }, [])

  useEffect(() => {
    fetchFinancialData()
  }, [selectedBranch])

  // Filter orders by date range
  const dateFilteredOrders = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const startOfYesterday = startOfToday - 86400000
    const startOfWeek = now.getTime() - 7 * 86400000
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

    return orders.filter((order) => {
      const orderTime = new Date(order.createdAt).getTime()
      if (dateFilter === 'TODAY') return orderTime >= startOfToday
      if (dateFilter === 'YESTERDAY') return orderTime >= startOfYesterday && orderTime < startOfToday
      if (dateFilter === 'WEEK') return orderTime >= startOfWeek
      if (dateFilter === 'MONTH') return orderTime >= startOfMonth
      return true
    })
  }, [orders, dateFilter])

  // Financial Metrics Computation
  const metrics = useMemo(() => {
    const completed = dateFilteredOrders.filter((o) => o.status === 'COMPLETED')
    const active = dateFilteredOrders.filter((o) => ['PENDING', 'ORDERED', 'PREPARING', 'READY'].includes(o.status))
    const cancelled = dateFilteredOrders.filter((o) => o.status === 'CANCELLED')

    const grossRevenue = completed.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
    const totalGst = completed.reduce((sum, o) => sum + (Number(o.gstAmount) || 0), 0)
    const netRevenue = completed.reduce((sum, o) => sum + (Number(o.subtotal) || (Number(o.totalAmount) - (Number(o.gstAmount) || 0)) || 0), 0)
    const aov = completed.length > 0 ? Math.round(grossRevenue / completed.length) : 0

    // Channel breakdown
    let dineInSales = 0
    let dineInOrders = 0
    let takeawaySales = 0
    let takeawayOrders = 0
    let deliverySales = 0
    let deliveryOrders = 0

    completed.forEach((o) => {
      const type = (o.orderType || 'DINE-IN').toUpperCase()
      const amt = Number(o.totalAmount) || 0
      if (type.includes('TAKEAWAY')) {
        takeawaySales += amt
        takeawayOrders++
      } else if (type.includes('DELIVERY')) {
        deliverySales += amt
        deliveryOrders++
      } else {
        dineInSales += amt
        dineInOrders++
      }
    })

    // Payment method breakdown
    let cashSales = 0
    let cardSales = 0
    let upiSales = 0

    completed.forEach((o) => {
      const pm = (o.paymentMethod || 'CASH').toUpperCase()
      const amt = Number(o.totalAmount) || 0
      if (pm.includes('CARD')) cardSales += amt
      else if (pm.includes('UPI') || pm.includes('ONLINE') || pm.includes('SCAN') || pm.includes('QR')) upiSales += amt
      else cashSales += amt
    })

    // Top selling items
    const itemMap: { [key: string]: { name: string; quantity: number; revenue: number } } = {}
    completed.forEach((o) => {
      o.items?.forEach((it) => {
        const key = it.name || 'Unnamed'
        if (!itemMap[key]) {
          itemMap[key] = { name: key, quantity: 0, revenue: 0 }
        }
        itemMap[key].quantity += it.quantity || 1
        itemMap[key].revenue += (it.price || 0) * (it.quantity || 1)
      })
    })

    const topItems = Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Daily Sales Timeline (Last 7 days or matching range)
    const dayMap: { [key: string]: number } = {}
    completed.forEach((o) => {
      const d = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      dayMap[d] = (dayMap[d] || 0) + (Number(o.totalAmount) || 0)
    })

    const dailyTrend = Object.entries(dayMap).map(([day, amount]) => ({
      day,
      amount,
    }))

    return {
      grossRevenue,
      netRevenue,
      totalGst,
      aov,
      completedCount: completed.length,
      activeCount: active.length,
      cancelledCount: cancelled.length,
      dineInSales,
      dineInOrders,
      takeawaySales,
      takeawayOrders,
      deliverySales,
      deliveryOrders,
      cashSales,
      cardSales,
      upiSales,
      topItems,
      dailyTrend,
    }
  }, [dateFilteredOrders])

  // Filtered orders table
  const finalFilteredOrders = useMemo(() => {
    return dateFilteredOrders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const orderIdMatch = (o.orderNumber || o._id).toLowerCase().includes(q)
        const tableMatch = o.tableId?.tableNumber ? String(o.tableId.tableNumber).toLowerCase().includes(q) : false
        const paymentMatch = o.paymentMethod?.toLowerCase().includes(q)
        return orderIdMatch || tableMatch || paymentMatch
      }
      return true
    })
  }, [dateFilteredOrders, statusFilter, searchQuery])

  // Pagination computations
  const totalItems = finalFilteredOrders.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages)
  const startIndex = (validCurrentPage - 1) * pageSize

  const paginatedOrders = useMemo(() => {
    return finalFilteredOrders.slice(startIndex, startIndex + pageSize)
  }, [finalFilteredOrders, startIndex, pageSize])

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages: (number | string)[] = []
    if (validCurrentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages)
    } else if (validCurrentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', totalPages)
    }
    return pages
  }, [totalPages, validCurrentPage])

  // CSV Export handler with RFC-4180 escaping and Blob URL
  const handleExportCSV = () => {
    const exportData = finalFilteredOrders.length > 0 ? finalFilteredOrders : (dateFilteredOrders.length > 0 ? dateFilteredOrders : orders)

    if (exportData.length === 0) {
      alert('No financial transaction records found to export for the selected filters.')
      return
    }

    const headers = [
      'Order Number',
      'Date & Time',
      'Order Type',
      'Table / Room',
      'Payment Method',
      'Items Count',
      'Itemized Dishes',
      'Subtotal (INR)',
      'GST Tax (INR)',
      'Total Amount (INR)',
      'Order Status',
      'Payment Status',
    ]

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    const rows = exportData.map((o) => {
      const orderNum = o.orderNumber ? o.orderNumber : `#${o._id.slice(-6).toUpperCase()}`
      let formattedDate = ''
      try {
        const d = new Date(o.createdAt)
        formattedDate = isNaN(d.getTime()) ? o.createdAt : d.toISOString().replace('T', ' ').slice(0, 19)
      } catch (e) {
        formattedDate = o.createdAt
      }

      const tableRoom = o.tableId?.tableNumber
        ? `Table ${o.tableId.tableNumber}`
        : o.roomNumber
        ? `Room ${o.roomNumber}`
        : 'Direct / Walk-in'

      const itemsCount = o.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 0
      const itemsList = o.items?.map((it) => `${it.quantity || 1}x ${it.name}`).join('; ') || 'N/A'
      const subtotalVal = o.subtotal || (Number(o.totalAmount || 0) - Number(o.gstAmount || 0))
      const gstVal = Number(o.gstAmount || 0)
      const totalVal = Number(o.totalAmount || 0)
      const isPaid = o.status === 'COMPLETED' ? 'PAID' : 'PENDING'

      return [
        orderNum,
        formattedDate,
        o.orderType || 'DINE-IN',
        tableRoom,
        o.paymentMethod || 'CASH',
        itemsCount,
        itemsList,
        subtotalVal.toFixed(2),
        gstVal.toFixed(2),
        totalVal.toFixed(2),
        o.status,
        isPaid,
      ]
    })

    // UTF-8 BOM (\uFEFF) ensures Excel correctly recognizes UTF-8 formatting and special characters
    const csvContent =
      '\uFEFF' +
      [
        headers.map(escapeCsv).join(','),
        ...rows.map((row) => row.map(escapeCsv).join(',')),
      ].join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `financial_report_${dateFilter.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Security Guard for unauthorized staff
  if (!canViewFinances() && !isAdmin()) {
    return (
      <div className="p-8 max-w-4xl mx-auto my-12 text-center bg-white rounded-3xl border border-red-200 shadow-xl space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <FiAlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Restricted Financial Portal</h2>
        <p className="text-slate-500 max-w-md mx-auto text-sm">
          Access to hotel financial data, sales ledgers, and revenue analytics is strictly reserved for Organization Administrators and Owners.
        </p>
        <Link
          href="/admin-dashboard"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-red-500 transition"
        >
          Return to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-8 max-w-7xl mx-auto antialiased">
      {/* Top Banner / Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 p-6 sm:p-8 lg:p-10 text-white shadow-2xl border border-slate-800">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -ml-20 -mb-20 h-56 w-56 rounded-full bg-rose-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-300 border border-red-500/30 backdrop-blur-md">
                <RiLineChartLine size={15} />
                <span>Financial Intelligence & Auditing</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
                <RiShieldCheckLine size={14} />
                <span>Admin Confidential</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {organizationName || 'Hotel'} Revenue & Sales Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Real-time financial telemetry, gross billing summaries, tax collections, payment channel distribution, and historical transaction auditing across hotel branches.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => fetchFinancialData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 transition active:scale-95 disabled:opacity-50"
              title="Refresh Analytics"
            >
              <RiRefreshLine className={`text-base ${refreshing ? 'animate-spin text-red-400' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Live Sync'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-950/40 transition active:scale-95"
              title="Export Ledger to CSV"
            >
              <RiDownload2Line size={16} />
              <span>Export CSV</span>
            </button>

            <Link
              href="/user-dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-900/40 transition active:scale-95"
            >
              <RiRestaurantLine size={15} />
              <span>POS Terminal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Control Bar: Outlet Picker & Time Range Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        {/* Branch / Outlet Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FiLayers size={14} className="text-red-600" />
            <span>Outlet:</span>
          </span>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-slate-100/80 hover:bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition cursor-pointer"
          >
            <option value="ALL">All Outlets (Consolidated)</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.branchName} ({b.branchCode})
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline-flex items-center gap-1">
            <FiCalendar size={13} />
            <span>Range:</span>
          </span>
          {[
            { id: 'TODAY', label: 'Today' },
            { id: 'YESTERDAY', label: 'Yesterday' },
            { id: 'WEEK', label: 'Last 7 Days' },
            { id: 'MONTH', label: 'This Month' },
            { id: 'ALL', label: 'All Time' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight transition shrink-0 cursor-pointer ${
                dateFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Gross Sales */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-red-200 transition duration-200 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Gross Sales</span>
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 group-hover:scale-110 transition duration-300">
              <FaRupeeSign size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {loading ? (
                <span className="inline-block w-28 h-8 bg-slate-100 animate-pulse rounded" />
              ) : (
                `₹${metrics.grossRevenue.toLocaleString('en-IN')}`
              )}
            </h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <FiTrendingUp />
              <span>{metrics.completedCount} Settled Transactions</span>
            </p>
          </div>
        </motion.div>

        {/* Card 2: Net Revenue (Excl Tax) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-200 transition duration-200 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Sales (Pre-Tax)</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition duration-300">
              <RiFundsLine size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {loading ? (
                <span className="inline-block w-28 h-8 bg-slate-100 animate-pulse rounded" />
              ) : (
                `₹${Math.round(metrics.netRevenue).toLocaleString('en-IN')}`
              )}
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">
              Core culinary & beverage earnings
            </p>
          </div>
        </motion.div>

        {/* Card 3: Tax Collected */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-200 transition duration-200 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">GST / Tax Collected</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition duration-300">
              <FaReceipt size={17} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {loading ? (
                <span className="inline-block w-28 h-8 bg-slate-100 animate-pulse rounded" />
              ) : (
                `₹${Math.round(metrics.totalGst).toLocaleString('en-IN')}`
              )}
            </h3>
            <p className="text-[11px] font-semibold text-amber-700 mt-1">
              Tax liabilities for accounting
            </p>
          </div>
        </motion.div>

        {/* Card 4: Average Order Value */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-200 transition duration-200 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Order (AOV)</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition duration-300">
              <RiExchangeDollarLine size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {loading ? (
                <span className="inline-block w-28 h-8 bg-slate-100 animate-pulse rounded" />
              ) : (
                `₹${metrics.aov.toLocaleString('en-IN')}`
              )}
            </h3>
            <p className="text-[11px] font-semibold text-purple-700 mt-1">
              Avg revenue per customer ticket
            </p>
          </div>
        </motion.div>
      </div>

      {/* Analytics Deep-Dive: Channels, Payment Methods, and Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Revenue by Dining Channel */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue by Channel</h3>
              <p className="text-xs text-slate-400">Dine-in vs Takeaway vs Delivery</p>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <RiPieChartLine size={18} />
            </div>
          </div>

          <div className="space-y-4">
            {/* Dine In */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <FaUtensils className="text-rose-500" size={12} />
                  <span>Dine-In Operations</span>
                </span>
                <span className="font-black text-slate-900">₹{metrics.dineInSales.toLocaleString('en-IN')}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-600 to-rose-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.grossRevenue > 0 ? (metrics.dineInSales / metrics.grossRevenue) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{metrics.dineInOrders} orders</p>
            </div>

            {/* Takeaway */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <RiShoppingBag3Line className="text-amber-500" size={13} />
                  <span>Takeaway / Parcel</span>
                </span>
                <span className="font-black text-slate-900">₹{metrics.takeawaySales.toLocaleString('en-IN')}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.grossRevenue > 0 ? (metrics.takeawaySales / metrics.grossRevenue) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{metrics.takeawayOrders} orders</p>
            </div>

            {/* Delivery */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <FaMotorcycle className="text-blue-500" size={13} />
                  <span>Door Delivery</span>
                </span>
                <span className="font-black text-slate-900">₹{metrics.deliverySales.toLocaleString('en-IN')}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.grossRevenue > 0 ? (metrics.deliverySales / metrics.grossRevenue) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{metrics.deliveryOrders} orders</p>
            </div>
          </div>
        </div>

        {/* 2. Payment Method Distribution */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Payment Breakdown</h3>
              <p className="text-xs text-slate-400">Cash vs Card vs UPI</p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <RiMoneyDollarCircleLine size={18} />
            </div>
          </div>

          <div className="space-y-4">
            {/* Cash */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <FiDollarSign className="text-emerald-500" size={13} />
                  <span>Cash Payment</span>
                </span>
                <span className="font-black text-slate-900">₹{metrics.cashSales.toLocaleString('en-IN')}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.grossRevenue > 0 ? (metrics.cashSales / metrics.grossRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* UPI / QR */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <FiSmartphone className="text-indigo-500" size={13} />
                  <span>UPI / QR Code</span>
                </span>
                <span className="font-black text-slate-900">₹{metrics.upiSales.toLocaleString('en-IN')}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.grossRevenue > 0 ? (metrics.upiSales / metrics.grossRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Card */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <FiCreditCard className="text-cyan-500" size={13} />
                  <span>Debit / Credit Card</span>
                </span>
                <span className="font-black text-slate-900">₹{metrics.cardSales.toLocaleString('en-IN')}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.grossRevenue > 0 ? (metrics.cardSales / metrics.grossRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Top Revenue Generating Items */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Top Dishes (Revenue)</h3>
              <p className="text-xs text-slate-400">Best-performing menu items</p>
            </div>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <PiForkKnifeBold size={18} />
            </div>
          </div>

          {metrics.topItems.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No sales data recorded for this time range.
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.topItems.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-none">
                  <div className="flex items-center gap-2.5 truncate max-w-[180px]">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-extrabold flex items-center justify-center text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-800 truncate">{item.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-slate-900">₹{item.revenue.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-slate-400">{item.quantity} sold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Order History & Financial Ledger */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Financial Order Ledger</h2>
            <p className="text-xs text-slate-400">Itemized billing records and transaction logs</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Order # or Table..."
                className="pl-9 pr-3.5 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-red-500 focus:bg-white w-52 transition"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="COMPLETED">Completed (Paid)</option>
              <option value="PREPARING">In Kitchen / Preparing</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[10px] uppercase font-extrabold tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Table / Mode</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4 text-right">Tax (GST)</th>
                <th className="py-3 px-4 text-right">Gross Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={9} className="py-4 px-4 bg-slate-50/50">
                      <div className="h-4 bg-slate-200 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : finalFilteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FiAlertCircle className="mx-auto mb-2 text-slate-300" size={28} />
                    <p className="font-semibold text-slate-600">No transactions match your search filter</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try choosing a different date range or clearing your search.</p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isCompleted = order.status === 'COMPLETED'
                  const isCancelled = order.status === 'CANCELLED'
                  const itemsCount = order.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 0

                  return (
                    <tr key={order._id} className="hover:bg-slate-50/80 transition duration-150">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                          {order.tableId?.tableNumber ? (
                            <>
                              <MdTableRestaurant className="text-slate-400" size={14} />
                              <span>Table {order.tableId.tableNumber}</span>
                            </>
                          ) : (
                            <span className="text-slate-500">{order.orderType || 'Direct'}</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {order.paymentMethod || 'CASH'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-700">
                        {order.items && order.items.length > 0
                          ? order.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')
                          : `${itemsCount} items`}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-500">
                        ₹{(order.gstAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isCancelled
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedOrderReceipt(order)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="View Bill Details"
                        >
                          <FiEye size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="text-slate-500 text-xs font-medium">
              Showing <span className="font-bold text-slate-900">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-slate-900">{Math.min(startIndex + pageSize, totalItems)}</span> of{' '}
              <span className="font-bold text-slate-900">{totalItems}</span> orders
            </div>

            <div className="flex items-center gap-1.5">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title="First Page"
              >
                <FiChevronsLeft size={16} />
              </button>

              {/* Prev Page */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={validCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title="Previous Page"
              >
                <FiChevronLeft size={16} />
              </button>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1">
                {pageNumbers.map((p, idx) =>
                  typeof p === 'number' ? (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-8 h-8 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        validCurrentPage === p
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={idx} className="px-1 text-slate-400 font-bold select-none">
                      ...
                    </span>
                  )
                )}
              </div>

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={validCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title="Next Page"
              >
                <FiChevronRight size={16} />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title="Last Page"
              >
                <FiChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bill Receipt Modal */}
      <AnimatePresence>
        {selectedOrderReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-red-100 text-red-600">
                    <FaReceipt size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Tax Invoice / Receipt
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400">
                      #{selectedOrderReceipt.orderNumber || selectedOrderReceipt._id}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOrderReceipt(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                >
                  <RiCloseLine size={20} />
                </button>
              </div>

              {/* Order Meta */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Outlet / Branch:</span>
                  <p className="font-bold text-slate-800">{organizationName || 'Tanjavoor Restaurant'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Table / Type:</span>
                  <p className="font-bold text-slate-800">
                    {selectedOrderReceipt.tableId?.tableNumber ? `Table ${selectedOrderReceipt.tableId.tableNumber}` : selectedOrderReceipt.orderType || 'Takeaway'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Payment Method:</span>
                  <p className="font-bold text-emerald-600 uppercase">{selectedOrderReceipt.paymentMethod || 'CASH'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Timestamp:</span>
                  <p className="font-medium text-slate-700">
                    {new Date(selectedOrderReceipt.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Itemized list */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Ordered Dishes</p>
                {selectedOrderReceipt.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-slate-100 last:border-none">
                    <span className="text-slate-800">
                      <span className="font-bold text-red-600 mr-2">{it.quantity}x</span>
                      {it.name}
                    </span>
                    <span className="font-bold text-slate-900">
                      ₹{((it.price || 0) * (it.quantity || 1)).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>₹{(selectedOrderReceipt.subtotal || (selectedOrderReceipt.totalAmount - (selectedOrderReceipt.gstAmount || 0))).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GST Taxes:</span>
                  <span>₹{(selectedOrderReceipt.gstAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-red-600">₹{selectedOrderReceipt.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  <RiPrinterLine size={16} />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setSelectedOrderReceipt(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
