"use client"

import React, { useEffect, useState, useMemo } from 'react'
import api from '../../services/api'
import { AxiosError } from 'axios'
import { PiForkKnifeBold } from 'react-icons/pi'
import {
  RiSearchLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiPriceTag3Line,
  RiFilter3Line,
  RiDeleteBinLine,
  RiEditLine,
} from 'react-icons/ri'

interface Menu {
  _id: string
  category: string
  name: string
  price: number
  foodType?: string
}

function isDishVeg(item: { name?: string; foodType?: string; category?: string }): boolean {
  if (item.foodType) {
    const ft = item.foodType.toUpperCase()
    if (ft === "VEG" || ft === "VEGETARIAN") return true
    if (ft === "NON_VEG" || ft === "NON-VEG" || ft === "NONVEG") return false
  }
  const text = `${item.name || ""} ${item.category || ""}`.toLowerCase()
  const nonVegKeywords = [
    "chicken", "mutton", "fish", "prawn", "egg", "non veg", "non-veg", "nonveg",
    "meat", "crab", "keema", "pork", "beef", "lamb", "duck", "liver", "boti", "spl meals"
  ]
  if (nonVegKeywords.some((kw) => text.includes(kw))) {
    return false
  }
  return true
}

function AddMenusPage() {
  const [category, setCategory] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [price, setPrice] = useState<number | undefined>(undefined)
  const [foodType, setFoodType] = useState<string>('NON_VEG')
  const [loading, setLoading] = useState<boolean>(false)
  const [menuDatas, setMenuDatas] = useState<Menu[]>([])
  const [serverCategories, setServerCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL')
  const [dietFilter, setDietFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Category Management Modal State
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false)
  const [categoryModalInput, setCategoryModalInput] = useState<string>('')
  const [categoryModalLoading, setCategoryModalLoading] = useState<boolean>(false)

  // Edit Product Modal State
  const [editingItem, setEditingItem] = useState<Menu | null>(null)
  const [editName, setEditName] = useState<string>('')
  const [editCategory, setEditCategory] = useState<string>('')
  const [editPrice, setEditPrice] = useState<number | string>('')
  const [editFoodType, setEditFoodType] = useState<string>('NON_VEG')
  const [editLoading, setEditLoading] = useState<boolean>(false)

  async function getCategories() {
    try {
      const res = await api.get('/get/categories')
      if (res.data?.success && Array.isArray(res.data.data)) {
        const catNames = res.data.data.map((c: any) => c.name || c)
        setServerCategories(catNames)
      }
    } catch (err) {
      console.error('Failed to load categories', err)
    }
  }

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
    getCategories()
  }, [])

  // Dynamic list of real hotel categories
  const allAvailableCategories = useMemo(() => {
    const set = new Set<string>()
    serverCategories.forEach((c) => {
      if (c && c.trim()) set.add(c.trim().toUpperCase())
    })
    menuDatas.forEach((m) => {
      if (m.category && m.category.trim()) set.add(m.category.trim().toUpperCase())
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [serverCategories, menuDatas])

  // Automatically select the first category if none is selected
  useEffect(() => {
    if (!category && allAvailableCategories.length > 0) {
      setCategory(allAvailableCategories[0])
    }
  }, [allAvailableCategories, category])

  // Add Category Handler (No price - category is a classification)
  async function handleCreateCategoryFromModal(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = categoryModalInput.trim().toUpperCase()
    if (!trimmed) return

    setCategoryModalLoading(true)
    try {
      const res = await api.post('/add/category', { name: trimmed })
      setNotification({
        type: 'success',
        message: res.data?.message || `Category "${trimmed}" created! Now you can add products to it.`,
      })
      setCategory(trimmed)
      setCategoryModalInput('')
      await getCategories()
      setShowCategoryModal(false)
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setNotification({
        type: 'error',
        message: axiosError.response?.data?.message || 'Failed to create category.',
      })
    } finally {
      setCategoryModalLoading(false)
    }
  }

  // Delete Category Handler
  async function deleteCategoryDirect(catName: string) {
    if (!window.confirm(`Delete category "${catName}"?`)) return
    try {
      const res = await api.delete(`/category/${encodeURIComponent(catName)}`)
      setNotification({
        type: 'success',
        message: res.data?.message || `Category "${catName}" deleted.`,
      })
      if (category === catName) {
        setCategory('')
      }
      await getCategories()
      await getMenus()
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setNotification({
        type: 'error',
        message: axiosError.response?.data?.message || 'Failed to delete category.',
      })
    }
  }

  // Delete Menu Item Handler
  async function deleteMenuDirect(id: string, itemName: string) {
    if (!window.confirm(`Delete "${itemName}" from menu?`)) return
    try {
      await api.delete(`/menu/${id}`)
      setNotification({
        type: 'success',
        message: `Dish "${itemName}" deleted from menu.`,
      })
      await getMenus()
      await getCategories()
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setNotification({
        type: 'error',
        message: axiosError.response?.data?.message || 'Failed to delete food dish.',
      })
    }
  }

  // Open Edit Modal Handler
  function openEditModal(item: Menu) {
    setEditingItem(item)
    setEditName(item.name)
    setEditCategory(item.category?.toUpperCase() || '')
    setEditPrice(item.price)
    setEditFoodType(item.foodType || (isDishVeg(item) ? 'VEG' : 'NON_VEG'))
  }

  // Update Product Handler
  async function handleUpdateProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!editingItem) return

    if (!editName.trim()) {
      setNotification({ type: 'error', message: 'Product name is required.' })
      return
    }

    if (editPrice === '' || isNaN(Number(editPrice))) {
      setNotification({ type: 'error', message: 'Product price is required.' })
      return
    }

    if (!editCategory.trim()) {
      setNotification({ type: 'error', message: 'Category is required.' })
      return
    }

    setEditLoading(true)
    try {
      const res = await api.put(`/menu/${editingItem._id}`, {
        name: editName.trim(),
        category: editCategory.trim().toUpperCase(),
        price: Number(editPrice),
        foodType: editFoodType,
      })

      setNotification({
        type: 'success',
        message: res.data?.message || `"${editName.trim()}" updated successfully!`,
      })
      setEditingItem(null)
      await getMenus()
      await getCategories()
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setNotification({
        type: 'error',
        message: axiosError.response?.data?.message || 'Failed to update product.',
      })
    } finally {
      setEditLoading(false)
    }
  }

  // Add Product with Price Handler
  async function addMenusFun(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setNotification(null)

    const finalCategory = category.trim().toUpperCase()

    if (!finalCategory) {
      setNotification({
        type: 'error',
        message: 'Please select or create a category first.',
      })
      setLoading(false)
      return
    }

    if (!name.trim()) {
      setNotification({
        type: 'error',
        message: 'Food product name is required.',
      })
      setLoading(false)
      return
    }

    if (price === undefined || isNaN(Number(price))) {
      setNotification({
        type: 'error',
        message: 'Product price is required.',
      })
      setLoading(false)
      return
    }

    try {
      const response = await api.post('/add/menu', {
        category: finalCategory,
        name: name.trim(),
        price: Number(price),
        foodType: foodType,
      })

      setNotification({
        type: 'success',
        message: response.data.message || `Dish "${name.trim()}" added to ${finalCategory} with price ₹${price}!`,
      })
      setName('')
      setPrice(undefined)
      await getMenus()
      await getCategories()
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
    const isVeg = isDishVeg(menu)
    if (dietFilter === 'VEG' && !isVeg) return false
    if (dietFilter === 'NON_VEG' && isVeg) return false

    const matchesSearch =
      menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      menu.category.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategoryFilter =
      selectedCategoryFilter === 'ALL' ||
      menu.category?.toUpperCase() === selectedCategoryFilter.toUpperCase()

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
              Food Menu & Category Setup
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Create categories first, then add food products with pricing under each category
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-2xs cursor-pointer"
          >
            <RiPriceTag3Line size={15} /> Manage Categories ({allAvailableCategories.length})
          </button>
          <span className="rounded-full bg-slate-100 border border-slate-200 px-3.5 py-1 text-xs font-bold text-slate-800">
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
            className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Hotel Categories
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Categories classify your menu. A category has no price—prices are assigned to products.
                </p>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategoryFromModal} className="space-y-3 pt-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                New Category Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. MEALS, STARTERS, SOUPS"
                  value={categoryModalInput}
                  onChange={(e) => setCategoryModalInput(e.target.value.toUpperCase())}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
                <button
                  type="submit"
                  disabled={categoryModalLoading || !categoryModalInput.trim()}
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {categoryModalLoading ? 'Saving...' : 'Add'}
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Existing Categories ({allAvailableCategories.length})
              </span>
              {allAvailableCategories.length === 0 ? (
                <div className="text-center py-6 px-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <RiPriceTag3Line className="mx-auto text-slate-300 mb-1" size={24} />
                  <p className="text-xs font-semibold text-slate-600">No categories created yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Type a category name above to create your first category.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {allAvailableCategories.map((cat) => {
                    const count = menuDatas.filter((m) => m.category?.toUpperCase() === cat).length
                    return (
                      <div
                        key={cat}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700"
                      >
                        <span>{cat}</span>
                        <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-full text-slate-500 border border-slate-200 font-bold">
                          {count}
                        </span>
                        {count === 0 && (
                          <button
                            type="button"
                            onClick={() => deleteCategoryDirect(cat)}
                            className="ml-1 text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                            title="Delete Empty Category"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-black transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Food Product Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Edit Food Product
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Update product name, category, or pricing
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4 pt-1">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Food Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Category *
                </label>
                <select
                  required
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 font-bold cursor-pointer"
                >
                  {allAvailableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Product Price (INR ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Diet Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditFoodType('VEG')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      editFoodType === 'VEG'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-xs border-2 border-emerald-600 flex items-center justify-center bg-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    </span>
                    <span>Pure Veg</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFoodType('NON_VEG')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      editFoodType === 'NON_VEG'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-xs border-2 border-rose-700 flex items-center justify-center bg-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-700" />
                    </span>
                    <span>Non-Veg</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-2 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid: Form Left, Menu List Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Live Dish Preview Card */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 lg:self-start space-y-6 max-h-[calc(100vh-4rem)] overflow-y-auto pr-1">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Add Menu Dish</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign a food product to a category and set its individual selling price.
              </p>
            </div>

            <form onSubmit={addMenusFun} className="space-y-4">
              {/* Step 1: Category Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    1. Food Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-800 transition cursor-pointer"
                  >
                    + New Category
                  </button>
                </div>

                {allAvailableCategories.length === 0 ? (
                  <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl text-xs space-y-2">
                    <p className="font-bold text-purple-900">No categories created yet.</p>
                    <p className="text-purple-600 text-[11px]">
                      A category must be created before adding food products with prices.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs transition cursor-pointer shadow-xs"
                    >
                      <RiPriceTag3Line size={13} /> Create Category First
                    </button>
                  </div>
                ) : (
                  <select
                    required
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setShowCategoryModal(true)
                      } else {
                        setCategory(e.target.value)
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition cursor-pointer font-bold"
                  >
                    <option value="" disabled>
                      -- Select Food Category --
                    </option>
                    {allAvailableCategories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                    <option value="__NEW__">+ Add New Category...</option>
                  </select>
                )}
              </div>

              {/* Step 2: Food Product Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  2. Food Product / Dish Name *
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

              {/* Step 3: Product Selling Price */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    3. Product Price (INR ₹) *
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Pricing applies to this dish
                  </span>
                </div>
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

              {/* Step 4: Diet Type */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  4. Diet Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFoodType('VEG')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      foodType === 'VEG'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-xs border-2 border-emerald-600 flex items-center justify-center bg-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    </span>
                    <span>Pure Veg</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFoodType('NON_VEG')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      foodType === 'NON_VEG'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-xs border-2 border-rose-700 flex items-center justify-center bg-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-700" />
                    </span>
                    <span>Non-Veg</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || allAvailableCategories.length === 0}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-purple-900/20 hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 cursor-pointer active:scale-98"
              >
                {loading ? "Adding Product..." : "Save Food Product to Menu"}
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
                <span className="text-xs text-purple-200 font-semibold">Product Price</span>
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

            {/* Filters Row: Diet Filter + Category Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
              {/* Diet Switch */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setDietFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    dietFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setDietFilter('VEG')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    dietFilter === 'VEG'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-current" />
                  Veg
                </button>
                <button
                  type="button"
                  onClick={() => setDietFilter('NON_VEG')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    dietFilter === 'NON_VEG'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-current" />
                  Non-Veg
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1">
                <button
                  onClick={() => setSelectedCategoryFilter('ALL')}
                  className={`rounded-full px-3.5 py-1 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedCategoryFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  All ({menuDatas.length})
                </button>
                {allAvailableCategories.map((cat) => {
                  const count = menuDatas.filter((m) => m.category?.toUpperCase() === cat).length
                  if (count === 0 && selectedCategoryFilter !== cat) return null
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`rounded-full px-3.5 py-1 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
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
          </div>

          {filteredMenus.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <PiForkKnifeBold size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-700">No menu items found</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {allAvailableCategories.length === 0
                  ? "Start by creating a category using '+ Manage Categories' above."
                  : "Add food items under your categories using the form on the left."}
              </p>
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
                      <div className="flex items-center gap-1.5">
                        {isDishVeg(menu) ? (
                          <span className="w-3.5 h-3.5 rounded-xs border-2 border-emerald-600 flex items-center justify-center bg-white shrink-0" title="Pure Veg">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          </span>
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-xs border-2 border-rose-700 flex items-center justify-center bg-white shrink-0" title="Non-Veg">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-700" />
                          </span>
                        )}
                        <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 uppercase tracking-wider border border-purple-200/60">
                          {menu.category}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                          isDishVeg(menu) ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {isDishVeg(menu) ? 'Veg' : 'Non-Veg'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(menu)}
                          className="text-slate-400 hover:text-purple-600 p-1.5 rounded-lg hover:bg-purple-50 transition cursor-pointer"
                          title="Edit Dish"
                        >
                          <RiEditLine size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMenuDirect(menu._id, menu.name)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          title="Delete Dish"
                        >
                          <RiDeleteBinLine size={15} />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-purple-600 transition leading-snug">
                      {menu.name}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Product Price
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