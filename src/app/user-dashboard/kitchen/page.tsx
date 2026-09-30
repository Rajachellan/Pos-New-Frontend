"use client"

import { useEffect, useMemo, useState } from "react"
import { AxiosError } from "axios"
import { motion, AnimatePresence } from "framer-motion"
import {
  FiClock,
  FiRefreshCw,
  FiCheckCircle,
  FiCoffee,
  FiPackage,
  FiAlertCircle,
  FiTrendingUp,
  FiCheck
} from "react-icons/fi"
import { FaCheck } from "react-icons/fa6"
import { RiFireLine, RiRestaurantLine } from "react-icons/ri"
import api from "../../services/api"

type OrderStatus = "PENDING" | "ORDERED" | "PREPARING" | "READY"

interface KitchenItem {
  menuId: string
  name: string
  price: number
  quantity: number
}

interface KitchenOrder {
  _id: string
  tableId: {
    _id: string
    tableNumber: string
    areaName?: {
      areaName?: string
    }
  } | string
  items: KitchenItem[]
  totalAmount: number
  status: OrderStatus
  createdAt: string
}

const statusTabs: Array<{ value: "ALL" | OrderStatus; label: string }> = [
  { value: "ALL", label: "All Tickets" },
  { value: "PENDING", label: "New Orders" },
  { value: "ORDERED", label: "Confirmed" },
  { value: "PREPARING", label: "In Prep" },
  { value: "READY", label: "Ready to Serve" },
]

export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | OrderStatus>("ALL")
  const [loading, setLoading] = useState(true)
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState<string>("")

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

  async function getKitchenOrders() {
    try {
      setLoading(true)
      const response = await api.get("/kitchen/orders")
      setOrders(response.data.data || [])
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      console.error(axiosError.response?.data?.message || axiosError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getKitchenOrders()
  }, [])

  const visibleOrders = useMemo(
    () =>
      selectedStatus === "ALL"
        ? orders
        : orders.filter((order) => order.status === selectedStatus),
    [orders, selectedStatus]
  )

  function tableLabel(order: KitchenOrder) {
    if (typeof order.tableId === "string") {
      return `Table ${order.tableId.slice(-4).toUpperCase()}`
    }
    return `Table ${order.tableId.tableNumber}`
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

  async function updateOrderStatus(order: KitchenOrder) {
    const nextStatus: OrderStatus =
      order.status === "PENDING" || order.status === "ORDERED"
        ? "PREPARING"
        : "READY"

    try {
      setUpdatingOrder(order._id)
      await api.patch(`/orders/${order._id}/status`, { status: nextStatus })
      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder._id === order._id
            ? { ...currentOrder, status: nextStatus }
            : currentOrder
        )
      )
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

  const newCount = orders.filter((o) => o.status === "PENDING" || o.status === "ORDERED").length
  const prepCount = orders.filter((o) => o.status === "PREPARING").length
  const readyCount = orders.filter((o) => o.status === "READY").length

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
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold uppercase tracking-widest">
                <RiFireLine className="animate-pulse text-red-400" size={14} />
                Kitchen Display System (KDS)
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-gray-300 text-xs font-medium">
                Live Kitchen Ticket Queue
              </span>
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

            <button
              type="button"
              onClick={getKitchenOrders}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white text-gray-900 font-bold text-xs shadow-md hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
            >
              <FiRefreshCw className={loading ? "animate-spin text-red-600" : ""} />
              <span>Refresh Orders</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* New Tickets */}
        <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Orders</p>
            <h3 className="text-2xl sm:text-3xl font-black text-[#9b1c1c] mt-1">{newCount}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-red-50 text-[#9b1c1c]">
            <FiPackage size={22} />
          </div>
        </div>

        {/* In Prep */}
        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">In Prep</p>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{prepCount}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600">
            <FiClock size={22} />
          </div>
        </div>

        {/* Ready to Serve */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ready to Serve</p>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{readyCount}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <FiCheckCircle size={22} />
          </div>
        </div>

        {/* Total Active */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs flex items-center justify-between">
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
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {statusTabs.map((tab) => {
          const isSelected = selectedStatus === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedStatus(tab.value)}
              className={`whitespace-nowrap rounded-2xl px-5 py-3 text-xs font-bold tracking-wider transition-all cursor-pointer ${
                isSelected
                  ? "bg-slate-900 text-white shadow-md shadow-gray-900/20 scale-102"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black ${
                isSelected ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"
              }`}>
                {tab.value === "ALL"
                  ? orders.length
                  : tab.value === "PENDING"
                  ? newCount
                  : orders.filter((o) => o.status === tab.value).length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-16 text-center shadow-xs">
          <FiCheckCircle className="mx-auto text-4xl text-emerald-500 mb-3" />
          <h2 className="text-lg font-extrabold text-gray-900 font-playfair">Kitchen Queue Clear!</h2>
          <p className="mt-1 text-xs text-gray-400">No active orders in "{selectedStatus}" status.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {visibleOrders.map((order) => {
              const ageMins = orderAgeMinutes(order.createdAt)
              const isUrgent = ageMins >= 15
              const isPreparing = order.status === "PREPARING"
              const isReady = order.status === "READY"

              return (
                <motion.article
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  key={order._id}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-xs transition duration-200 hover:shadow-lg ${
                    isReady
                      ? "border-emerald-200 bg-emerald-50/20"
                      : isPreparing
                      ? "border-amber-200 bg-amber-50/20"
                      : isUrgent
                      ? "border-red-300 ring-2 ring-red-400/20"
                      : "border-gray-200"
                  }`}
                >
                  {/* Ticket Header */}
                  <div className="flex items-start justify-between border-b border-gray-100 p-5 bg-gray-50/70">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                        Ticket #{order._id.slice(-5).toUpperCase()}
                      </p>
                      <h2 className="mt-1 text-xl font-extrabold text-gray-900 font-playfair">
                        {tableLabel(order)}
                      </h2>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <FiClock size={12} className={isUrgent ? "text-red-500 animate-pulse" : "text-gray-400"} />
                        <span className={isUrgent ? "text-red-600 font-bold" : ""}>
                          {orderAge(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        isReady
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : isPreparing
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="space-y-3 p-5 min-h-[120px]">
                    {order.items.map((item) => (
                      <div key={item.menuId} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white shrink-0">
                            {item.quantity}x
                          </span>
                          <span className="text-sm font-bold text-gray-800 leading-snug">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-gray-400 shrink-0">
                          INR {item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Ticket Footer Action */}
                  <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 p-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Ticket</p>
                      <p className="text-base font-extrabold text-gray-900">INR {order.totalAmount}</p>
                    </div>

                    {!isReady ? (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order)}
                        disabled={updatingOrder === order._id}
                        className={`rounded-xl px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition shadow-sm cursor-pointer disabled:opacity-50 ${
                          isPreparing
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "bg-[#9b1c1c] hover:bg-[#8b1515]"
                        }`}
                      >
                        {updatingOrder === order._id
                          ? "Updating..."
                          : isPreparing
                          ? "Mark Ready"
                          : "Start Cooking"}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200">
                        <FiCheck size={14} /> Ready for Server
                      </span>
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