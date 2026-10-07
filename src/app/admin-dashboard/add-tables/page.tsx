"use client"

import React, { useEffect, useState } from "react"
import { PiTableBold, PiMapPinSimpleAreaFill } from "react-icons/pi"
import {
  RiSearchLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiBuildingLine,
  RiFilter3Line,
  RiEditLine,
  RiDeleteBinLine,
} from "react-icons/ri"
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
  const [tableAvailability, setTableAvailability] = useState<"AVAILABLE" | "OCCUPIED">("AVAILABLE")
  const [loading, setLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedFilterArea, setSelectedFilterArea] = useState<string>("ALL")
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Edit and Delete states
  const [editingTable, setEditingTable] = useState<TableData | null>(null)
  const [deleteModalTable, setDeleteModalTable] = useState<TableData | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)

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

  function handleStartEdit(table: TableData) {
    setEditingTable(table)
    setTableNumber(table.tableNumber)
    setSelectedAreaId(table.areaName?._id || "")
    setTableAvailability(table.availabilityStatus || "AVAILABLE")
    setNotification(null)
  }

  function handleCancelEdit() {
    setEditingTable(null)
    setTableNumber("")
    setSelectedAreaId("")
    setTableAvailability("AVAILABLE")
  }

  async function handleAddOrUpdateTable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setNotification(null)

    try {
      if (editingTable) {
        const res = await api.put(`/tables/${editingTable._id}`, {
          tableNumber,
          areaName: selectedAreaId,
          availabilityStatus: tableAvailability,
        })
        setNotification({
          type: 'success',
          message: res.data.message || 'Table updated successfully!',
        })
        handleCancelEdit()
      } else {
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
      }
      getAllTableDatasFun()
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>
      setNotification({
        type: 'error',
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to process table. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteTable() {
    if (!deleteModalTable) return
    setDeleteLoading(true)
    try {
      const res = await api.delete(`/tables/${deleteModalTable._id}`)
      setNotification({
        type: 'success',
        message: res.data.message || 'Table deleted successfully!',
      })
      if (editingTable?._id === deleteModalTable._id) {
        handleCancelEdit()
      }
      setDeleteModalTable(null)
      getAllTableDatasFun()
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>
      setNotification({
        type: 'error',
        message:
          error.response?.data?.message ||
          error.message ||
          'Failed to delete table.',
      })
      setDeleteModalTable(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const selectedAreaObj = areaDatas.find((a) => a._id === selectedAreaId)

  const filteredTables = tableData.filter((table) => {
    const matchesSearch =
      table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.areaName?.areaName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
          className={`flex items-center justify-between rounded-2xl p-4 border text-xs font-semibold ${notification.type === 'success'
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
            className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Form & Preview Left (Sticky), Tables Grid Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Sticky Creation Form + Preview Card */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 lg:self-start space-y-6 max-h-[calc(100vh-4rem)] overflow-y-auto pr-1">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingTable ? "Edit Dining Table" : "Add Dining Table"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingTable
                    ? "Update table number, dining zone, or live status."
                    : "Register table number and select target dining section."}
                </p>
              </div>
              {editingTable && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            {editingTable && (
              <div className="flex items-center justify-between rounded-xl bg-blue-50 border border-blue-200/70 px-3 py-2 text-xs text-blue-900 font-medium">
                <span>
                  Editing: <strong>{editingTable.tableNumber}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-blue-700 hover:text-blue-900 font-bold text-xs underline cursor-pointer"
                >
                  Reset
                </button>
              </div>
            )}

            <form onSubmit={handleAddOrUpdateTable} className="space-y-4">
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

              {editingTable && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Availability Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTableAvailability("AVAILABLE")}
                      className={`rounded-xl py-2.5 text-xs font-bold transition border cursor-pointer ${tableAvailability === "AVAILABLE"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-100"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                    >
                      Available
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableAvailability("OCCUPIED")}
                      className={`rounded-xl py-2.5 text-xs font-bold transition border cursor-pointer ${tableAvailability === "OCCUPIED"
                          ? "bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-100"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                    >
                      Occupied
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-900/20 hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading
                    ? editingTable
                      ? "Updating Table..."
                      : "Adding Table..."
                    : editingTable
                      ? "Update Table"
                      : "Create Table"}
                </button>
                {editingTable && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded-xl border border-slate-200 px-4 py-3.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Live Visual Preview Card */}
          <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 p-6 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-300">
                Live Table Preview
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${tableAvailability === "AVAILABLE"
                    ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                    : "bg-amber-500/20 border-amber-400/40 text-amber-300"
                  }`}
              >
                {tableAvailability}
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
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${selectedFilterArea === "ALL"
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
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${selectedFilterArea === area._id
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
                  className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition duration-200 hover:shadow-md ${editingTable?._id === table._id
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-slate-200/80 hover:border-blue-300"
                    }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                        <PiTableBold size={20} />
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${table.availabilityStatus === "AVAILABLE"
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

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400">
                    <span className="font-mono text-[10px]">ID: {table._id.slice(-5)}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(table)}
                        title="Edit Table"
                        className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition cursor-pointer"
                      >
                        <RiEditLine size={13} />
                        <span className="text-[10px] font-bold">Edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteModalTable(table)}
                        title="Delete Table"
                        className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition cursor-pointer"
                      >
                        <RiDeleteBinLine size={13} />
                        <span className="text-[10px] font-bold">Del</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <RiDeleteBinLine size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Dining Table</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete table{' '}
              <strong className="text-slate-900">"{deleteModalTable.tableNumber}"</strong> in section{' '}
              <strong className="text-slate-900">"{deleteModalTable.areaName?.areaName}"</strong>?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeleteModalTable(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteTable}
                className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-red-900/20 transition disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? "Deleting..." : "Yes, Delete Table"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddTablesPage