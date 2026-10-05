"use client"

import React, { useEffect, useState } from 'react'
import api from '../../../services/api'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  FiArrowLeft,
  FiRefreshCw,
  FiSearch,
  FiCalendar,
  FiUser,
  FiPhone,
  FiCheckCircle,
  FiClock
} from 'react-icons/fi'
import { MdHotel, MdMeetingRoom } from 'react-icons/md'

interface RoomBookingHistory {
  _id: string
  room?: {
    number: string
    roomType: string
    pricePerNight: number
  }
  guestName: string
  guestPhone?: string
  checkInAt: string
  checkOutAt?: string
  roomCost: number
  serviceChargeTotal: number
  totalAmount: number
  paymentMethod?: string
  status: string
}

export default function RoomHistoryPage() {
  const [history, setHistory] = useState<RoomBookingHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function fetchHistory() {
    try {
      setLoading(true)
      const res = await api.get('/rooms/history')
      if (res?.data?.data) {
        setHistory(res.data.data)
      }
    } catch (err) {
      console.error('Failed to load room history', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const filteredHistory = history.filter((b) => {
    return (
      search === '' ||
      b.guestName.toLowerCase().includes(search.toLowerCase()) ||
      b.room?.number?.toLowerCase().includes(search.toLowerCase()) ||
      (b.guestPhone && b.guestPhone.includes(search))
    )
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-slate-50/50 min-h-screen">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/user-dashboard/rooms"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-[#e02424] transition shadow-xs"
          >
            <FiArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              Room Stay History
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Completed guest bookings, stays, and total bills settled.
            </p>
          </div>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs w-fit"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh History
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs max-w-md">
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Guest Name, Room #, Phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:bg-white border border-slate-200"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <FiRefreshCw className="animate-spin text-2xl mx-auto mb-2 text-[#e02424]" />
            <p className="text-sm font-medium">Loading room stay records...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <MdHotel className="text-4xl mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No completed room stays recorded yet</p>
            <p className="text-xs text-slate-400">Checked-out bookings will automatically appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-4 px-6">Room</th>
                  <th className="py-4 px-6">Guest Info</th>
                  <th className="py-4 px-6">Check In</th>
                  <th className="py-4 px-6">Check Out</th>
                  <th className="py-4 px-6">Room Tariff</th>
                  <th className="py-4 px-6">Room Service</th>
                  <th className="py-4 px-6">Total Settled</th>
                  <th className="py-4 px-6">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                        Room {item.room?.number || 'N/A'}
                      </span>
                      <span className="block text-[10px] font-normal text-slate-400 mt-1">
                        {item.room?.roomType || 'Standard'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-black text-slate-900">{item.guestName}</p>
                      {item.guestPhone && (
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{item.guestPhone}</p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {new Date(item.checkInAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {item.checkOutAt ? new Date(item.checkOutAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-700">
                      ₹{(item.roomCost || 0).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-700">
                      ₹{(item.serviceChargeTotal || 0).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 font-black text-sm text-[#e02424]">
                      ₹{(item.totalAmount || 0).toFixed(2)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                        {item.paymentMethod || 'CASH'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
