"use client"

import React, { useEffect, useState, useMemo } from 'react'
import api from '../../services/api'
import { AxiosError } from 'axios'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PiTableBold, 
  PiMapPinSimpleAreaFill, 
  PiChairBold 
} from "react-icons/pi"
import { 
  FiSearch, 
  FiCheckCircle, 
  FiClock, 
  FiRefreshCw, 
  FiArrowRight, 
  FiFilter,
  FiGrid,
  FiAlertCircle
} from "react-icons/fi"
import { MdOutlineMeetingRoom, MdEventSeat } from "react-icons/md"

interface areaData {
  areaName: string
  _id: string
  areaCode: string
}

interface BranchSummary {
  _id?: string
  branchName: string
}

interface AreaSummary {
  _id: string
  areaName: string
  branchName?: BranchSummary
}

interface TableByBranchResponse {
  _id: string
  tableNumber: string
  areaName: AreaSummary
  availabilityStatus: "AVAILABLE" | "OCCUPIED"
  createdBy?: string
}

export default function TablesPage() {
  const [areaData, setAreaData] = useState<areaData[]>([])
  const [tableList, setTableList] = useState<TableByBranchResponse[]>([])
  const [selectedArea, setSelectedArea] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AVAILABLE" | "OCCUPIED">("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  const router = useRouter()

  async function getBranchDatasFun() {
    try {
      const res = await api.get('/get/area/branch')
      const data = Array.isArray(res?.data?.data) ? res.data.data : []
      setAreaData(data)
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>
      console.error(error.response?.data?.message || error.message)
    }
  }

  async function getAllTablesFun() {
    setLoading(true)
    try {
      const res = await api.get('/get/all/tables')
      const data = Array.isArray(res?.data?.data) ? res.data.data : []
      setTableList(data)
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>
      console.error(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  async function getTableByAreaFun(id: string) {
    setLoading(true)
    try {
      const res = await api.get(`/get/tables/area/${id}`)
      const data = Array.isArray(res?.data?.data) ? res.data.data : []
      setTableList(data)
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>
      console.error(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  async function getTableByBranch() {
    setLoading(true)
    try {
      const res = await api.get('/get/tables/branch')
      const data = Array.isArray(res?.data?.data) ? res.data.data : []
      setTableList(data)
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>
      console.error(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    if (selectedArea === "ALL") {
      await getTableByBranch()
    } else {
      await getTableByAreaFun(selectedArea)
    }
    await getBranchDatasFun()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  useEffect(() => {
    getBranchDatasFun()
    getTableByBranch()
  }, [])

  // Filtered table data based on area, status, and search query
  const filteredTables = useMemo(() => {
    return tableList.filter((table) => {
      const matchesSearch =
        searchQuery === "" ||
        table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        table.areaName?.areaName?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "ALL" || table.availabilityStatus === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [tableList, searchQuery, statusFilter])

  // Stats calculation
  const totalTables = tableList.length
  const availableCount = tableList.filter(t => t.availabilityStatus === "AVAILABLE").length
  const occupiedCount = tableList.filter(t => t.availabilityStatus === "OCCUPIED").length
  const occupancyRate = totalTables > 0 ? Math.round((occupiedCount / totalTables) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 lg:p-8 space-y-6">
      
      {/* 1. TOP HEADER & REFRESH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-red-50 text-[#e02424] px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <PiTableBold className="text-sm" /> Floor Plan & Orders
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">Live Management</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dining Tables Overview
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Select a table to manage guest seating or take orders instantly.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 self-start md:self-auto bg-slate-900 hover:bg-[#e02424] text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50"
        >
          <FiRefreshCw className={`text-sm ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh Floor"}
        </button>
      </div>

      {/* 2. DASHBOARD STATS BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tables</p>
            <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-1">{totalTables}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <FiGrid size={22} />
          </div>
        </div>

        {/* Available Tables */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Available Now</p>
            <h3 className="text-2xl lg:text-3xl font-extrabold text-emerald-600 mt-1">{availableCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center relative">
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
            <FiCheckCircle size={22} />
          </div>
        </div>

        {/* Occupied Tables */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#e02424]">Occupied</p>
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#e02424] mt-1">{occupiedCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-red-50 text-[#e02424] flex items-center justify-center">
            <MdEventSeat size={24} />
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Occupancy Rate</p>
            <span className="text-xs font-extrabold text-slate-700">{occupancyRate}%</span>
          </div>
          <div className="mt-3">
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-[#e02424] rounded-full transition-all duration-500"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR & AREA SELECTION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
        
        {/* Search & Status Filters Header */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input
              type="text"
              placeholder="Search table number or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424] transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full h-5 w-5 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl self-start lg:self-auto">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Statuses
            </button>
            <button
              onClick={() => setStatusFilter("AVAILABLE")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === "AVAILABLE"
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${statusFilter === "AVAILABLE" ? "bg-white" : "bg-emerald-500"}`} />
              Available
            </button>
            <button
              onClick={() => setStatusFilter("OCCUPIED")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === "OCCUPIED"
                  ? "bg-[#e02424] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${statusFilter === "OCCUPIED" ? "bg-white" : "bg-red-500"}`} />
              Occupied
            </button>
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Area Pills Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiMapPinSimpleAreaFill className="text-[#e02424] text-base" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Filter By Area
              </h2>
            </div>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {areaData.length} Dining Areas
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-2 border ${
                selectedArea === "ALL"
                  ? "bg-[#e02424] text-white border-[#e02424] shadow-md shadow-red-500/20 scale-102"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
              }`}
              onClick={() => {
                setSelectedArea("ALL")
                getAllTablesFun()
              }}
            >
              <span>All Areas</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                selectedArea === "ALL" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
              }`}>
                {tableList.length}
              </span>
            </button>

            {areaData.map((area) => (
              <button
                type="button"
                key={area._id}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-2 border ${
                  selectedArea === area._id
                    ? "bg-[#e02424] text-white border-[#e02424] shadow-md shadow-red-500/20 scale-102"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                }`}
                onClick={() => {
                  setSelectedArea(area._id)
                  getTableByAreaFun(area._id)
                }}
              >
                <span>{area.areaName}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  selectedArea === area._id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  {area.areaCode}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* 4. TABLE CARDS GRID */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-5">
          {Array.from({ length: 12 }).map((_, index) => (
            <div 
              key={index}
              className="h-44 rounded-3xl bg-white border border-slate-100 p-5 animate-pulse flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 bg-slate-100 rounded-2xl" />
                <div className="h-6 w-16 bg-slate-100 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-6 w-20 bg-slate-100 rounded-md" />
                <div className="h-4 w-28 bg-slate-100 rounded-md" />
              </div>
              <div className="h-8 w-full bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center space-y-4 max-w-md mx-auto my-8 shadow-xs">
          <div className="h-16 w-16 bg-red-50 text-[#e02424] rounded-full flex items-center justify-center mx-auto text-2xl">
            <FiAlertCircle />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Tables Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              No dining tables match your selected filters or search query.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedArea("ALL")
              setStatusFilter("ALL")
              setSearchQuery("")
              getAllTablesFun()
            }}
            className="px-4 py-2 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-[#e02424] transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-5"
        >
          <AnimatePresence>
            {filteredTables.map((table) => {
              const isAvailable = table.availabilityStatus === "AVAILABLE"

              return (
                <motion.article
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={table._id}
                  onClick={() => router.push(`/user-dashboard/menus?tableId=${table._id}`)}
                  className={`group relative flex flex-col justify-between rounded-3xl bg-white p-5 border shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer overflow-hidden ${
                    isAvailable
                      ? "border-slate-100 hover:border-emerald-400/50 hover:shadow-emerald-500/10"
                      : "border-slate-100 hover:border-rose-400/50 hover:shadow-rose-500/10"
                  }`}
                >
                  {/* Top Status Accent Bar */}
                  <div 
                    className={`absolute top-0 left-0 right-0 h-1.5 transition-colors ${
                      isAvailable ? "bg-emerald-500" : "bg-[#e02424]"
                    }`}
                  />

                  {/* Header: Table Icon & Status Badge */}
                  <div className="flex items-center justify-between mt-1">
                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center font-black transition-colors ${
                      isAvailable 
                        ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white" 
                        : "bg-red-50 text-[#e02424] group-hover:bg-[#e02424] group-hover:text-white"
                    }`}>
                      <PiTableBold size={20} />
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase ${
                        isAvailable
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-[#e02424] border border-red-200"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isAvailable ? "bg-emerald-500 animate-pulse" : "bg-[#e02424]"
                        }`}
                      />
                      {table.availabilityStatus}
                    </span>
                  </div>

                  {/* Body: Table Number & Area Name */}
                  <div className="my-4 space-y-1">
                    <h3 className="text-xl lg:text-2xl font-black text-slate-900 group-hover:text-[#e02424] transition-colors flex items-baseline gap-1">
                      <span>Table</span>
                      <span className="text-[#e02424]">{table.tableNumber}</span>
                    </h3>

                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
                      <PiMapPinSimpleAreaFill className="text-slate-400 shrink-0" />
                      <span className="truncate uppercase tracking-wide">
                        {table.areaName?.areaName || "Main Hall"}
                      </span>
                    </div>
                  </div>

                  {/* Footer Action CTA */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-700 transition-colors">
                      {isAvailable ? "Take Order" : "View Order"}
                    </span>
                    <div className={`h-7 w-7 rounded-xl flex items-center justify-center transition-all ${
                      isAvailable
                        ? "bg-slate-100 text-slate-600 group-hover:bg-emerald-500 group-hover:text-white"
                        : "bg-slate-100 text-slate-600 group-hover:bg-[#e02424] group-hover:text-white"
                    }`}>
                      <FiArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

    </div>
  )
}