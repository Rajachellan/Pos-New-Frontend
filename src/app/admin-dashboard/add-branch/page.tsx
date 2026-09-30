"use client"

import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { AxiosError } from 'axios'
import { FaCodeBranch } from 'react-icons/fa'
import { RiBuildingLine, RiMapPinLine, RiSearchLine, RiCheckLine, RiErrorWarningLine } from 'react-icons/ri'

interface Branch {
  _id: string
  branchName: string
  branchCode: string
  address: string
  createdAt?: string
}

function BranchesPage() {
  const [branchName, setBranchName] = useState<string>('')
  const [branchCode, setBranchCode] = useState<string>('')
  const [address, setAddress] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [fetching, setFetching] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function fetchBranches() {
    setFetching(true)
    try {
      const res = await api.get('/get/branch')
      setBranches(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchBranches()
  }, [])

  async function addBranchFun(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setNotification(null)

    try {
      const res = await api.post('/add/branch', { branchName, branchCode, address })
      setNotification({
        type: 'success',
        message: res.data.message || 'Branch added successfully!',
      })
      setBranchName('')
      setBranchCode('')
      setAddress('')
      fetchBranches()
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>
      setNotification({
        type: 'error',
        message:
          error.response?.data?.message ||
          error.message ||
          'Failed to add branch. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredBranches = branches.filter(
    (b) =>
      b.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.branchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-md shadow-red-900/20">
            <FaCodeBranch size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Branch Management
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Onboard new hotel branches and manage existing location nodes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-red-50 border border-red-200 px-3.5 py-1 text-xs font-bold text-red-700">
            {branches.length} Registered Locations
          </span>
        </div>
      </div>

      {/* Alert Banner */}
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

      {/* Main Grid: Form Left, List Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Creation Form */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200/80 bg-white p-6 lg:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Add New Branch</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter official details for the new hotel or restaurant branch.
            </p>
          </div>

          <form onSubmit={addBranchFun} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                Branch Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Downtown Grand Hotel"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                Branch Identifier Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BR-001"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs uppercase font-mono tracking-wider text-slate-800 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                Full Physical Address *
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. 123 Main Street, Suite 100, City, State"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-red-900/20 hover:from-red-700 hover:to-rose-700 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Creating Branch..." : "Register Branch"}
            </button>
          </form>
        </div>

        {/* Branch List */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Active Branches</h2>
              <p className="text-xs text-slate-500">View and inspect registered hotel locations</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <RiSearchLine size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search branch name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-xs text-slate-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition"
              />
            </div>
          </div>

          {fetching ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-xs font-medium text-slate-400">
              Loading branches...
            </div>
          ) : filteredBranches.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <RiBuildingLine size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-700">No branches found</p>
              <p className="text-[11px] text-slate-400 mt-1">Create your first branch using the form on the left</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredBranches.map((branch) => (
                <div
                  key={branch._id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:shadow-md hover:border-red-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 font-bold">
                          <RiBuildingLine size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition">
                            {branch.branchName}
                          </h3>
                          <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-600 mt-0.5">
                            {branch.branchCode}
                          </span>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                        Active Node
                      </span>
                    </div>

                    <div className="flex items-start gap-2 pt-2 text-xs text-slate-500">
                      <RiMapPinLine size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                      <p className="line-clamp-2 leading-relaxed text-slate-600 text-[11px]">
                        {branch.address}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                    <span>ID: {branch._id.slice(-6)}</span>
                    <span className="text-red-600 font-bold">Operational</span>
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

export default BranchesPage