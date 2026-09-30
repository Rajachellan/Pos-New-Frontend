"use client"

import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { AxiosError } from 'axios'
import { PiForkKnifeBold } from 'react-icons/pi'
import { RiSearchLine, RiCheckLine, RiErrorWarningLine, RiPriceTag3Line, RiFilter3Line } from 'react-icons/ri'

interface Menu {
  _id: string
  category: string
  name: string
  price: number
}

function AddMenusPage() {
  const [category, setCategory] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [price, setPrice] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState<boolean>(false)
  const [menuDatas, setMenuDatas] = useState<Menu[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const categories = [
    'Biryani',
    'Starters',
    'Tandoori',
    'Chinese',
    'Fast-Food',
    'Soups',
    'Desserts',
    'Drinks',
    'Meals',
  ]

  async function getMenus() {
    try {
      const res = await api.get('/get/menus')
      setMenuDatas(res.data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    getMenus()
  }, [])

  async function addMenusFun(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setNotification(null)

    try {
      const response = await api.post('/add/menu', {
        category,
        name,
        price: Number(price),
      })

      setNotification({
        type: 'success',
        message: response.data.message || 'Food item added to menu!',
      })
      setCategory('')
      setName('')
      setPrice(undefined)
      getMenus()
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      setNotification({
        type: 'error',
        message:
          axiosError.response?.data?.message ||
          axiosError.message ||
          'Failed to add menu item.',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredMenus = menuDatas.filter((menu) => {
    const matchesSearch =
      menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      menu.category.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategoryFilter =
      selectedCategoryFilter === 'ALL' || menu.category === selectedCategoryFilter

    return matchesSearch && matchesCategoryFilter
  })

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-md shadow-purple-900/20">
            <PiForkKnifeBold size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Food Menu Catalog Setup
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Add dishes, categorize menu offerings, and set item pricing in INR
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-purple-50 border border-purple-200 px-3.5 py-1 text-xs font-bold text-purple-800">
            {menuDatas.length} Menu Dishes
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

      {/* Main Grid: Form Left, Menu List Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Live Dish Preview Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Add Menu Dish</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter item details to populate your restaurant menu.
              </p>
            </div>

            <form onSubmit={addMenusFun} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Food Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Chicken Biryani"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Category *
                </label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition"
                >
                  <option value="" disabled>
                    -- Select Food Category --
                  </option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Item Price (INR ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xs font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="250"
                    value={price ?? ''}
                    onChange={(e) =>
                      setPrice(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-4 py-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-purple-900/20 hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Adding Item..." : "Save Menu Item"}
              </button>
            </form>
          </div>

          {/* Live Preview Card */}
          <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-6 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300">
                Live Dish Preview Card
              </span>
              <span className="rounded-full bg-purple-500/20 border border-purple-400/40 px-2.5 py-0.5 text-[10px] font-bold text-purple-300 uppercase">
                {category || "CATEGORY"}
              </span>
            </div>

            <div className="rounded-2xl bg-white/15 backdrop-blur-md p-5 border border-white/10 space-y-3">
              <h3 className="text-xl font-extrabold text-white">
                {name || "Your Food Item"}
              </h3>
              <div className="flex items-baseline justify-between pt-2 border-t border-white/10">
                <span className="text-xs text-purple-200 font-semibold">Listing Price</span>
                <span className="text-2xl font-black text-amber-300">
                  ₹{price || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Menu Catalog List & Category Filters */}
        <div className="lg:col-span-7 space-y-5">
          {/* Controls */}
          <div className="flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Food Menu Catalog</h2>
                <p className="text-xs text-slate-500">Live dish items available for POS billing</p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-60">
                <RiSearchLine size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search food name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                <RiFilter3Line size={14} /> Category:
              </span>
              <button
                onClick={() => setSelectedCategoryFilter('ALL')}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                  selectedCategoryFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                All ({menuDatas.length})
              </button>
              {categories.map((cat) => {
                const count = menuDatas.filter((m) => m.category === cat).length
                if (count === 0 && selectedCategoryFilter !== cat) return null
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                      selectedCategoryFilter === cat
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                )
              })}
            </div>
          </div>

          {filteredMenus.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <PiForkKnifeBold size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-700">No menu items found</p>
              <p className="text-[11px] text-slate-400 mt-1">Add food items using the form on the left</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenus.map((menu) => (
                <div
                  key={menu._id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:shadow-md hover:border-purple-300"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 uppercase tracking-wider border border-purple-200/60">
                        {menu.category}
                      </span>
                      <RiPriceTag3Line size={16} className="text-purple-400" />
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-purple-600 transition leading-snug">
                      {menu.name}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Price
                    </span>
                    <span className="text-lg font-black text-slate-900">
                      ₹{menu.price}
                    </span>
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

export default AddMenusPage