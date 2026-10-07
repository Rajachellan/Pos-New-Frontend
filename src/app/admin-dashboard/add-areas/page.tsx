"use client"

import React, { useEffect, useState, useMemo } from 'react'
import api from '../../services/api'
import { AxiosError } from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { PiMapPinSimpleAreaFill } from 'react-icons/pi'
import {
  RiBuildingLine,
  RiSearchLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiFilter3Line,
  RiEditLine,
  RiDeleteBinLine,
  RiCloseLine,
  RiGridFill,
  RiListCheck2,
  RiAddLine,
  RiStore2Line,
} from 'react-icons/ri'
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiLayers,
} from 'react-icons/fi'

interface Branch {
  _id: string
  branchName: string
  branchCode: string
}

interface BranchByName {
  _id?: string
  branchName: string
}

interface Area {
  _id: string
  areaName: string
  areaCode: string
  branchName: BranchByName
  createdAt?: string
}

export default function AddAreasPage() {
  const [branchData, setBranchData] = useState<Branch[]>([])
  const [areaName, setAreaName] = useState<string>('')
  const [areaCode, setAreaCode] = useState<string>('')
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [areaDatas, setAreaDatas] = useState<Area[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [fetching, setFetching] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterBranchId, setFilterBranchId] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(8)

  // Edit and Delete states
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [deleteModalArea, setDeleteModalArea] = useState<Area | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)

  async function getBranch() {
    try {
      const res = await api.get('/get/branch')
      setBranchData(res.data.data || [])
    } catch (err) {
      console.error('Failed to fetch branches:', err)
    }
  }

  async function getAreas() {
    setFetching(true)
    try {
      const res = await api.get('/get/area/all')
      setAreaDatas(res.data.data || [])
    } catch (err) {
      console.error('Failed to fetch areas:', err)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    getBranch()
    getAreas()
  }, [])

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(() => setNotification(null), 5000)
    return () => clearTimeout(timer)
  }, [notification])

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterBranchId, pageSize])

  function handleStartEdit(area: Area) {
    setEditingArea(area)
    setAreaName(area.areaName)
    setAreaCode(area.areaCode)
    const bId =
      (area.branchName as any)?._id ||
      branchData.find((b) => b.branchName === area.branchName?.branchName)?._id ||
      ''
    setSelectedBranchId(bId)
    setNotification(null)

    // Scroll smoothly to form on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancelEdit() {
    setEditingArea(null)
    setAreaName('')
    setAreaCode('')
    setSelectedBranchId('')
  }

  async function handleAddOrUpdateArea(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setNotification(null)

    try {
      if (editingArea) {
        const res = await api.put(`/area/${editingArea._id}`, {
          areaName,
          areaCode,
          branchName: selectedBranchId,
        })
        setNotification({
          type: 'success',
          message: res.data.message || 'Dining area updated successfully!',
        })
        handleCancelEdit()
      } else {
        const res = await api.post('/add/area', {
          areaName,
          areaCode,
          branchName: selectedBranchId,
        })
        setNotification({
          type: 'success',
          message: res.data.message || 'Dining area created successfully!',
        })
        setAreaName('')
        setAreaCode('')
        setSelectedBranchId('')
      }
      getAreas()
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>
      setNotification({
        type: 'error',
        message:
          error.response?.data?.message ||
          error.message ||
          'Failed to process area. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteArea() {
    if (!deleteModalArea) return
    setDeleteLoading(true)
    try {
      const res = await api.delete(`/area/${deleteModalArea._id}`)
      setNotification({
        type: 'success',
        message: res.data.message || 'Dining area deleted successfully!',
      })
      if (editingArea?._id === deleteModalArea._id) {
        handleCancelEdit()
      }
      setDeleteModalArea(null)
      getAreas()
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>
      setNotification({
        type: 'error',
        message:
          error.response?.data?.message ||
          error.message ||
          'Failed to delete dining area.',
      })
      setDeleteModalArea(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  // Filtered areas
  const filteredAreas = useMemo(() => {
    return areaDatas.filter((area) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        area.areaName.toLowerCase().includes(q) ||
        area.areaCode.toLowerCase().includes(q) ||
        (area.branchName?.branchName &&
          area.branchName.branchName.toLowerCase().includes(q))

      const matchesBranch =
        filterBranchId === 'ALL' ||
        (area.branchName as any)?._id === filterBranchId ||
        area.branchName?.branchName ===
        branchData.find((b) => b._id === filterBranchId)?.branchName

      return matchesSearch && matchesBranch
    })
  }, [areaDatas, searchQuery, filterBranchId, branchData])

  // Pagination computations
  const totalItems = filteredAreas.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages)
  const startIndex = (validCurrentPage - 1) * pageSize

  const paginatedAreas = useMemo(() => {
    return filteredAreas.slice(startIndex, startIndex + pageSize)
  }, [filteredAreas, startIndex, pageSize])

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

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-6 antialiased">
      {/* Top Banner Header matching Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-300 backdrop-blur-md border border-white/10">
              <PiMapPinSimpleAreaFill size={15} />
              <span>Floor & Dining Layouts</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dining Area Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Configure dining floors, rooftop zones, AC halls, and outdoor gardens. Group tables by physical location for seamless order allocation.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-300">Total Sections</p>
              <p className="text-xl font-black text-white">{areaDatas.length}</p>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-red-600/30 backdrop-blur-md border border-red-500/30 text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-red-200">Active Outlets</p>
              <p className="text-xl font-black text-white">{branchData.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-between rounded-2xl p-4 border text-xs font-semibold shadow-xs ${notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
            }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <RiCheckLine size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <RiErrorWarningLine size={18} className="text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <RiCloseLine size={18} />
          </button>
        </motion.div>
      )}

      {/* Main Layout: Form Left, Area List Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Create / Edit Form */}
        <div className="lg:col-span-4 lg:sticky lg:top-4">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
                  <span>{editingArea ? 'Edit Dining Area' : 'Add New Area'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingArea ? 'Update section details below.' : 'Create a new floor section.'}
                </p>
              </div>

              {editingArea && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            {editingArea && (
              <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200/70 p-2.5 text-xs text-amber-900 font-medium">
                <span>
                  Editing: <strong>{editingArea.areaName}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-amber-700 hover:text-amber-900 font-bold text-xs underline cursor-pointer"
                >
                  Reset
                </button>
              </div>
            )}

            <form onSubmit={handleAddOrUpdateArea} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Target Branch *
                </label>
                <select
                  required
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 transition cursor-pointer"
                >
                  <option value="" disabled>
                    -- Select Target Branch --
                  </option>
                  {branchData.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.branchName} ({branch.branchCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Area / Floor Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1st Floor, Rooftop AC, Garden"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-red-900/20 transition disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {loading
                    ? editingArea
                      ? 'Updating Section...'
                      : 'Creating Section...'
                    : editingArea
                      ? 'Update Section'
                      : 'Create Dining Area'}
                </button>
                {editingArea && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Branch Filter Tabs, View Switcher & Areas */}
        <div className="lg:col-span-8 space-y-4">
          {/* Controls Bar: Branch Filter Pills + Search + View Switcher */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
            {/* Top row: Branch Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1.5 shrink-0 flex items-center gap-1">
                <FiLayers size={13} className="text-red-600" />
                <span>Branch:</span>
              </span>
              <button
                type="button"
                onClick={() => setFilterBranchId('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${filterBranchId === 'ALL'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                All Branches ({areaDatas.length})
              </button>
              {branchData.map((b) => {
                const count = areaDatas.filter(
                  (a) =>
                    (a.branchName as any)?._id === b._id ||
                    a.branchName?.branchName === b.branchName
                ).length
                return (
                  <button
                    key={b._id}
                    type="button"
                    onClick={() => setFilterBranchId(b._id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${filterBranchId === b._id
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {b.branchName} ({count})
                  </button>
                )
              })}
            </div>

            <div className="border-t border-slate-100 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <RiSearchLine size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search dining area name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 transition"
                />
              </div>

              {/* View Switcher & Page size */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${viewMode === 'grid'
                        ? 'bg-white text-red-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                      }`}
                    title="Grid View"
                  >
                    <RiGridFill size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${viewMode === 'table'
                        ? 'bg-white text-red-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                      }`}
                    title="Table View"
                  >
                    <RiListCheck2 size={15} />
                  </button>
                </div>

                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value={6}>6 / page</option>
                  <option value={8}>8 / page</option>
                  <option value={12}>12 / page</option>
                  <option value={20}>20 / page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Area List / Cards */}
          {fetching ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-36 rounded-2xl bg-white border border-slate-200/80 p-5 animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                  <div className="h-8 bg-slate-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : filteredAreas.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-2">
              <PiMapPinSimpleAreaFill size={36} className="mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No dining areas match your selection</p>
              <p className="text-xs text-slate-400">
                {searchQuery ? 'Try clearing your search query.' : 'Use the form on the left to create a section.'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Modern Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paginatedAreas.map((area) => {
                const isEditing = editingArea?._id === area._id
                return (
                  <div
                    key={area._id}
                    className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition duration-200 hover:shadow-md ${isEditing
                        ? 'border-red-500 ring-2 ring-red-200'
                        : 'border-slate-200/90 hover:border-red-300'
                      }`}
                  >
                    <div>
                      {/* Top Row: Icon + Title + Status */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 font-bold shrink-0">
                            <PiMapPinSimpleAreaFill size={20} />
                          </div>
                          <div className="truncate">
                            <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-red-600 transition truncate">
                              {area.areaName}
                            </h3>
                          </div>
                        </div>

                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60 shrink-0">
                          Active
                        </span>
                      </div>

                      {/* Branch Info Row */}
                      <div className="rounded-xl bg-slate-50/80 p-2.5 border border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500 min-w-0">
                          <RiBuildingLine size={14} className="text-slate-400 shrink-0" />
                          <span className="text-[11px] truncate">
                            {area.branchName?.branchName || 'Unassigned'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Floor Section
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(area)}
                          title="Edit Area"
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition cursor-pointer text-xs font-bold"
                        >
                          <RiEditLine size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteModalArea(area)}
                          title="Delete Area"
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition cursor-pointer text-xs font-bold"
                        >
                          <RiDeleteBinLine size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Modern Data Table View */
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[10px] uppercase font-extrabold tracking-wider text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Section Name</th>
                    <th className="py-3 px-4">Assigned Branch</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAreas.map((area) => (
                    <tr key={area._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                            <PiMapPinSimpleAreaFill size={15} />
                          </div>
                          <span className="font-bold text-slate-900">{area.areaName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="inline-flex items-center gap-1">
                          <RiBuildingLine size={13} className="text-slate-400" />
                          <span>{area.branchName?.branchName || 'Unassigned'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleStartEdit(area)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Edit Section"
                          >
                            <RiEditLine size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteModalArea(area)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Section"
                          >
                            <RiDeleteBinLine size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-xs">
              <div className="text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-900">{startIndex + 1}</span> to{' '}
                <span className="font-bold text-slate-900">{Math.min(startIndex + pageSize, totalItems)}</span> of{' '}
                <span className="font-bold text-slate-900">{totalItems}</span> sections
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={validCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="First Page"
                >
                  <FiChevronsLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={validCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Previous Page"
                >
                  <FiChevronLeft size={15} />
                </button>

                {pageNumbers.map((p, idx) =>
                  typeof p === 'number' ? (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${validCurrentPage === p
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

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={validCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Next Page"
                >
                  <FiChevronRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={validCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Last Page"
                >
                  <FiChevronsRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalArea && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 shrink-0">
                  <RiDeleteBinLine size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Dining Area</h3>
                  <p className="text-xs text-slate-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete area{' '}
                <strong className="text-slate-900">"{deleteModalArea.areaName}"</strong>?
                Please ensure no active tables are assigned to this dining area.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={() => setDeleteModalArea(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={handleDeleteArea}
                  className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-red-900/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {deleteLoading ? 'Deleting...' : 'Yes, Delete Area'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}