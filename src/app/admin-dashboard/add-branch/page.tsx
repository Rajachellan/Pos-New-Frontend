"use client"

import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { AxiosError } from 'axios'
import { FaCodeBranch } from 'react-icons/fa'
import {
  RiBuildingLine,
  RiMapPinLine,
  RiSearchLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiEditLine,
  RiDeleteBinLine,
  RiShieldCheckLine,
  RiSaveLine,
  RiUserStarLine,
  RiStore2Line,
  RiMailLine,
  RiPhoneLine,
  RiFileTextLine,
  RiCloseLine,
} from 'react-icons/ri'
import { useAuth } from '@/src/app/context/AuthContext'

interface Branch {
  _id: string
  branchName: string
  branchCode: string
  address: string
  isActive?: boolean
  createdAt?: string
}

interface OrganizationData {
  _id: string
  name: string
  slug?: string
  legalName?: string
  email?: string
  phno?: string
  address?: string
  gstNumber?: string
  status?: string
  owner?: {
    _id: string
    name: string
    email: string
    username?: string
  }
}

function BranchesPage() {
  const { refreshAuthUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'branches' | 'organization'>('branches')

  // Branch states
  const [branchName, setBranchName] = useState<string>('')
  const [branchCode, setBranchCode] = useState<string>('')
  const [address, setAddress] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [fetching, setFetching] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Branch Edit and Delete states
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [deleteModalBranch, setDeleteModalBranch] = useState<Branch | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)

  // Organization Profile states
  const [orgData, setOrgData] = useState<OrganizationData | null>(null)
  const [orgLoading, setOrgLoading] = useState<boolean>(false)
  const [orgSaving, setOrgSaving] = useState<boolean>(false)
  const [orgForm, setOrgForm] = useState({
    name: '',
    legalName: '',
    email: '',
    phno: '',
    address: '',
    gstNumber: '',
  })

  async function fetchBranches() {
    setFetching(true)
    try {
      const res = await api.get('/get/branch')
      setBranches(res.data.data || [])
    } catch (err) {
      console.error('Failed to fetch branches', err)
    } finally {
      setFetching(false)
    }
  }

  async function fetchOrgProfile() {
    setOrgLoading(true)
    try {
      const res = await api.get('/organizations/profile')
      if (res.data?.success && res.data.data?.organization) {
        const org = res.data.data.organization
        setOrgData(org)
        setOrgForm({
          name: org.name || '',
          legalName: org.legalName || '',
          email: org.email || '',
          phno: org.phno || '',
          address: org.address || '',
          gstNumber: org.gstNumber || '',
        })
      }
    } catch (err) {
      console.error('Failed to fetch organization profile', err)
    } finally {
      setOrgLoading(false)
    }
  }

  useEffect(() => {
    fetchBranches()
    fetchOrgProfile()
  }, [])

  function handleStartEdit(branch: Branch) {
    setActiveTab('branches')
    setEditingBranch(branch)
    setBranchName(branch.branchName)
    setBranchCode(branch.branchCode)
    setAddress(branch.address || '')
    setNotification(null)

    // Smooth scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancelEdit() {
    setEditingBranch(null)
    setBranchName('')
    setBranchCode('')
    setAddress('')
  }

  async function handleAddOrUpdateBranch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setNotification(null)

    try {
      if (editingBranch) {
        const res = await api.put(`/branch/${editingBranch._id}`, {
          branchName,
          branchCode,
          address,
        })
        setNotification({
          type: 'success',
          message: res.data.message || `Branch "${branchName}" updated successfully!`,
        })
        handleCancelEdit()
      } else {
        const res = await api.post('/add/branch', { branchName, branchCode, address })
        setNotification({
          type: 'success',
          message: res.data.message || `Branch "${branchName}" added successfully!`,
        })
        setBranchName('')
        setBranchCode('')
        setAddress('')
      }
      fetchBranches()
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>
      setNotification({
        type: 'error',
        message:
          error.response?.data?.message ||
          error.message ||
          'Failed to process branch. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteBranch() {
    if (!deleteModalBranch) return
    setDeleteLoading(true)
    try {
      const res = await api.delete(`/branch/${deleteModalBranch._id}`)
      setNotification({
        type: 'success',
        message: res.data.message || 'Branch removed/deactivated successfully!',
      })
      if (editingBranch?._id === deleteModalBranch._id) {
        handleCancelEdit()
      }
      setDeleteModalBranch(null)
      fetchBranches()
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>
      setNotification({
        type: 'error',
        message:
          error.response?.data?.message ||
          error.message ||
          'Failed to delete branch.',
      })
      setDeleteModalBranch(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleUpdateOrgProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!orgForm.name.trim()) {
      setNotification({ type: 'error', message: 'Organization name cannot be empty.' })
      return
    }

    setOrgSaving(true)
    setNotification(null)

    try {
      const res = await api.put('/organizations/settings', orgForm)
      if (res.data?.success) {
        setNotification({
          type: 'success',
          message: `Organization "${orgForm.name}" updated successfully! Header brand name has been synchronized.`,
        })
        await refreshAuthUser()
        await fetchOrgProfile()
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update organization profile.',
      })
    } finally {
      setOrgSaving(false)
    }
  }

  const filteredBranches = branches.filter(
    (b) =>
      b.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.branchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-300 backdrop-blur-md border border-white/10">
              <FaCodeBranch size={13} />
              <span>Locations & Corporate Brand</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Branch & Organization Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Configure hotel branches, outlet codes, and update your official Organization business profile, legal identity, and GST details.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-300">Active Branches</p>
              <p className="text-xl font-black text-white">{branches.length}</p>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-red-600/30 backdrop-blur-md border border-red-500/30 text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-red-200">Organization</p>
              <p className="text-sm font-black text-white truncate max-w-[140px]">
                {orgData?.name || 'TANJAVOOR'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveTab('branches')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'branches'
              ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
          }`}
        >
          <FaCodeBranch size={14} />
          <span>Branches & Outlets ({branches.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('organization')
            if (!orgData) fetchOrgProfile()
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'organization'
              ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
          }`}
        >
          <RiBuildingLine size={16} />
          <span>Organization & Brand Profile</span>
          <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-extrabold">
            Brand Settings
          </span>
        </button>
      </div>

      {/* Alert Notification Toast */}
      {notification && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 border text-xs font-semibold shadow-xs ${
            notification.type === 'success'
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
        </div>
      )}

      {/* TAB 1: BRANCHES & OUTLETS */}
      {activeTab === 'branches' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Creation / Edit Form - Sticky column */}
          <div className="lg:col-span-5 lg:sticky lg:top-6 lg:self-start">
            <div className={`rounded-3xl border bg-white p-6 lg:p-8 shadow-xs space-y-6 ${
              editingBranch ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200/80'
            }`}>
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${editingBranch ? 'bg-amber-500 animate-pulse' : 'bg-red-600'}`} />
                    <span>{editingBranch ? 'Edit Hotel Branch' : 'Add New Branch'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {editingBranch
                      ? 'Update branch name, identifier code, or address below.'
                      : 'Enter official details to onboard a new location node.'}
                  </p>
                </div>
                {editingBranch && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {editingBranch && (
                <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200/70 px-3.5 py-2.5 text-xs text-amber-900 font-medium">
                  <div>
                    <span>Editing: <strong>{editingBranch.branchName}</strong></span>
                    <p className="text-[11px] text-amber-700 font-mono mt-0.5">Code: {editingBranch.branchCode}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-amber-800 hover:text-amber-950 font-bold text-xs underline cursor-pointer"
                  >
                    Reset Form
                  </button>
                </div>
              )}

              <form onSubmit={handleAddOrUpdateBranch} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanjavoor Hotel - Main Branch"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Displays on floor layouts, KOT tickets, and receipts.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Branch Identifier Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HQ01, BR-02"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs uppercase font-mono tracking-wider text-slate-800 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Full Physical Address *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. 37-1-160(64), Islampeta 2nd Line, Main Road"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-red-900/20 hover:from-red-700 hover:to-rose-700 transition disabled:opacity-50 cursor-pointer"
                  >
                    {loading
                      ? editingBranch
                        ? "Saving Changes..."
                        : "Registering Branch..."
                      : editingBranch
                      ? "Update Branch Details"
                      : "Register Branch"}
                  </button>
                  {editingBranch && (
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
          </div>

          {/* Branch List */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Active Branches ({branches.length})</h2>
                <p className="text-xs text-slate-500">
                  Click <strong className="text-red-600">"Edit Branch"</strong> on any card to update its name or address.
                </p>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <RiSearchLine size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search branch or code..."
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
                    className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition duration-200 hover:shadow-md ${
                      editingBranch?._id === branch._id
                        ? "border-red-500 ring-2 ring-red-200 bg-red-50/20"
                        : "border-slate-200/80 hover:border-red-200"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 font-bold shrink-0">
                            <RiBuildingLine size={20} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition">
                              {branch.branchName}
                            </h3>
                            <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-600 mt-0.5">
                              CODE: {branch.branchCode}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border shrink-0 ${
                            branch.isActive !== false
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {branch.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="flex items-start gap-2 pt-2 text-xs text-slate-500">
                        <RiMapPinLine size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                        <p className="line-clamp-2 leading-relaxed text-slate-600 text-[11px]">
                          {branch.address || 'No address specified'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span className="font-mono text-[10px]">ID: {branch._id.slice(-6)}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(branch)}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-slate-700 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition font-bold text-xs cursor-pointer"
                        >
                          <RiEditLine size={14} className="text-red-600" />
                          <span>Edit Branch</span>
                        </button>
                        <button
                          onClick={() => setDeleteModalBranch(branch)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-slate-400 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition font-medium text-xs cursor-pointer"
                        >
                          <RiDeleteBinLine size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ORGANIZATION & BRAND PROFILE */}
      {activeTab === 'organization' && (
        <div className="space-y-6">
          {orgLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-xs font-medium text-slate-400">
              Loading organization details...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Organization Overview Sidebar */}
              <div className="lg:col-span-4 space-y-5">
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white font-black text-xl shadow-md shadow-red-900/20">
                      {orgForm.name.slice(0, 1).toUpperCase() || 'T'}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 leading-tight">
                        {orgForm.name || 'TANJAVOOR'}
                      </h2>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1">
                        TENANT {orgData?.status || 'ACTIVE'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Tenant ID:</span>
                      <span className="font-mono text-[11px] text-slate-800">{orgData?._id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Slug URL:</span>
                      <span className="font-mono text-[11px] text-slate-800">{orgData?.slug || 'tanjavoor'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Total Outlets:</span>
                      <span className="font-bold text-slate-800">{branches.length} Branches</span>
                    </div>
                    {orgData?.owner && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-slate-400 font-medium">Account Owner:</span>
                        <span className="font-bold text-slate-800">{orgData.owner.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl bg-amber-50 border border-amber-200/80 p-5 space-y-2 text-xs text-amber-900">
                  <p className="font-bold flex items-center gap-1.5 text-amber-800">
                    <RiShieldCheckLine size={16} />
                    <span>Real-Time Brand Synchronization</span>
                  </p>
                  <p className="text-[11px] text-amber-800/90 leading-relaxed">
                    Updating the Organization Name here immediately updates the main Admin Console top banner, invoice footers, and POS receipts across all branch terminals.
                  </p>
                </div>
              </div>

              {/* Organization Profile Edit Form */}
              <div className="lg:col-span-8">
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <RiBuildingLine className="text-red-600" />
                      <span>Edit Organization & Business Profile</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Update your brand name, legal entity registration, official email, and GST details.
                    </p>
                  </div>

                  <form onSubmit={handleUpdateOrgProfile} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Organization / Brand Name */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                          Organization / Brand Name *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="e.g. TANJAVOOR"
                            value={orgForm.name}
                            onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-bold text-slate-800 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Displayed at the top of the Admin Console and POS terminal.
                        </p>
                      </div>

                      {/* Legal Business Name */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                          Legal Entity / Trade Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Tanjavoor Hospitality Pvt Ltd"
                          value={orgForm.legalName}
                          onChange={(e) => setOrgForm({ ...orgForm, legalName: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition font-medium"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Printed on tax invoices and legal compliance documents.
                        </p>
                      </div>

                      {/* Official Business Email */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                          Official Contact Email
                        </label>
                        <div className="relative">
                          <RiMailLine className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                          <input
                            type="email"
                            placeholder="e.g. contact@tanjavoor.com"
                            value={orgForm.email}
                            onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-xs text-slate-800 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition font-medium"
                          />
                        </div>
                      </div>

                      {/* Official Business Phone */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                          Official Phone Number
                        </label>
                        <div className="relative">
                          <RiPhoneLine className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                          <input
                            type="text"
                            placeholder="e.g. +91 9876543210"
                            value={orgForm.phno}
                            onChange={(e) => setOrgForm({ ...orgForm, phno: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-xs text-slate-800 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition font-medium"
                          />
                        </div>
                      </div>

                      {/* GST / Tax ID */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                          GSTIN / Tax Identification
                        </label>
                        <div className="relative">
                          <RiFileTextLine className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                          <input
                            type="text"
                            placeholder="e.g. 33AAAAA0000A1Z5"
                            value={orgForm.gstNumber}
                            onChange={(e) => setOrgForm({ ...orgForm, gstNumber: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-xs uppercase font-mono text-slate-800 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition font-bold"
                          />
                        </div>
                      </div>

                      {/* Registered Headquarters Address */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                          Registered Headquarters Address
                        </label>
                        <textarea
                          rows={3}
                          placeholder="e.g. 37-1-160(64), Islampeta 2nd Line, Main Road"
                          value={orgForm.address}
                          onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition resize-none"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                      <button
                        type="submit"
                        disabled={orgSaving}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-red-900/20 hover:from-red-700 hover:to-rose-700 transition disabled:opacity-50 cursor-pointer"
                      >
                        <RiSaveLine size={16} />
                        <span>{orgSaving ? 'Saving Profile...' : 'Save Organization Details'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <RiDeleteBinLine size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Remove Branch</h3>
                <p className="text-xs text-slate-500">Deactivation or deletion</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove or deactivate branch{' '}
              <strong className="text-slate-900">"{deleteModalBranch.branchName}"</strong> ({deleteModalBranch.branchCode})?
              If areas or tables are tied to this branch, it will be safely deactivated.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeleteModalBranch(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteBranch}
                className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-red-900/20 transition disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? "Processing..." : "Yes, Remove Branch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BranchesPage