"use client"

import React, { useEffect, useState } from "react"
import { PiTableBold, PiMapPinSimpleAreaFill } from "react-icons/pi"
import { RiSearchLine, RiCheckLine, RiErrorWarningLine, RiBuildingLine, RiFilter3Line } from "react-icons/ri"
import api from "../../services/api"
import { AxiosError } from "axios"

interface BranchSummary {
  _id?: string
  branchName: string
  branchCode?: string
}

interface Area {
  _id: string
  areaName: string
  areaCode: string
  branchName: BranchSummary
}

interface TableData {
  _id: string
  tableNumber: string
  areaName: Area
  availabilityStatus: "AVAILABLE" | "OCCUPIED"
  createdBy?: string
}

function AddTablesPage() {
  const [areaDatas, setAreaDatas] = useState<Area[]>([])
  const [tableData, setTableDatas] = useState<TableData[]>([])
  const [tableNumber, setTableNumber] = useState<string>("")
  const [selectedAreaId, setSelectedAreaId] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedFilterArea, setSelectedFilterArea] = useState<string>("ALL")
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function getAreaDatas() {
    try {
      const res = await api.get('/get/area/all')
      setAreaDatas(res.data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function getAllTableDatasFun() {
    try {
      const res = await api.get('/get/all/tables')
      setTableDatas(res.data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    getAreaDatas()
    getAllTableDatasFun()
  }, [])

  async function addTablesfun(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setNotification(null)

    try {
      const res = await api.post('/add/tables', {
        tableNumber,
        areaName: selectedAreaId,
      })
      setNotification({
        type: 'success',
        message: res.data.message || 'Table added successfully!',
      })
      setTableNumber("")
      setSelectedAreaId("")
      getAllTableDatasFun()
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>
      setNotification({
        type: 'error',
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to add table. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedAreaObj = areaDatas.find((a) => a._id === selectedAreaId)

  const filteredTables = tableData.filter((table) => {
    const matchesSearch =
      table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.areaName?.areaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (table.areaName?.branchName?.branchName &&
        table.areaName.branchName.branchName.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesAreaFilter =
      selectedFilterArea === "ALL" || table.areaName?._id === selectedFilterArea

    return matchesSearch && matchesAreaFilter
  })

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/20">
            <PiTableBold size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Table Layout & Assignment
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Add floor tables and map them to specific dining areas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-bold text-blue-800">
            {tableData.length} Total Tables
          </span>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 border text-xs font-semibold ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <RiCheckLine size={18} className="text-emerald-600" />
            ) : (
              <RiErrorWarningLine size={18} className="text-red-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Form & Preview Left, Tables Grid Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Creation Form + Preview Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Add Dining Table</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register table number and select target dining section.
              </p>
            </div>

            <form onSubmit={addTablesfun} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Table Number / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. T-01, VIP-04"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-bold text-slate-800 uppercase tracking-wider placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Select Dining Area *
                </label>
                <select
                  required
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                >
                  <option value="" disabled>
                    -- Select Dining Section --
                  </option>
                  {areaDatas.map((area) => (
                    <option key={area._id} value={area._id}>
                      {area.areaName} ({area.branchName?.branchName || 'No Branch'})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-900/20 hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Adding Table..." : "Create Table"}
              </button>
            </form>
          </div>

          {/* Live Visual Preview Card */}
          <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 p-6 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-300">
                Live Table Preview
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                AVAILABLE
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 border-4 border-white/20 text-xl font-black text-white shadow-xl tracking-wider">
                {tableNumber || "T-01"}
              </div>
              <p className="text-xs font-bold text-slate-200">
                {selectedAreaObj ? selectedAreaObj.areaName : "Select an Area"}
              </p>
              <p className="text-[10px] text-blue-200/70">
                {selectedAreaObj?.branchName?.branchName || "Branch Location"}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Tables Grid & Filters */}
        <div className="lg:col-span-8 space-y-5">
          {/* Controls: Area Filters & Search */}
          <div className="flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Floor Tables Directory</h2>
                <p className="text-xs text-slate-500">Live operational status across dining areas</p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-60">
                <RiSearchLine size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search table or section..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                <RiFilter3Line size={14} /> Area:
              </span>
              <button
                onClick={() => setSelectedFilterArea("ALL")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                  selectedFilterArea === "ALL"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                All Sections ({tableData.length})
              </button>
              {areaDatas.map((area) => {
                const count = tableData.filter((t) => t.areaName?._id === area._id).length
                return (
                  <button
                    key={area._id}
                    onClick={() => setSelectedFilterArea(area._id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                      selectedFilterArea === area._id
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {area.areaName} ({count})
                  </button>
                )
              })}
            </div>
          </div>

          {filteredTables.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <PiTableBold size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-700">No tables found</p>
              <p className="text-[11px] text-slate-400 mt-1">Create tables using the form on the left</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTables.map((table) => (
                <div
                  key={table._id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:shadow-md hover:border-blue-300"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                        <PiTableBold size={20} />
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          table.availabilityStatus === "AVAILABLE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {table.availabilityStatus}
                      </span>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Table No.
                      </p>
                      <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition tracking-wider mt-0.5">
                        {table.tableNumber}
                      </h3>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px]">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Area:</span>
                        <span className="font-bold text-slate-800">
                          {table.areaName?.areaName || 'Default'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Branch:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[100px]">
                          {table.areaName?.branchName?.branchName || 'Default'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddTablesPage