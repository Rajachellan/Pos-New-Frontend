"use client"

import React, { useState } from 'react'
import api from '../../services/api'
import { AxiosError } from 'axios'
import { FaCodeBranch } from 'react-icons/fa'

function Branches() {
  const [branchName, setBranchName] = useState<string>('')
  const [branchCode, setBranchCode] = useState<string>('')
  const [address, setAddress] = useState<string>('')
  const [loading, setLoading] = useState(false)

  async function addBranchFun(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/add/branch', { branchName, branchCode, address })
      alert(res.data.message)
      setBranchName('')
      setBranchCode('')
      setAddress('')
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>
      alert(
        error.response?.data?.message ||
        error.message ||
        "Failed to add branch. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-red-100 pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white shadow-md">
          <FaCodeBranch size={24} />
        </div>
        <div>
          <h1 className="font-playfair text-2xl font-bold text-gray-900">Add New Branch</h1>
          <p className="text-xs text-gray-500">Onboard new hotel location or restaurant branch</p>
        </div>
      </div>

      <div className="bg-white p-6 lg:p-8 rounded-2xl border border-red-100 shadow-sm">
        <form onSubmit={addBranchFun} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                Branch Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Downtown Grand Hotel"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-red-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                Branch Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BR-001"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-red-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
              Full Address
            </label>
            <textarea
              rows={4}
              required
              placeholder="e.g. 123 Main Street, Suite 100, City, State"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-red-500 focus:outline-none transition"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#9b1c1c] py-3.5 text-sm font-semibold text-white transition hover:bg-[#e02424] shadow-md disabled:opacity-50"
          >
            {loading ? "Creating Branch..." : "Add Branch"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Branches