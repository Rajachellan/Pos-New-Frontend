"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { AxiosError } from "axios"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  FiClock,
  FiRefreshCw,
  FiCheckCircle,
  FiPackage,
  FiMaximize,
  FiMapPin,
  FiChevronDown,
  FiCheck,
  FiVolume2,
  FiList,
  FiAlertTriangle,
} from "react-icons/fi"
import { RiFireLine, RiRestaurantLine } from "react-icons/ri"
import { FaBullhorn } from "react-icons/fa6"
import api from "../../services/api"
import { getSocket, joinBranchRoom, leaveBranchRoom } from "../../services/socket"
import { playNewOrderChime } from "../../services/sound"

export type KitchenStatus = "NEW" | "PREPARING" | "READY" | "SERVED"

export interface KitchenItem {
  _id?: string
  menuId?: string | { _id: string; name: string }
  name: string
  price: number
  quantity: number
  isManual?: boolean
  kitchenStatus?: KitchenStatus
  notes?: string
}

export interface KitchenOrder {
  _id: string
  orderNumber?: string
  orderType?: string
  tableId: {
    _id: string
    tableNumber: string
    areaName?: {
      _id?: string
      areaName?: string
      branchName?: {
        _id?: string
        branchName?: string
        branchCode?: string
      }
    }
    branch?: string
  } | string
  branchId?: string
  items: KitchenItem[]
  totalAmount: number
  status: string
  kitchenStatus?: KitchenStatus
  notes?: string
  createdAt: string
}

export interface BranchInfo {
  _id: string
  branchName: string
  branchCode?: string
}

type TabStatus = "ALL" | "NEW" | "PREPARING" | "READY"

const statusTabs: Array<{ value: TabStatus; label: string }> = [
  { value: "ALL", label: "All Tickets" },
  { value: "NEW", label: "New Orders" },
  { value: "PREPARING", label: "In Prep" },
  { value: "READY", label: "Ready to Serve" },
]

function getOrderBranchId(order: KitchenOrder): string | null {
  if (order.branchId) return order.branchId.toString()
  if (typeof order.tableId === "object") {
    if (order.tableId?.areaName?.branchName?._id) {
      return order.tableId.areaName.branchName._id.toString()
    }
    if (order.tableId?.branch) {
      return order.tableId.branch.toString()
    }
  }
  return null
}

