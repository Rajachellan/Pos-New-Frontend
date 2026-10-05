"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { AxiosError } from 'axios'
import api from '../../services/api'
import {
  RiUserLine,
  RiUser3Line,
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiSearchLine,
  RiEyeLine,
  RiEyeOffLine,
  RiShieldStarLine,
  RiBriefcaseLine,
  RiStore2Line,
  RiBuildingLine,
  RiLockPasswordLine,
  RiArrowLeftLine,
  RiRefreshLine,
  RiGlobalLine,
  RiFilter3Line,
  RiCloseLine,
  RiMailLine,
  RiShieldCheckLine,
} from 'react-icons/ri'

interface Branch {
  _id: string
  branchName?: string
  branchCode: string
  address?: string
}

interface UserItem {
  _id: string
  name: string
  username?: string
  email: string
  systemRole: string
  organizationRole: string
  department?: string
  status: string
  branch?: {
    _id: string
    branchName?: string
    branchCode?: string
  } | null
  organization?: {
    _id: string
    name: string
  } | null
  createdAt?: string
}

export default function UserManagementPage() {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  // Form State
  const [username, setUsername] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [role, setRole] = useState<'Admin' | 'Manager' | 'Staff'>('Staff')
  const [branch, setBranch] = useState<string>('')
  const [isActive, setIsActive] = useState<boolean>(true)
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)

  // Data & UI State
  const [users, setUsers] = useState<UserItem[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [fetching, setFetching] = useState<boolean>(true)

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [branchFilter, setBranchFilter] = useState<string>('ALL')

  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(() => {
      setNotification(null)
    }, 5000)
    return () => clearTimeout(timer)
  }, [notification])

  // Fetch users & branches
  async function fetchUsers() {
    setFetching(true)
    try {
      const res = await api.get('/users')
      setUsers(res.data.data || [])
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setFetching(false)
    }
  }

  async function fetchBranches() {
    try {
      const res = await api.get('/get/branch')
      setBranches(res.data.data || [])
    } catch (err) {
      console.error('Failed to fetch branches:', err)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchBranches()
  }, [])

  function resetForm() {
    setUsername('')
    setEmail('')
    setRole('Staff')
    setBranch('')
    setIsActive(true)
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setEditingUserId(null)
  }

  function handleOpenCreate() {
    resetForm()
    setViewMode('form')
    setNotification(null)
  }

  function handleOpenEdit(user: UserItem) {
    setEditingUserId(user._id)
    setUsername(user.username || user.name || '')
    setEmail(user.email || '')

    // Normalize role display: 3 roles only (Admin, Manager, Staff)
    const currentRole = (user.organizationRole || 'STAFF').toUpperCase()
    if (currentRole === 'ADMIN' || currentRole === 'OWNER' || user.systemRole === 'SUPER_ADMIN') {
      setRole('Admin')
    } else if (currentRole === 'MANAGER') {
      setRole('Manager')
    } else {
      setRole('Staff')
    }

    setBranch(user.branch?._id || '')
    setIsActive(user.status === 'ACTIVE')
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setViewMode('form')
    setNotification(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setNotification(null)

    if (password && confirmPassword && password !== confirmPassword) {
      setNotification({
        type: 'error',
        message: 'Passwords do not match.',
      })
      setLoading(false)
      return
    }

    try {
      if (editingUserId) {
        // Update user
        const res = await api.put(`/users/${editingUserId}`, {
          username: username.trim(),
          name: username.trim(),
          email: email.trim().toLowerCase(),
          role,
          organizationRole: role.toUpperCase(),
          branch: branch || null,
          isActive,
          password: password ? password.trim() : undefined,
        })
        setNotification({
          type: 'success',
          message: res.data.message || 'User details updated successfully!',
        })
      } else {
        // Create user
        const res = await api.post('/user/register', {
          username: username.trim(),
          name: username.trim(),
          email: email.trim().toLowerCase(),
          role,
          organizationRole: role.toUpperCase(),
          branch: branch || null,
          isActive,
          password: password.trim() || undefined,
          confirmPassword: confirmPassword.trim() || undefined,
        })
        setNotification({
          type: 'success',
          message: res.data.message || 'User registered successfully! Default password is defaultpassword123',
        })
      }

      resetForm()
      setViewMode('list')
      fetchUsers()
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>
      setNotification({
        type: 'error',
        message:
          error.response?.data?.message ||
          error.message ||
          'Operation failed. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(userId: string, name: string) {
    if (!window.confirm(`Are you sure you want to deactivate or remove user "${name}"?`)) {
      return
    }

    try {
      await api.delete(`/users/${userId}`)
      setNotification({
        type: 'success',
        message: `User "${name}" has been removed/deactivated.`,
      })
      fetchUsers()
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete user.',
      })
    }
  }

  // Quick statistics calculation
  const stats = useMemo(() => {
    let admins = 0
    let managers = 0
    let staff = 0

    users.forEach((u) => {
      const r = (u.organizationRole || '').toUpperCase()
      if (r === 'ADMIN' || r === 'OWNER' || u.systemRole === 'SUPER_ADMIN') {
        admins++
      } else if (r === 'MANAGER') {
        managers++
      } else {
        staff++
      }
    })

    return {
      total: users.length,
      admins,
      managers,
      staff,
    }
  }, [users])

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.organizationRole && u.organizationRole.toLowerCase().includes(q)) ||
        (u.branch?.branchName && u.branch.branchName.toLowerCase().includes(q)) ||
        (u.branch?.branchCode && u.branch.branchCode.toLowerCase().includes(q))

      const currentRole = (u.organizationRole || '').toUpperCase()
      const isUserAdmin = currentRole === 'ADMIN' || currentRole === 'OWNER' || u.systemRole === 'SUPER_ADMIN'
      const isUserManager = currentRole === 'MANAGER'
      const isUserStaff = !isUserAdmin && !isUserManager

      const matchesRole =
        roleFilter === 'ALL' ||
        (roleFilter === 'ADMIN' && isUserAdmin) ||
        (roleFilter === 'MANAGER' && isUserManager) ||
        (roleFilter === 'STAFF' && isUserStaff)

      const matchesBranch =
        branchFilter === 'ALL' ||
        (branchFilter === 'UNASSIGNED' && !u.branch?._id) ||
        u.branch?._id === branchFilter

      return matchesSearch && matchesRole && matchesBranch
    })
  }, [users, searchQuery, roleFilter, branchFilter])

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3.5 border shadow-sm text-xs font-semibold transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-50/90 text-emerald-900 border-emerald-200'
              : 'bg-rose-50/90 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
                <RiCheckLine size={16} />
              </span>
            ) : (
              <span className="p-1 rounded-lg bg-rose-100 text-rose-700">
                <RiErrorWarningLine size={16} />
              </span>
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-black/5 transition"
          >
            <RiCloseLine size={16} />
          </button>
        </div>
      )}

      {/* VIEW MODE 1: USER LIST */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Access & Workforce
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                  {users.length} Registered
                </span>
              </div>
              <h1 className="mt-1 text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                User Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage staff credentials, access roles, and branch assignments.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={fetchUsers}
                disabled={fetching}
                title="Refresh user list"
                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-600 rounded-xl transition shadow-xs disabled:opacity-50"
              >
                <RiRefreshLine size={18} className={fetching ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={handleOpenCreate}
                className="bg-red-600 hover:bg-red-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm shadow-red-600/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <RiAddLine size={18} />
                <span>Add New User</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Users */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                <RiUser3Line size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Users</p>
                <h3 className="text-xl font-extrabold text-slate-900">{stats.total}</h3>
              </div>
            </div>

            {/* Admins */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <RiShieldStarLine size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Admins</p>
                <h3 className="text-xl font-extrabold text-slate-900">{stats.admins}</h3>
              </div>
            </div>

            {/* Managers */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <RiBriefcaseLine size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Managers</p>
                <h3 className="text-xl font-extrabold text-slate-900">{stats.managers}</h3>
              </div>
            </div>

            {/* Staff */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <RiStore2Line size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Staff</p>
                <h3 className="text-xl font-extrabold text-slate-900">{stats.staff}</h3>
              </div>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="relative w-full md:w-80">
              <RiSearchLine size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search username, email, or role..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <RiCloseLine size={14} />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Role Filter */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer text-xs"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">Admins Only</option>
                  <option value="MANAGER">Managers Only</option>
                  <option value="STAFF">Staff Only</option>
                </select>
              </div>

              {/* Branch Filter */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Branch:</span>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer text-xs max-w-[140px] truncate"
                >
                  <option value="ALL">All Branches</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.branchName || b.branchCode}
                    </option>
                  ))}
                  <option value="UNASSIGNED">Unassigned</option>
                </select>
              </div>

              {(searchQuery || roleFilter !== 'ALL' || branchFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setRoleFilter('ALL')
                    setBranchFilter('ALL')
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      User
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Role & Permissions
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Assigned Branch / Outlet
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fetching ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400 text-xs font-semibold">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RiRefreshLine size={24} className="animate-spin text-red-500" />
                          <span>Loading users...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                            <RiUserLine size={24} />
                          </div>
                          <p className="text-sm font-bold text-slate-700">No users found</p>
                          <p className="text-xs text-slate-400 max-w-sm">
                            {searchQuery || roleFilter !== 'ALL' || branchFilter !== 'ALL'
                              ? 'Try adjusting your search query or filters to find what you are looking for.'
                              : 'Click "Add New User" to register workforce members.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const initial = (u.username || u.name || 'U').charAt(0).toUpperCase()
                      const isUserActive = u.status === 'ACTIVE'
                      const rawRole = (u.organizationRole || '').toUpperCase()
                      const isUserAdmin = rawRole === 'ADMIN' || rawRole === 'OWNER' || u.systemRole === 'SUPER_ADMIN'
                      const isUserManager = rawRole === 'MANAGER'

                      // Visual Avatar & Role Styling
                      let avatarStyle = 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                      let roleBadge = (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <RiStore2Line size={13} />
                            Staff
                          </span>
                          <p className="text-[10px] text-slate-400 font-medium">Assigned Branch Only</p>
                        </div>
                      )

                      if (isUserAdmin) {
                        avatarStyle = 'bg-gradient-to-br from-rose-500 to-red-600 text-white'
                        roleBadge = (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-rose-50 text-rose-700 border border-rose-200/80">
                              <RiShieldStarLine size={13} />
                              Admin
                            </span>
                            <p className="text-[10px] text-slate-400 font-medium">Full Access & Finances</p>
                          </div>
                        )
                      } else if (isUserManager) {
                        avatarStyle = 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                        roleBadge = (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-blue-50 text-blue-700 border border-blue-200/80">
                              <RiBriefcaseLine size={13} />
                              Manager
                            </span>
                            <p className="text-[10px] text-slate-400 font-medium">Operations (No Finances)</p>
                          </div>
                        )
                      }

                      return (
                        <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                          {/* USER INFO */}
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3.5">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0 ${avatarStyle}`}
                              >
                                {initial}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-sm truncate">
                                  {u.username || u.name}
                                </p>
                                <p className="text-xs text-slate-500 font-normal truncate flex items-center gap-1">
                                  <RiMailLine size={12} className="text-slate-400 shrink-0" />
                                  <span>{u.email}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* ROLE & PERMISSIONS */}
                          <td className="px-6 py-4">{roleBadge}</td>

                          {/* ASSIGNED OUTLET */}
                          <td className="px-6 py-4">
                            {isUserAdmin ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                                  <RiGlobalLine size={14} className="text-rose-500" />
                                  All Branches
                                </span>
                                <p className="text-[10px] text-slate-400">Can switch between any outlet</p>
                              </div>
                            ) : isUserManager ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-800">
                                  <RiGlobalLine size={14} className="text-blue-500" />
                                  All Branches
                                </span>
                                <p className="text-[10px] text-slate-400">Multi-branch operations</p>
                              </div>
                            ) : u.branch?.branchName ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200/80 text-xs font-semibold">
                                  <span>📍 {u.branch.branchName}</span>
                                  {u.branch.branchCode && (
                                    <span className="text-[10px] font-mono text-slate-500">
                                      ({u.branch.branchCode})
                                    </span>
                                  )}
                                </span>
                                <p className="text-[10px] text-slate-400">Locked to this outlet</p>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                                ⚠️ Unassigned Branch
                              </span>
                            )}
                          </td>

                          {/* STATUS */}
                          <td className="px-6 py-4">
                            {isUserActive ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* ACTIONS */}
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(u)}
                                title="Edit user details"
                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl transition cursor-pointer"
                              >
                                <RiEditLine size={16} />
                              </button>
                              {rawRole !== 'OWNER' && (
                                <button
                                  onClick={() => handleDelete(u._id, u.username || u.name)}
                                  title="Deactivate/Delete user"
                                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition cursor-pointer"
                                >
                                  <RiDeleteBinLine size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-6 py-3.5 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing <strong className="text-slate-800">{filteredUsers.length}</strong> of{' '}
                <strong className="text-slate-800">{users.length}</strong> users
              </span>
              <span className="text-[11px] text-slate-400">
                Staff accounts are scoped to their assigned outlet
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: ADD / EDIT USER FORM */}
      {viewMode === 'form' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Back button & Title */}
          <div>
            <button
              onClick={() => {
                resetForm()
                setViewMode('list')
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-3 transition"
            >
              <RiArrowLeftLine size={16} />
              <span>Back to User List</span>
            </button>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {editingUserId ? 'Edit User Profile' : 'Register New User'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {editingUserId
                ? 'Update account credentials, permissions, and assigned outlet.'
                : 'Create login credentials and define operational permissions.'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* STEP 1: ROLE SELECTION CARDS */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Select System Role *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Admin Card */}
                  <div
                    onClick={() => {
                      setRole('Admin')
                      setBranch('')
                    }}
                    className={`cursor-pointer p-4 rounded-xl border transition-all text-left relative ${
                      role === 'Admin'
                        ? 'border-rose-400 bg-rose-50/50 shadow-xs ring-2 ring-rose-200'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                        <RiShieldStarLine size={18} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                        Full
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">Admin</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                      Full access to all outlets, settings, and financial reports.
                    </p>
                  </div>

                  {/* Manager Card */}
                  <div
                    onClick={() => {
                      setRole('Manager')
                      setBranch('')
                    }}
                    className={`cursor-pointer p-4 rounded-xl border transition-all text-left relative ${
                      role === 'Manager'
                        ? 'border-blue-400 bg-blue-50/50 shadow-xs ring-2 ring-blue-200'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <RiBriefcaseLine size={18} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        Ops
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">Manager</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                      Operations across branches. Financial numbers hidden.
                    </p>
                  </div>

                  {/* Staff Card */}
                  <div
                    onClick={() => setRole('Staff')}
                    className={`cursor-pointer p-4 rounded-xl border transition-all text-left relative ${
                      role === 'Staff'
                        ? 'border-emerald-400 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-200'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <RiStore2Line size={18} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                        POS
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">Staff</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                      Restricted strictly to assigned outlet. POS & tables only.
                    </p>
                  </div>
                </div>
              </div>

              {/* USERNAME & EMAIL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Username *</label>
                  <div className="relative">
                    <RiUserLine size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. arun"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Email Address *</label>
                  <div className="relative">
                    <RiMailLine size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. arun@restaurant.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 transition"
                    />
                  </div>
                </div>
              </div>

              {/* ASSIGNED BRANCH */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Assigned Outlet {role === 'Staff' && <span className="text-red-500">*</span>}
                  </label>
                  {role === 'Staff' ? (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Required for Staff
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400">
                      Global Access by Default
                    </span>
                  )}
                </div>
                <div className="relative">
                  <RiBuildingLine size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    required={role === 'Staff'}
                    className={`w-full pl-9 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 transition ${
                      role === 'Staff' && !branch ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
                    }`}
                  >
                    <option value="">
                      {role === 'Admin'
                        ? '🌐 All Branches (Full Unrestricted Access)'
                        : role === 'Manager'
                        ? '🌐 All Branches (Multi-Branch Operations)'
                        : '--------- Select Assigned Branch (Required) ---------'}
                    </option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        📍 {b.branchName ? `${b.branchName} (${b.branchCode})` : b.branchCode}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-slate-500">
                  {role === 'Staff'
                    ? 'Staff will be automatically locked to this specific outlet when logging in.'
                    : 'Admins and Managers can switch between all active outlets via the top navigation bar.'}
                </p>
              </div>

              {/* PASSWORD & CONFIRM PASSWORD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <div className="relative">
                    <RiLockPasswordLine size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={editingUserId ? 'Leave blank to keep current' : 'defaultpassword123'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {!editingUserId && 'Defaults to defaultpassword123 if left empty.'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Confirm Password</label>
                  <div className="relative">
                    <RiLockPasswordLine size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 transition"
                    />
                  </div>
                </div>
              </div>

              {/* ACTIVE CHECKBOX */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Account Status: Active
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Active users can sign in and perform actions according to their role.
                    </span>
                  </div>
                </label>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm shadow-red-600/25 transition active:scale-98 disabled:opacity-50 cursor-pointer text-center"
                >
                  {loading
                    ? 'Saving...'
                    : editingUserId
                    ? 'Update User Details'
                    : 'Save & Register User'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm()
                    setViewMode('list')
                  }}
                  className="sm:w-32 bg-slate-100 text-slate-600 hover:bg-slate-200 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-center transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}