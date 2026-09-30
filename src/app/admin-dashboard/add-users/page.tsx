"use client"

import React, { useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import api from '../../services/api'
import { RiUserLine, RiShieldUserLine, RiLockPasswordLine, RiMailLine, RiBuildingLine, RiCheckLine, RiErrorWarningLine, RiEyeLine, RiEyeOffLine, RiSearchLine } from 'react-icons/ri'

interface Branch {
  _id: string
  branchName?: string
  branchCode: string
  address?: string
}

function AddUsersPage() {
  const [name, setName] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [role, setRole] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [branch, setBranchName] = useState<string>("")
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [branchData, setBranchData] = useState<Branch[]>([])
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function getBranches() {
    try {
      const res = await api.get('/get/branch')
      setBranchData(res.data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    getBranches()
  }, [])

  async function userRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setNotification(null)

    try {
      const res = await api.post('/user/register', { name, email, role, password, branch })
      setNotification({
        type: 'success',
        message: res.data.message || 'User registered successfully!',
      })
      setName("")
      setEmail("")
      setPassword("")
      setRole("")
      setBranchName("")
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>
      setNotification({
        type: 'error',
        message:
          error.response?.data?.message ||
          error.message ||
          "Registration failed. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-900/20">
            <RiUserLine size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              User & Staff Access Onboarding
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Create credentials and assign access permissions for administrators and branch staff
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-bold text-emerald-800">
            Role-Based Access
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

      {/* Grid: Form & Preview Left, Info Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Registration Form */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200/80 bg-white p-6 lg:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Add Staff Account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Fill in user information to grant access to the system.
            </p>
          </div>

          <form onSubmit={userRegister} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <RiUserLine size={17} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <RiMailLine size={17} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. john.doe@hotel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Account Password *
              </label>
              <div className="relative">
                <RiLockPasswordLine size={17} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Set account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 py-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <RiEyeOffLine size={17} /> : <RiEyeLine size={17} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  User Role *
                </label>
                <div className="relative">
                  <RiShieldUserLine size={17} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <select
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                  >
                    <option value="" disabled>Select Role</option>
                    <option value="Admin">Admin</option>
                    <option value="Staff">Staff / Operator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Assigned Branch *
                </label>
                <div className="relative">
                  <RiBuildingLine size={17} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <select
                    required
                    value={branch}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                  >
                    <option value="" disabled>Select Branch</option>
                    {branchData.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.branchName ? `${b.branchName} (${b.branchCode})` : b.branchCode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-emerald-900/20 hover:from-emerald-700 hover:to-teal-700 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Registering User..." : "Add User Account"}
            </button>
          </form>
        </div>

        {/* User Card Preview & Security Summary */}
        <div className="lg:col-span-6 space-y-6">
          {/* Visual User Card Preview */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                User Access Profile Card Preview
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                {role || "SELECT ROLE"}
              </span>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-xl font-bold text-white shadow-md">
                {name ? name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {name || "User Name"}
                </h3>
                <p className="text-xs text-slate-500">{email || "user.email@example.com"}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-600">
                    Role: {role || "Pending"}
                  </span>
                  <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Active Account
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Role Access Matrix Info */}
          <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 text-white shadow-xl space-y-4">
            <div className="flex items-center gap-2.5">
              <RiShieldUserLine size={20} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white">System Security & Permissions</h3>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="font-bold text-emerald-400">• Admin Role:</span>
                <span>Access to all branch configurations, areas, tables, users, and financial reports.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-emerald-400">• Staff Role:</span>
                <span>Access to POS floor view, table order entry, order status updates, and kitchen screens.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddUsersPage