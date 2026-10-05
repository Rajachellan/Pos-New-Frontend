"use client"

import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { AxiosError } from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiPlus,
  FiX,
  FiUserCheck,
  FiClock,
  FiPhone,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw
} from 'react-icons/fi'
import { FaHistory } from 'react-icons/fa'
import { MdMeetingRoom, MdHotel } from 'react-icons/md'

interface RoomBooking {
  _id: string
  guestName: string
  guestPhone?: string
  checkInAt: string
  status: 'ACTIVE' | 'COMPLETED'
  roomCost?: number
  serviceChargeTotal?: number
  totalAmount?: number
}

interface Room {
  _id: string
  number: string
  roomType: string
  pricePerNight: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'
  currentBooking?: RoomBooking | null
}

export default function RoomsPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Modals
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showCheckOut, setShowCheckOut] = useState(false)

  // Selected State
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  // Add Room Form
  const [newNumber, setNewNumber] = useState('')
  const [newRoomType, setNewRoomType] = useState('Deluxe')
  const [newPrice, setNewPrice] = useState('2500')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check In Form
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')

  // Check Out State
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('CASH')

  async function fetchRooms() {
    try {
      setLoading(true)
      const res = await api.get('/rooms')
      if (res?.data?.data) {
        setRooms(res.data.data)
      }
    } catch (err) {
      console.error('Failed to load rooms', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchRooms()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Handle Add Room
  async function handleAddRoom(e: React.FormEvent) {
    e.preventDefault()
    if (!newNumber.trim() || !newPrice) return
    setIsSubmitting(true)
    setFormError('')
    try {
      await api.post('/rooms', {
        number: newNumber.trim(),
        roomType: newRoomType,
        pricePerNight: Number(newPrice),
      })
      setNewNumber('')
      setShowAddRoom(false)
      await fetchRooms()
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>
      setFormError(axiosErr.response?.data?.message || 'Failed to add room')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Check In
  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRoom || !guestName.trim()) return
    setIsSubmitting(true)
    setFormError('')
    try {
      await api.post(`/rooms/${selectedRoom._id}/check-in`, {
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
      })
      setGuestName('')
      setGuestPhone('')
      setShowCheckIn(false)
      setSelectedRoom(null)
      await fetchRooms()
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>
      setFormError(axiosErr.response?.data?.message || 'Failed to check in guest')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Check Out
  async function handleCheckOut() {
    if (!selectedRoom?.currentBooking?._id) return
    setIsSubmitting(true)
    setFormError('')
    try {
      await api.post(`/rooms/bookings/${selectedRoom.currentBooking._id}/check-out`, {
        paymentMethod: checkoutPaymentMethod,
      })
      setShowCheckOut(false)
      setSelectedRoom(null)
      await fetchRooms()
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>
      setFormError(axiosErr.response?.data?.message || 'Failed to check out guest')
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableCount = rooms.filter((r) => r.status === 'AVAILABLE').length
  const occupiedCount = rooms.filter((r) => r.status === 'OCCUPIED').length

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      
      {/* 1. Header (Exact Petpooja rooms.html) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-red-50 text-[#e02424] px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <MdHotel className="text-sm" /> Hotel Operations
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">Occupancy & Room Service</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Room Management</h1>
          <p className="text-slate-500 font-medium text-sm mt-0.5">
            Manage guest check-ins, room service orders, and checkout settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddRoom(true)}
            className="bg-[#e02424] hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-200 flex items-center transition active:scale-95 cursor-pointer"
          >
            <FiPlus className="mr-1.5 text-sm" /> Add Room
          </button>

          <Link
            href="/user-dashboard/rooms/history"
            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xs flex items-center transition"
          >
            <FaHistory className="mr-1.5 text-sm" /> Stay History
          </Link>

          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
              {availableCount} Available
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-[#e02424]" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
              {occupiedCount} Occupied
            </span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-700 transition"
            title="Refresh"
          >
            <FiRefreshCw className={`text-sm ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Rooms Grid (Exact Petpooja rooms.html cards) */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-[2rem] bg-white border border-slate-100 p-6 animate-pulse" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 text-[#e02424] flex items-center justify-center mx-auto text-2xl">
            <MdMeetingRoom />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">No Rooms Configured</h3>
            <p className="text-xs text-slate-500 mt-1">
              Click "+ Add Room" to set up your hotel rooms, suite types, and nightly tariffs.
            </p>
          </div>
          <button
            onClick={() => setShowAddRoom(true)}
            className="px-6 py-3 rounded-2xl bg-[#e02424] hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest transition shadow-md active:scale-95 cursor-pointer"
          >
            + Add First Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {rooms.map((room) => {
            const isAvailable = room.status === 'AVAILABLE'

            return (
              <div
                key={room._id}
                className={`group relative bg-white rounded-[2rem] border-2 ${
                  isAvailable
                    ? 'border-slate-100 hover:border-emerald-500/40 shadow-xs'
                    : 'border-red-100 shadow-sm'
                } p-6 transition-all duration-300 hover:shadow-xl flex flex-col justify-between`}
              >
                {/* Top Badge */}
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-red-50 text-[#e02424]'
                      } flex items-center justify-center shadow-inner`}
                    >
                      <MdHotel size={24} />
                    </div>
                    <span
                      className={`text-xs font-black uppercase tracking-wider ${
                        isAvailable ? 'text-emerald-500' : 'text-[#e02424]'
                      }`}
                    >
                      {room.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                      Room {room.number}
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {room.roomType}
                    </p>
                    <p className="text-sm font-bold text-slate-600 mt-2">
                      ₹{room.pricePerNight} <span className="text-[10px] text-slate-400">/ night</span>
                    </p>

                    {!isAvailable && room.currentBooking && (
                      <div className="pt-2 mt-2 border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          Guest: {room.currentBooking.guestName}
                        </p>
                        {room.currentBooking.guestPhone && (
                          <p className="text-[10px] text-slate-400 font-medium">
                            {room.currentBooking.guestPhone}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-slate-50 space-y-2">
                  {isAvailable ? (
                    <button
                      onClick={() => {
                        setSelectedRoom(room)
                        setShowCheckIn(true)
                      }}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-200 transition-all cursor-pointer active:scale-95"
                    >
                      Check In
                    </button>
                  ) : (
                    <>
                      <Link
                        href={`/user-dashboard/menus?roomNumber=${room.number}`}
                        className="flex items-center justify-center w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md transition"
                      >
                        Room Service
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedRoom(room)
                          setShowCheckOut(true)
                        }}
                        className="w-full py-2.5 border-2 border-[#e02424] text-[#e02424] hover:bg-red-50 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all cursor-pointer active:scale-95"
                      >
                        Check Out
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 3. Add Room Modal */}
      <AnimatePresence>
        {showAddRoom && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Add Room</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Hotel inventory</p>
                </div>
                <button
                  onClick={() => setShowAddRoom(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleAddRoom} className="p-8 space-y-5">
                {formError && (
                  <div className="p-3 bg-red-50 text-[#e02424] rounded-xl text-xs font-bold">
                    {formError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Room Number
                  </label>
                  <input
                    type="text"
                    required
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    placeholder="e.g. 101 or 201"
                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-[#e02424] outline-none font-bold text-slate-800 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Room Type
                  </label>
                  <select
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-[#e02424] outline-none font-bold text-slate-800 text-sm bg-slate-50 cursor-pointer"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Super Deluxe">Super Deluxe</option>
                    <option value="Executive Suite">Executive Suite</option>
                    <option value="Presidential Suite">Presidential Suite</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Price Per Night (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="2500"
                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-[#e02424] outline-none font-bold text-slate-800 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#e02424] hover:bg-red-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition shadow-xl shadow-red-200 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Room...' : 'Create Room'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Check In Modal */}
      <AnimatePresence>
        {showCheckIn && selectedRoom && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    Check In - Room {selectedRoom.number}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Guest Registration</p>
                </div>
                <button
                  onClick={() => setShowCheckIn(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleCheckIn} className="p-8 space-y-5">
                {formError && (
                  <div className="p-3 bg-red-50 text-[#e02424] rounded-xl text-xs font-bold">
                    {formError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Guest Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 outline-none font-bold text-slate-800 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 outline-none font-bold text-slate-800 text-sm"
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Room Type:</span>
                    <span className="font-bold text-slate-800">{selectedRoom.roomType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tariff:</span>
                    <span className="font-bold text-emerald-600">₹{selectedRoom.pricePerNight} / night</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition shadow-xl shadow-emerald-200 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Checking In...' : 'Confirm Check In'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Check Out Modal */}
      <AnimatePresence>
        {showCheckOut && selectedRoom && selectedRoom.currentBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    Check Out - Room {selectedRoom.number}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Bill Settlement</p>
                </div>
                <button
                  onClick={() => setShowCheckOut(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {formError && (
                  <div className="p-3 bg-red-50 text-[#e02424] rounded-xl text-xs font-bold">
                    {formError}
                  </div>
                )}

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Guest:</span>
                    <span className="font-bold text-slate-800">{selectedRoom.currentBooking.guestName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Check In:</span>
                    <span className="font-medium text-slate-600">
                      {new Date(selectedRoom.currentBooking.checkInAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Room Tariff:</span>
                    <span className="font-bold text-slate-800">₹{selectedRoom.pricePerNight}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['CASH', 'CARD', 'UPI', 'CHEQUE'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setCheckoutPaymentMethod(m)}
                        className={`py-3 rounded-xl font-black text-xs uppercase tracking-wider border-2 transition cursor-pointer ${
                          checkoutPaymentMethod === m
                            ? 'border-[#e02424] bg-red-50 text-[#e02424]'
                            : 'border-slate-100 text-slate-600 hover:border-slate-200'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCheckOut}
                  className="w-full bg-[#e02424] hover:bg-red-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition shadow-xl shadow-red-200 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Settling...' : 'Confirm Settle & Check Out'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