export default function KitchenPage() {
  const [allOrders, setAllOrders] = useState<KitchenOrder[]>([])
  const [selectedStatus, setSelectedStatus] = useState<TabStatus>("ALL")
  const [branches, setBranches] = useState<BranchInfo[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL")
  const [loading, setLoading] = useState(true)
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState<string>("")
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const [toggledItems, setToggledItems] = useState<Record<string, boolean>>({})

  // Live timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Load branches
  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await api.get("/get/branch/role")
        const list: BranchInfo[] = res.data?.data || []
        setBranches(list)
        const storedBranch = typeof window !== "undefined" ? localStorage.getItem("pos_selected_branch") : null
        if (list.length === 1) {
          setSelectedBranchId(list[0]._id)
          localStorage.setItem("pos_selected_branch", list[0]._id)
        } else if (storedBranch && (storedBranch === "ALL" || list.some(b => b._id === storedBranch))) {
          setSelectedBranchId(storedBranch)
        } else {
          setSelectedBranchId("ALL")
        }
      } catch (err) {
        console.warn("Could not load branches", err)
      }
    }
    loadBranches()

    const handleBranchChange = (e: any) => {
      if (e.detail?._id) {
        setSelectedBranchId(e.detail._id)
      }
    }
    window.addEventListener("pos_branch_changed", handleBranchChange)
    return () => window.removeEventListener("pos_branch_changed", handleBranchChange)
  }, [])

  // Fetch ALL active kitchen orders
  const fetchKitchenOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const bParam = selectedBranchId && selectedBranchId !== "ALL" ? `?branchId=${selectedBranchId}` : ""
      const response = await api.get(`/kitchen/orders${bParam}`)
      const rawOrders: KitchenOrder[] = response.data?.data || []
      
      const normalized = rawOrders.map(o => {
        let kStatus: KitchenStatus = "NEW"
        if (o.kitchenStatus) {
          kStatus = o.kitchenStatus
        } else if (o.status === "PREPARING") {
          kStatus = "PREPARING"
        } else if (o.status === "READY") {
          kStatus = "READY"
        } else {
          kStatus = "NEW"
        }
        return {
          ...o,
          kitchenStatus: kStatus,
          orderNumber: o.orderNumber || `#${o._id.slice(-4).toUpperCase()}`
        }
      })

      // Filter out SERVED / COMPLETED
      setAllOrders(normalized.filter(o => o.kitchenStatus !== "SERVED" && o.status !== "COMPLETED"))
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      if (!silent) console.error(axiosError.response?.data?.message || axiosError.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKitchenOrders()
  }, [fetchKitchenOrders])

  // Real-time Socket.IO Connection & Polling Fallback
  useEffect(() => {
    const socket = getSocket()

    const handleConnect = () => {
      if (selectedBranchId && selectedBranchId !== "ALL") {
        joinBranchRoom(selectedBranchId)
      } else {
        socket.emit("join_branch", { branchId: "ALL" })
      }
      fetchKitchenOrders(true)
    }

    if (socket.connected) {
      handleConnect()
    }
    socket.on("connect", handleConnect)

    const handleKotReceived = (data: any) => {
      console.log("[KDS Socket] KOT received:", data)
      playNewOrderChime()
      fetchKitchenOrders(true)
    }

    const handleOrderUpdated = (data: any) => {
      console.log("[KDS Socket] Order updated:", data)
      fetchKitchenOrders(true)
    }

    socket.on("kot_received", handleKotReceived)
    socket.on("order_updated", handleOrderUpdated)

    // 4-second polling fallback
    const interval = setInterval(() => {
      fetchKitchenOrders(true)
    }, 4000)

    return () => {
      socket.off("connect", handleConnect)
      socket.off("kot_received", handleKotReceived)
      socket.off("order_updated", handleOrderUpdated)
      clearInterval(interval)
    }
  }, [selectedBranchId, fetchKitchenOrders])

  // Compute per-branch order count mapping
  const branchCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    allOrders.forEach(o => {
      const bId = getOrderBranchId(o)
      if (bId) counts[bId] = (counts[bId] || 0) + 1
    })
    return counts
  }, [allOrders])

  // Filter orders by active outlet
  const orders = useMemo(() => {
    if (selectedBranchId === "ALL") return allOrders
    return allOrders.filter(o => {
      const bId = getOrderBranchId(o)
      return bId === selectedBranchId
    })
  }, [allOrders, selectedBranchId])

  // Count calculations
  const newCount = useMemo(() => {
    return orders.filter(o => (o.kitchenStatus === "NEW" || o.status === "ORDERED" || o.status === "PENDING") && o.kitchenStatus !== "PREPARING" && o.kitchenStatus !== "READY").length
  }, [orders])

  const prepCount = useMemo(() => {
    return orders.filter(o => o.kitchenStatus === "PREPARING" || o.status === "PREPARING").length
  }, [orders])

  const readyCount = useMemo(() => {
    return orders.filter(o => o.kitchenStatus === "READY" || o.status === "READY").length
  }, [orders])

  const visibleOrders = useMemo(() => {
    if (selectedStatus === "ALL") return orders
    if (selectedStatus === "NEW") {
      return orders.filter(o => (o.kitchenStatus === "NEW" || o.status === "ORDERED" || o.status === "PENDING") && o.kitchenStatus !== "PREPARING" && o.kitchenStatus !== "READY")
    }
    if (selectedStatus === "PREPARING") {
      return orders.filter(o => o.kitchenStatus === "PREPARING" || o.status === "PREPARING")
    }
    if (selectedStatus === "READY") {
      return orders.filter(o => o.kitchenStatus === "READY" || o.status === "READY")
    }
    return orders
  }, [orders, selectedStatus])

  function tableLabel(order: KitchenOrder) {
    if (typeof order.tableId === "string") {
      return `Table ${order.tableId.slice(-4).toUpperCase()}`
    }
    return `Table ${order.tableId?.tableNumber || "T1"}`
  }

  function orderBranchName(order: KitchenOrder) {
    if (typeof order.tableId !== "string" && order.tableId?.areaName?.branchName?.branchName) {
      return order.tableId.areaName.branchName.branchName
    }
    return null
  }

  function orderAgeMinutes(createdAt: string) {
    return Math.max(
      0,
      Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
    )
  }

  function orderAge(createdAt: string) {
    const mins = orderAgeMinutes(createdAt)
    return mins === 0 ? "Just now" : `${mins} min ago`
  }

  async function updateOrderStatus(order: KitchenOrder, targetStatus?: KitchenStatus) {
    const currentKStatus = order.kitchenStatus || (order.status === "PREPARING" ? "PREPARING" : order.status === "READY" ? "READY" : "NEW")
    const nextStatus =
      targetStatus ||
      (currentKStatus === "NEW" ? "PREPARING" : "READY")

    try {
      setUpdatingOrder(order._id)
      await api.patch(`/orders/${order._id}/status`, { status: nextStatus })
      await fetchKitchenOrders(true)
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      alert(
        axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to update order status."
      )
    } finally {
      setUpdatingOrder(null)
    }
  }

  const activeBranchLabel = useMemo(() => {
    if (selectedBranchId === "ALL") return `All Outlets (${allOrders.length})`
    const found = branches.find(b => b._id === selectedBranchId)
    return found ? `${found.branchName} (${branchCounts[found._id] || 0})` : "Active Outlet"
  }, [branches, selectedBranchId, allOrders.length, branchCounts])

  // Other branches with active orders
  const otherBranchesWithOrders = useMemo(() => {
    return branches.filter(b => b._id !== selectedBranchId && (branchCounts[b._id] || 0) > 0)
  }, [branches, selectedBranchId, branchCounts])

  return (
    <main className="min-h-screen bg-gray-50/70 p-4 sm:p-6 lg:p-8 space-y-7">
      {/* Top Banner Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-950 via-slate-900 to-gray-900 p-6 sm:p-8 text-white shadow-xl border border-gray-800"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold uppercase tracking-widest">
                <RiFireLine className="animate-pulse text-red-400" size={14} />
                Kitchen Display System (KDS)
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-gray-300 text-xs font-medium">
                Live Kitchen Ticket Queue
              </span>
              
              {/* Outlet Selector Dropdown */}
              <div className="relative">
                {branches.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                    className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/30 transition cursor-pointer shadow-xs"
                  >
                    <FiMapPin size={12} />
                    <span>{activeBranchLabel}</span>
                    <FiChevronDown size={12} className={branchDropdownOpen ? "rotate-180" : ""} />
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold shadow-xs">
                    <FiMapPin size={12} />
                    <span>{activeBranchLabel}</span>
                  </span>
                )}

                {branchDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-1.5">
                      Select Kitchen Outlet
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBranchId("ALL")
                        localStorage.setItem("pos_selected_branch", "ALL")
                        setBranchDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                        selectedBranchId === "ALL"
                          ? "bg-red-600 text-white"
                          : "text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      <span>All Outlets</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px]">
                        {allOrders.length}
                      </span>
                    </button>
                    {branches.map(b => {
                      const count = branchCounts[b._id] || 0
                      return (
                        <button
                          key={b._id}
                          type="button"
                          onClick={() => {
                            setSelectedBranchId(b._id)
                            localStorage.setItem("pos_selected_branch", b._id)
                            setBranchDropdownOpen(false)
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                            selectedBranchId === b._id
                              ? "bg-red-600 text-white"
                              : "text-gray-300 hover:bg-white/10"
                          }`}
                        >
                          <span className="truncate">{b.branchName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                            count > 0 ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-gray-400"
                          }`}>
                            {count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-playfair flex items-center gap-3">
              <span>Chef & Expediter Station</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-400 max-w-xl">
              Track live food orders, manage preparation statuses, and streamline kitchen workflow for fast table delivery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-gray-800 text-right">
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Live Clock</p>
              <p className="text-base font-mono font-bold text-white tracking-wider">
                {currentTime || "12:00:00 PM"}
              </p>
            </div>

            <Link
              href="/user-dashboard/tables"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
            >
              <span>Floor Tables</span>
            </Link>

            <button
              type="button"
              onClick={() => fetchKitchenOrders()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white text-gray-900 font-bold text-xs shadow-md hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
            >
              <FiRefreshCw className={loading ? "animate-spin text-red-600" : ""} />
              <span>Refresh Orders</span>
            </button>

            <Link
              href="/user-dashboard/kitchen/tv"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/20 transition cursor-pointer active:scale-95"
            >
              <FiMaximize size={16} />
              <span>Kitchen TV ⛶</span>
            </Link>

            <Link
              href="/user-dashboard/kitchen/customer-tv"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition cursor-pointer active:scale-95"
            >
              <FaBullhorn size={15} />
              <span>Customer TV 📢</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* New Tickets */}
        <div 
          onClick={() => setSelectedStatus("NEW")}
          className={`rounded-2xl border p-5 shadow-xs flex items-center justify-between cursor-pointer transition ${
            selectedStatus === "NEW" ? "border-red-500 bg-red-50/40 ring-2 ring-red-400/20" : "border-red-100 bg-white hover:bg-red-50/20"
          }`}
        >
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Orders</p>
            <h3 className="text-2xl sm:text-3xl font-black text-[#9b1c1c] mt-1">{newCount}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-red-50 text-[#9b1c1c]">
            <FiPackage size={22} />
          </div>
        </div>

        {/* In Prep */}
        <div 
          onClick={() => setSelectedStatus("PREPARING")}
          className={`rounded-2xl border p-5 shadow-xs flex items-center justify-between cursor-pointer transition ${
            selectedStatus === "PREPARING" ? "border-amber-500 bg-amber-50/40 ring-2 ring-amber-400/20" : "border-amber-100 bg-white hover:bg-amber-50/20"
          }`}
        >
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">In Prep</p>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{prepCount}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600">
            <FiClock size={22} />
          </div>
        </div>

        {/* Ready to Serve */}
        <div 
          onClick={() => setSelectedStatus("READY")}
          className={`rounded-2xl border p-5 shadow-xs flex items-center justify-between cursor-pointer transition ${
            selectedStatus === "READY" ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-400/20" : "border-emerald-100 bg-white hover:bg-emerald-50/20"
          }`}
        >
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ready to Serve</p>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{readyCount}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <FiCheckCircle size={22} />
          </div>
        </div>

        {/* Total Active */}
        <div 
          onClick={() => setSelectedStatus("ALL")}
          className={`rounded-2xl border p-5 shadow-xs flex items-center justify-between cursor-pointer transition ${
            selectedStatus === "ALL" ? "border-slate-800 bg-slate-50 ring-2 ring-slate-400/20" : "border-gray-100 bg-white hover:bg-gray-50"
          }`}
        >
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Active</p>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">{orders.length}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-gray-100 text-gray-700">
            <RiRestaurantLine size={22} />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {statusTabs.map((tab) => {
          const isSelected = selectedStatus === tab.value
          const count =
            tab.value === "ALL"
              ? orders.length
              : tab.value === "NEW"
              ? newCount
              : tab.value === "PREPARING"
              ? prepCount
              : readyCount

          const badgeColor =
            tab.value === "NEW"
              ? isSelected ? "bg-red-500 text-white" : "bg-red-50 text-red-600 border border-red-200"
              : tab.value === "PREPARING"
              ? isSelected ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 border border-amber-200"
              : tab.value === "READY"
              ? isSelected ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : isSelected ? "bg-slate-700 text-white" : "bg-gray-100 text-gray-700 border border-gray-200"

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedStatus(tab.value)}
              className={`whitespace-nowrap rounded-2xl px-5 py-3 text-xs font-bold tracking-wider transition-all cursor-pointer flex items-center gap-2.5 shadow-2xs active:scale-95 ${
                isSelected
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 ring-2 ring-slate-900"
                  : "border border-gray-200/90 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              {tab.value === "NEW" && <RiFireLine className={count > 0 ? "text-red-500 animate-pulse" : "text-gray-400"} size={15} />}
              {tab.value === "PREPARING" && <FiClock className={count > 0 ? "text-amber-500" : "text-gray-400"} size={14} />}
              {tab.value === "READY" && <FiCheckCircle className={count > 0 ? "text-emerald-500" : "text-gray-400"} size={14} />}
              {tab.value === "ALL" && <FiList className="text-gray-400" size={14} />}
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${badgeColor}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-3xl bg-gray-100 animate-pulse border border-gray-200/50" />
          ))}
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-xs">
          <FiCheckCircle className="mx-auto text-4xl text-emerald-500 mb-3" />
          <h2 className="text-lg font-black text-gray-900 tracking-tight">Kitchen Queue Clear!</h2>
          <p className="mt-1 text-xs text-gray-400">
            No active orders in "{statusTabs.find(t => t.value === selectedStatus)?.label}" status for {activeBranchLabel}.
          </p>

          {/* If another outlet has active orders, show instant switch buttons */}
          {selectedBranchId !== "ALL" && otherBranchesWithOrders.length > 0 && (
            <div className="mt-6 p-5 rounded-2xl bg-amber-50 border border-amber-200 max-w-lg mx-auto text-amber-950">
              <p className="text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 text-amber-800">
                <span>⚡ Active orders detected in other outlets!</span>
              </p>
              <p className="text-xs text-amber-700 mt-1">
                You are currently filtering by {activeBranchLabel}. Switch outlet below to view your orders:
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBranchId("ALL")
                    localStorage.setItem("pos_selected_branch", "ALL")
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer shadow-xs"
                >
                  View All Outlets ({allOrders.length} orders)
                </button>
                {otherBranchesWithOrders.map(b => (
                  <button
                    key={b._id}
                    type="button"
                    onClick={() => {
                      setSelectedBranchId(b._id)
                      localStorage.setItem("pos_selected_branch", b._id)
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition cursor-pointer shadow-xs"
                  >
                    Switch to {b.branchName} ({branchCounts[b._id]} orders)
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {visibleOrders.map((order) => {
              const ageMins = orderAgeMinutes(order.createdAt)
              const isUrgent = ageMins >= 15
              const currentKStatus = order.kitchenStatus || (order.status === "PREPARING" ? "PREPARING" : order.status === "READY" ? "READY" : "NEW")
              const isPreparing = currentKStatus === "PREPARING"
              const isReady = currentKStatus === "READY"
              const branchName = orderBranchName(order)

              return (
                <motion.article
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  key={order._id}
                  className={`overflow-hidden rounded-3xl border bg-white shadow-xs transition duration-200 hover:shadow-xl flex flex-col justify-between ${
                    isReady
                      ? "border-emerald-200 ring-2 ring-emerald-500/20"
                      : isPreparing
                      ? "border-amber-200 ring-2 ring-amber-500/20"
                      : isUrgent
                      ? "border-red-300 ring-2 ring-red-500/30"
                      : "border-gray-200/90"
                  }`}
                >
                  {/* Top Status Accent Bar */}
                  <div
                    className={`h-1.5 w-full ${
                      isReady
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                        : isPreparing
                        ? "bg-gradient-to-r from-amber-500 to-orange-500"
                        : isUrgent
                        ? "bg-gradient-to-r from-red-600 via-rose-600 to-amber-600"
                        : "bg-gradient-to-r from-red-500 to-rose-500"
                    }`}
                  />

                  <div>
                    {/* Ticket Header */}
                    <div className="p-4 sm:p-5 border-b border-gray-100 bg-slate-50/70">
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-slate-800 shadow-2xs">
                            {order.orderNumber || `#${order._id.slice(-4).toUpperCase()}`}
                          </span>
                          {branchName && (
                            <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                              {branchName}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold">
                            Dine-In
                          </span>
                        </div>

                        {/* Status Beacon Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                            isReady
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isPreparing
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isReady
                                ? "bg-emerald-500"
                                : isPreparing
                                ? "bg-amber-500 animate-pulse"
                                : "bg-red-500 animate-ping"
                            }`}
                          />
                          {currentKStatus === "NEW" ? "NEW ORDER" : currentKStatus}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between gap-2">
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight font-sans">
                          {tableLabel(order)}
                        </h2>

                        {/* Urgency Badge */}
                        <div
                          className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl transition ${
                            isUrgent
                              ? "bg-red-50 text-red-700 border border-red-200 animate-pulse font-black"
                              : ageMins >= 10
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isUrgent ? (
                            <RiFireLine className="text-red-600" size={13} />
                          ) : (
                            <FiClock size={12} className="text-gray-500" />
                          )}
                          <span>{orderAge(order.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Items List with Interactive Checklist */}
                    <div className="p-4 sm:p-5 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400 pb-1">
                        <span>Items to Cook</span>
                        <span className="text-[9px] text-gray-400 font-medium">Tap dish when ready</span>
                      </div>

                      {order.items.map((item, idx) => {
                        const itemKey = `${order._id}-${idx}`
                        const isDone = !!toggledItems[itemKey]

                        return (
                          <div
                            key={item._id || `${item.name}-${idx}`}
                            onClick={() =>
                              setToggledItems((prev) => ({
                                ...prev,
                                [itemKey]: !prev[itemKey],
                              }))
                            }
                            className={`p-2.5 rounded-2xl flex items-start justify-between gap-3 cursor-pointer group transition select-none border ${
                              isDone
                                ? "bg-emerald-50/50 border-emerald-200/60 opacity-60"
                                : "bg-gray-50/50 hover:bg-gray-100/80 border-gray-100"
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <span
                                className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black shrink-0 transition ${
                                  isDone
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-900 text-white group-hover:bg-[#e02424]"
                                }`}
                              >
                                {isDone ? <FiCheck size={16} /> : `${item.quantity}x`}
                              </span>
                              <div className="min-w-0">
                                <span
                                  className={`text-sm font-extrabold block truncate leading-snug transition ${
                                    isDone ? "line-through text-gray-500" : "text-gray-900"
                                  }`}
                                >
                                  {item.name}
                                </span>
                                {item.notes && (
                                  <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                                    <FiAlertTriangle size={10} /> {item.notes}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className="text-xs font-semibold text-gray-400 shrink-0 pt-1">
                              INR {(item.price || 0) * (item.quantity || 1)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Ticket Footer Action */}
                  <div className="flex items-center justify-between border-t border-gray-100 bg-slate-50/70 p-4 sm:p-5 mt-auto">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {order.items.reduce((acc, i) => acc + (i.quantity || 1), 0)} items total
                      </p>
                      <p className="text-base font-black text-gray-900">
                        INR {order.totalAmount || 0}
                      </p>
                    </div>

                    {!isReady ? (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order)}
                        disabled={updatingOrder === order._id}
                        className={`rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition shadow-md cursor-pointer disabled:opacity-50 active:scale-95 flex items-center gap-2 ${
                          isPreparing
                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25"
                            : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-500/25"
                        }`}
                      >
                        {isPreparing ? <FiCheckCircle size={15} /> : <RiFireLine size={15} />}
                        <span>
                          {updatingOrder === order._id
                            ? "Updating..."
                            : isPreparing
                            ? "Mark Ready"
                            : "Start Cooking"}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order, "SERVED")}
                        disabled={updatingOrder === order._id}
                        className="rounded-2xl px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider transition shadow-md shadow-blue-500/25 cursor-pointer disabled:opacity-50 active:scale-95 flex items-center gap-2"
                      >
                        <FiCheck size={15} />
                        <span>{updatingOrder === order._id ? "Serving..." : "Mark as Served"}</span>
                      </button>
                    )}
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </main>
  )
}