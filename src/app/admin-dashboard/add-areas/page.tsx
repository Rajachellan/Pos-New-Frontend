"use client"

import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { AxiosError } from 'axios'
import { PiMapPinSimpleAreaFill } from 'react-icons/pi'
import { RiBuildingLine, RiSearchLine, RiCheckLine, RiErrorWarningLine, RiFilter3Line } from 'react-icons/ri'

interface Branch {
  _id: string
  branchName: string
  branchCode: string
}

interface BranchByName {
  branchName: string
}

interface Area {
  _id: string
  areaName: string
  areaCode: string
  branchName: BranchByName
}

function AddAreasPage() {
  const [branchData, setBranchData] = useState<Branch[]>([])
  const [areaName, setAreaName] = useState<string>('')
  const [areaCode, setAreaCode] = useState<string>('')
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [areaDatas, setAreaDatas] = useState<Area[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterBranchId, setFilterBranchId] = useState<string>('ALL')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function getBranch() {
    try {
      const res = await api.get('/get/branch')
      setBranchData(res.data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function getAreas() {
    try {
      const res = await api.get('/get/area/all')
      setAreaDatas(res.data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    getBranch()
    getAreas()
  }, [])

  async function handleAddArea(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setNotification(null)

    try {
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
      getAreas()
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>
      setNotification({
        type: 'error',
        message:
          error.response?.data?.message ||
          error.message ||
          'Failed to add area. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredAreas = areaDatas.filter((area) => {
    const matchesSearch =
      area.areaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.areaCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (area.branchName?.branchName &&
        area.branchName.branchName.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesBranch =
      filterBranchId === 'ALL' ||
      (area.branchName as any)?._id === filterBranchId ||
      area.branchName?.branchName ===
        branchData.find((b) => b._id === filterBranchId)?.branchName

    return matchesSearch && matchesBranch
  })

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-md shadow-amber-900/20">
            <PiMapPinSimpleAreaFill size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Dining Area Setup
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Configure floor sections, AC halls, rooftops, and outdoor dining areas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-xs font-bold text-amber-800">
            {areaDatas.length} Active Sections
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

      {/* Main Grid: Form Left, Area List Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Creation Form */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200/80 bg-white p-6 lg:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Add Dining Area</h2>
            <p className="text-xs text-slate-500 mt-1">
              Define a new physical zone for layout positioning.
            </p>
          </div>

          <form onSubmit={handleAddArea} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                Target Branch *
              </label>
              <select
                required
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition"
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
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                Area Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rooftop Garden, Main AC Hall"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                Area Identifier Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SEC-A, RT-01"
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-mono uppercase tracking-wider text-slate-800 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-amber-900/20 hover:from-amber-600 hover:to-orange-700 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Adding Area..." : "Create Dining Area"}
            </button>
          </form>
        </div>

        {/* Areas List */}
        <div className="lg:col-span-7 space-y-5">
          {/* Controls: Search & Branch Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Registered Dining Areas</h2>
              <p className="text-xs text-slate-500">Overview of configured dining sections</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-56">
                <RiSearchLine size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search areas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition"
                />
              </div>
            </div>
          </div>

          {filteredAreas.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <PiMapPinSimpleAreaFill size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-700">No dining areas match your query</p>
              <p className="text-[11px] text-slate-400 mt-1">Add new areas using the form on the left</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredAreas.map((area) => (
                <div
                  key={area._id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:shadow-md hover:border-amber-300"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 font-bold">
                          <PiMapPinSimpleAreaFill size={22} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition leading-tight">
                            {area.areaName}
                          </h3>
                          <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-600 mt-1">
                            CODE: {area.areaCode}
                          </span>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                        Active
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-50/70 p-3 border border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <RiBuildingLine size={15} className="text-slate-400" />
                        <span className="text-[11px] font-medium text-slate-600">Branch:</span>
                      </div>
                      <span className="font-bold text-slate-800 text-[11px]">
                        {area.branchName?.branchName || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                    <span>ID: {area._id.slice(-6)}</span>
                    <span className="text-amber-700 font-bold">Configured</span>
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

export default AddAreasPage