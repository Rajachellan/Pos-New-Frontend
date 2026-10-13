"use client"

import React, { useEffect, useState, useMemo, Suspense, useRef } from 'react'
import api from '../../services/api'
import { AxiosError } from "axios"
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSearch,
  FiX,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiPrinter,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiClock,
} from "react-icons/fi"
import { RiFireLine } from "react-icons/ri"
import { sortTablesNaturally } from '../../utils/tableSort'
import { getActiveBranchReceiptInfo, BranchReceiptInfo } from '../../utils/receiptBranding'

interface MenuItem {
  _id: string
  name: string
  price: number
  category?: string
  foodType?: string
}

interface CartItem {
  _id?: string
  menuId?: string | { _id: string; name: string }
  name: string
  price: number
  quantity: number
  isManual?: boolean
  kitchenStatus?: string
}

interface TableInfo {
  _id: string
  tableNumber: string
  areaName?: {
    _id?: string
    areaName?: string
  }
  availabilityStatus?: string
}

interface CartData {
  _id?: string
  orderNumber?: string
  tableId?: string | TableInfo
  items: CartItem[]
  subtotal: number
  gstEnabled: boolean
  gstAmount: number
  serviceCharge: number
  totalAmount: number
  status: string
  paymentMethod?: string
}

export default function MenusPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-xs text-slate-500 font-bold">Loading POS Portal...</div>}>
      <MenusContent />
    </Suspense>
  )
}

function MenusContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tableId = searchParams.get("tableId")

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [table, setTable] = useState<TableInfo | null>(null)
  const [allTables, setAllTables] = useState<TableInfo[]>([])
  const [cart, setCart] = useState<CartData>({
    items: [],
    subtotal: 0,
    gstEnabled: true,
    gstAmount: 0,
    serviceCharge: 0,
    totalAmount: 0,
    status: "PENDING",
  })

  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [dietFilter, setDietFilter] = useState<"all" | "veg" | "non_veg">("all")
  const [loading, setLoading] = useState(true)

  // Modals
  const [showManualItemModal, setShowManualItemModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showBillModal, setShowBillModal] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Manual Item Form
  const [manualName, setManualName] = useState("")
  const [manualPrice, setManualPrice] = useState("")
  const [submittingManual, setSubmittingManual] = useState(false)

  // Payment & KOT processing
  const [processingPayment, setProcessingPayment] = useState(false)
  const [sendingKot, setSendingKot] = useState(false)
  const [paidOrderData, setPaidOrderData] = useState<CartData | null>(null)
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)

  // Safe table display number
  const tableDisplayNum = table?.tableNumber
    ? (table.tableNumber.toUpperCase().startsWith("T") ? table.tableNumber.toUpperCase() : `T${table.tableNumber}`)
    : (searchParams.get("tableNumber")
      ? (searchParams.get("tableNumber")!.toUpperCase().startsWith("T") ? searchParams.get("tableNumber")!.toUpperCase() : `T${searchParams.get("tableNumber")}`)
      : "T1")

  // Reliable navigation to Floors & Tables with fallback
  const navigateToTables = (flashMsg?: string) => {
    if (typeof window !== 'undefined' && flashMsg) {
      sessionStorage.setItem('pos_flash_message', flashMsg)
    }
    try {
      router.replace('/user-dashboard/tables')
    } catch (err) {
      console.error("Navigation error:", err)
    }
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.location.pathname.includes('/menus')) {
        window.location.href = '/user-dashboard/tables'
      }
    }, 120)
  }

  // Terminal & Hotel Settings (Logo, Brand Name, Address, etc.)
  const [terminalSettings, setTerminalSettings] = useState<{
    restaurantName?: string;
    tagline?: string;
    logoUrl?: string;
    phone?: string;
    address?: string;
    gstin?: string;
    fssaiLicense?: string;
    currencySymbol?: string;
  }>({
    restaurantName: "TANJAVOOR RESTAURANT",
    tagline: "Fine Dining & POS System",
    logoUrl: "",
    currencySymbol: "₹",
  });

  const [branchReceiptInfo, setBranchReceiptInfo] = useState<BranchReceiptInfo | null>(null);

  useEffect(() => {
    function loadBranding() {
      getActiveBranchReceiptInfo().then((info) => {
        setBranchReceiptInfo(info);
        if (info) {
          setTerminalSettings((prev) => ({
            ...prev,
            restaurantName: info.branchName || info.orgName || prev.restaurantName,
            logoUrl: info.logoUrl || prev.logoUrl,
            phone: info.phone || prev.phone,
            address: info.address || prev.address,
            gstin: info.gstin || prev.gstin,
            tagline: info.tagline || prev.tagline,
          }));
        }
      });
    }

    loadBranding();
    window.addEventListener("pos_branch_changed", loadBranding);
    return () => window.removeEventListener("pos_branch_changed", loadBranding);
  }, []);

  // Auto redirect countdown to Tables page after successful payment
  useEffect(() => {
    if (redirectCountdown === null) return
    if (redirectCountdown <= 0) {
      setRedirectCountdown(null)
      setPaymentSuccess(false)
      navigateToTables(`Payment recorded for Table ${tableDisplayNum}. Table is now free and available.`)
      return
    }
    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)
    return () => clearTimeout(timer)
  }, [redirectCountdown, tableDisplayNum])

  // Fetch Menu Items
  async function fetchMenus() {
    try {
      const res = await api.get('/get/menus')
      const data = Array.isArray(res?.data?.data) ? res.data.data : []
      setMenuItems(data)
    } catch (err) {
      console.error("Failed to load menus", err)
    }
  }

  // Fetch Tables
  async function fetchTables() {
    try {
      const savedBranchId = typeof window !== 'undefined' ? localStorage.getItem('pos_selected_branch') : null
      const branchQuery = savedBranchId && savedBranchId !== 'ALL' ? `?branchId=${savedBranchId}` : ''
      const res = await api.get(`/get/tables/branch${branchQuery}`)
      const list: TableInfo[] = Array.isArray(res?.data?.data) ? sortTablesNaturally<TableInfo>(res.data.data) : []
      setAllTables(list)
      if (tableId) {
        const found = list.find((t: TableInfo) => t._id === tableId)
        if (found) setTable(found)
        else if (list.length > 0) setTable(list[0])
      } else if (list.length > 0) {
        setTable(list[0])
      }
    } catch (err) {
      console.error("Failed to load tables", err)
    }
  }

  // Fetch Cart for Table
  async function fetchCart(targetTableId: string) {
    if (!targetTableId) return
    try {
      const res = await api.get(`/get/cart/${targetTableId}`)
      if (res?.data?.data) {
        if (res.data.data.status === "COMPLETED") {
          setCart({
            tableId: targetTableId,
            items: [],
            subtotal: 0,
            gstEnabled: true,
            gstAmount: 0,
            serviceCharge: 0,
            totalAmount: 0,
            status: "PENDING",
          })
        } else {
          setCart(res.data.data)
        }
      }
    } catch (err) {
      console.error("Failed to load cart", err)
    }
  }

  // Initial load
  useEffect(() => {
    async function init() {
      setLoading(true)
      await Promise.all([fetchMenus(), fetchTables()])
      if (tableId) {
        await fetchCart(tableId)
      }
      setLoading(false)
    }
    init()

    const handleBranchChange = () => {
      fetchTables()
    }
    window.addEventListener('pos_branch_changed', handleBranchChange)
    return () => {
      window.removeEventListener('pos_branch_changed', handleBranchChange)
    }
  }, [tableId])

  // Active table ID
  const activeTableId = table?._id || tableId || ""

  // When active table changes
  useEffect(() => {
    if (activeTableId) {
      fetchCart(activeTableId)
    }
  }, [activeTableId])

  // Extract Categories
  const categories = useMemo(() => {
    const set = new Set<string>()
    menuItems.forEach((item) => {
      if (item.category) set.add(item.category.trim())
    })
    return Array.from(set)
  }, [menuItems])

  // Helper to detect if a dish is Vegetarian or Non-Vegetarian
  function isDishVeg(item: MenuItem): boolean {
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

  // Total counts for Veg & Non-Veg
  const totalVegCount = useMemo(() => menuItems.filter((m) => isDishVeg(m)).length, [menuItems])
  const totalNonVegCount = useMemo(() => menuItems.filter((m) => !isDishVeg(m)).length, [menuItems])

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const isVeg = isDishVeg(item)
      if (dietFilter === "veg" && !isVeg) return false
      if (dietFilter === "non_veg" && isVeg) return false

      const matchesCategory =
        selectedCategory === "all" ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase()
      const matchesSearch =
        search === "" ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category?.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [menuItems, selectedCategory, search, dietFilter])

  // Partitioned lists for clean separate sections
  const vegDishes = useMemo(() => filteredMenuItems.filter((m) => isDishVeg(m)), [filteredMenuItems])
  const nonVegDishes = useMemo(() => filteredMenuItems.filter((m) => !isDishVeg(m)), [filteredMenuItems])

  // Add Item to Order
  async function handleAddItem(menuItem: MenuItem) {
    if (!activeTableId) {
      alert("Please select a dining table first.")
      return
    }

    try {
      const res = await api.post('/add/cart', {
        tableId: activeTableId,
        menuId: menuItem._id,
        quantity: 1,
      })
      if (res?.data?.data) {
        setCart(res.data.data)
      }
    } catch (err) {
      console.error("Failed to add item to cart", err)
    }
  }

  // Add Manual Item
  async function handleAddManualItem(e: React.FormEvent) {
    e.preventDefault()
    if (!activeTableId) {
      alert("Please select a dining table first.")
      return
    }
    if (!manualName.trim() || !manualPrice) return

    setSubmittingManual(true)
    try {
      const res = await api.post('/add/cart', {
        tableId: activeTableId,
        isManual: true,
        name: manualName.trim(),
        price: Number(manualPrice),
        quantity: 1,
      })
      if (res?.data?.data) {
        setCart(res.data.data)
      }
      setManualName("")
      setManualPrice("")
      setShowManualItemModal(false)
    } catch (err) {
      console.error("Failed to add manual item", err)
    } finally {
      setSubmittingManual(false)
    }
  }

  // Update Item Quantity
  async function handleUpdateQuantity(itemId: string, action: 'increase' | 'decrease') {
    if (!activeTableId) return
    try {
      const res = await api.post('/update/quantity', {
        tableId: activeTableId,
        itemId,
        action,
      })
      if (res?.data?.data) {
        setCart(res.data.data)
      }
    } catch (err) {
      console.error("Failed to update quantity", err)
    }
  }

  // Delete Item
  async function handleDeleteItem(item: CartItem) {
    if (!activeTableId) return
    try {
      const res = await api.post('/remove/cart', {
        tableId: activeTableId,
        itemId: item._id,
        menuId: typeof item.menuId === 'object' ? item.menuId?._id : item.menuId,
      })
      if (res?.data?.data) {
        setCart(res.data.data)
      }
    } catch (err) {
      console.error("Failed to remove item", err)
    }
  }

  // Toggle GST
  async function handleToggleGst() {
    if (!activeTableId) return
    try {
      const res = await api.post('/toggle/gst', {
        tableId: activeTableId,
        gstEnabled: !cart.gstEnabled,
      })
      if (res?.data?.data) {
        setCart(res.data.data)
      }
    } catch (err) {
      console.error("Failed to toggle GST", err)
    }
  }

  // Send Order (KOT) & Redirect to Kitchen
  async function handleSendKot() {
    if (!activeTableId) return
    setSendingKot(true)
    try {
      const res = await api.post('/take/order', {
        tableId: activeTableId,
      })
      if (res?.data?.data) {
        setCart(res.data.data)
        // Refresh table status
        await fetchTables()
      }
      // Redirect to Kitchen display to follow order preparation process
      router.push('/user-dashboard/kitchen')
    } catch (err) {
      console.error("Failed to send KOT", err)
      alert("Failed to send order to kitchen. Please try again.")
    } finally {
      setSendingKot(false)
    }
  }

  // Complete Payment (Cash, Card, UPI, Cheque)
  async function handleCompletePayment(paymentMethod: string) {
    if (!activeTableId) return
    setProcessingPayment(true)
    try {
      const res = await api.post('/pay/order', {
        tableId: activeTableId,
        paymentMethod,
      })
      if (res?.data?.data) {
        const completedOrder = res.data.data
        setPaidOrderData(completedOrder)
        // Reset current table cart so it's clean and available for next guests
        setCart({
          tableId: activeTableId,
          items: [],
          subtotal: 0,
          gstEnabled: true,
          gstAmount: 0,
          serviceCharge: 0,
          totalAmount: 0,
          status: "PENDING",
        })
        setShowPaymentModal(false)
        setPaymentSuccess(true)
        setRedirectCountdown(2) // 2-second snappy auto-redirect countdown
        await fetchTables()
      }
    } catch (err) {
      console.error("Failed to complete payment", err)
      const axiosError = err as AxiosError<{ message?: string }>
      alert(axiosError.response?.data?.message || "Failed to complete payment. Please try again.")
    } finally {
      setProcessingPayment(false)
    }
  }

  // Release table manually and redirect to floor plan
  async function handleReleaseTable() {
    if (!activeTableId) return
    try {
      await api.post(`/tables/${activeTableId}/release`)
      navigateToTables(`Table ${tableDisplayNum} released and ready for next customer.`)
    } catch (err) {
      console.error("Failed to release table", err)
      alert("Failed to release table. Please try again.")
    }
  }

  const areaDisplayName = table?.areaName?.areaName || "Dining Area"
  const orderIdNumber = cart.orderNumber || (cart._id ? `#${cart._id.slice(-4).toUpperCase()}` : "#50")

  // Check if cart has pending items (NEW)
  const hasPendingItems =
    cart.items.length > 0 &&
    (cart.items.some((i) => i.kitchenStatus === "NEW" || !i.kitchenStatus) ||
      cart.status === "PENDING")

  return (
    <div className="h-[calc(100vh-73px)] flex flex-col md:flex-row bg-slate-50 relative overflow-hidden">
      
      {/* 1. LEFT COLUMN: MENU (EXACT PETPOOJA SCREENSHOT 3) */}
      <div className="flex-1 flex flex-col min-h-0 border-r border-slate-200 bg-white">
        
        {/* Menu Header */}
        <div className="p-4 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
              <span className="mr-2 p-1.5 bg-red-100 rounded-lg text-[#e02424]">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 11V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2"/><path d="M3 11v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><path d="M7 11v4"/><path d="M11 11v4"/><path d="M15 11v4"/><path d="M19 11v4"/><path d="M5 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"/><path d="M2 19h20"/>
                </svg>
              </span>
              Menu
            </h2>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigateToTables()}
                className="text-xs font-bold text-gray-700 hover:text-slate-900 transition flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 shadow-2xs cursor-pointer"
                title="Return to Floors & Tables"
              >
                <FiArrowLeft size={13} /> Floors & Tables
              </button>

              <Link
                href="/user-dashboard/menu-management"
                className="text-xs font-bold text-gray-700 hover:text-[#e02424] transition flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 shadow-2xs"
              >
                <FiPlus size={13} className="text-[#e02424]" /> Add / Manage Dishes
              </Link>

              <button
                onClick={() => setShowManualItemModal(true)}
                className="text-xs font-black uppercase tracking-widest text-[#e02424] hover:text-red-700 transition-colors flex items-center cursor-pointer px-2 py-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" className="mr-1">
                  <path d="M12 5v14"/><path d="M5 12h14"/>
                </svg>
                + Manual Item
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#e02424] transition-colors">
              <FiSearch size={16} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu items..."
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#e02424] focus:border-transparent transition-all text-sm font-medium text-slate-800"
            />
          </div>

          {/* Filters Row: Diet Filter (Veg / Non-Veg) + Category Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            {/* Diet Segmented Switch */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
              <button
                type="button"
                onClick={() => setDietFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  dietFilter === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({menuItems.length})
              </button>

              <button
                type="button"
                onClick={() => setDietFilter("veg")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  dietFilter === "veg"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-emerald-700 hover:bg-emerald-50/80"
                }`}
              >
                <span className="w-3 h-3 rounded-xs border-2 border-current flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                </span>
                <span>Veg ({totalVegCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setDietFilter("non_veg")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  dietFilter === "non_veg"
                    ? "bg-rose-700 text-white shadow-xs"
                    : "text-rose-700 hover:bg-rose-50/80"
                }`}
              >
                <span className="w-3 h-3 rounded-xs border-2 border-current flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                </span>
                <span>Non-Veg ({totalNonVegCount})</span>
              </button>
            </div>

            <div className="h-5 w-px bg-slate-200 hidden sm:block shrink-0" />

            {/* Categories Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/60"
                }`}
              >
                All
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat.toLowerCase())}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat.toLowerCase()
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/60"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Items Grid with Separate Veg & Non-Veg Sections */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-6">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-36 rounded-2xl bg-white border border-slate-200 p-4 animate-pulse flex flex-col justify-between" />
              ))}
            </div>
          ) : filteredMenuItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <p className="font-bold tracking-tight">No menu items found</p>
              <p className="text-sm mt-1">Try searching for a different item or select another category/diet filter</p>
            </div>
          ) : (
            <>
              {/* 🟢 VEGETARIAN DISHES SECTION */}
              {(dietFilter === "all" || dietFilter === "veg") && vegDishes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200/80">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-sm border-2 border-emerald-600 flex items-center justify-center bg-white shadow-2xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                      </span>
                      <h3 className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wider">
                        Vegetarian Dishes
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {vegDishes.length} items
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {vegDishes.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => handleAddItem(item)}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-emerald-500 hover:ring-2 hover:ring-emerald-100 transition-all cursor-pointer flex flex-col justify-between group h-36 relative overflow-hidden"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-3.5 h-3.5 rounded-xs border-2 border-emerald-600 flex items-center justify-center bg-white shrink-0" title="Pure Veg">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 truncate">
                              {item.category || "Special"}
                            </span>
                            <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-emerald-50 text-emerald-700">
                              Veg
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug line-clamp-2">
                            {item.name}
                          </h3>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-lg font-black text-slate-900 tracking-tighter">
                            ₹{Number(item.price).toFixed(2)}
                          </span>
                          <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M5 12h14"/><path d="M12 5v14"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 🔴 NON-VEGETARIAN DISHES SECTION */}
              {(dietFilter === "all" || dietFilter === "non_veg") && nonVegDishes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-200/80">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-sm border-2 border-rose-700 flex items-center justify-center bg-white shadow-2xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-700" />
                      </span>
                      <h3 className="text-xs sm:text-sm font-black text-rose-950 uppercase tracking-wider">
                        Non-Vegetarian Dishes
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                        {nonVegDishes.length} items
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {nonVegDishes.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => handleAddItem(item)}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#e02424] hover:ring-2 hover:ring-red-100 transition-all cursor-pointer flex flex-col justify-between group h-36 relative overflow-hidden"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-3.5 h-3.5 rounded-xs border-2 border-rose-700 flex items-center justify-center bg-white shrink-0" title="Non-Veg">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-700" />
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 truncate">
                              {item.category || "Special"}
                            </span>
                            <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-rose-50 text-rose-700">
                              Non-Veg
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#e02424] transition-colors leading-snug line-clamp-2">
                            {item.name}
                          </h3>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-lg font-black text-slate-900 tracking-tighter">
                            ₹{Number(item.price).toFixed(2)}
                          </span>
                          <div className="bg-red-50 p-1.5 rounded-lg text-[#e02424] group-hover:bg-[#e02424] group-hover:text-white transition-all shadow-xs">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M5 12h14"/><path d="M12 5v14"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* 2. RIGHT COLUMN: CURRENT ORDER PANEL */}
      <div className="w-full md:w-[420px] lg:w-[460px] flex flex-col bg-white border-l border-slate-200 h-full shadow-2xl md:shadow-none shrink-0 min-h-0">
        
        {/* Table Header */}
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#e02424] rounded-xl flex items-center justify-center text-white shadow-md shadow-red-200">
              <span className="text-base font-black">{tableDisplayNum}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight leading-tight">Order Details</h2>
                {cart.items.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-50 text-[#e02424] border border-red-100">
                    {cart.items.reduce((acc, i) => acc + (i.quantity || 1), 0)} items
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {areaDisplayName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {table?.availabilityStatus === "OCCUPIED" && (
              <button
                type="button"
                onClick={handleReleaseTable}
                className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                title="Mark this table as available and clear cart"
              >
                Release Table
              </button>
            )}
            <button
              onClick={() => navigateToTables()}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700 group cursor-pointer"
              title="Back to Floors & Tables"
            >
              <FiX size={18} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>

        {/* Order Items List - High Visibility Compact POS Rows */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
              <div className="bg-slate-50 p-5 rounded-full mb-3 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                </svg>
              </div>
              <p className="font-bold tracking-tight text-slate-800 text-sm">Table {tableDisplayNum} is Ready</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                Click dishes to place an order, or return to Floor & Tables to seat other customers.
              </p>
              <button
                type="button"
                onClick={() => navigateToTables()}
                className="mt-4 px-4 py-2 bg-[#e02424] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <FiArrowLeft size={13} /> Return to Floors & Tables
              </button>
            </div>
          ) : (
            cart.items.map((item, index) => {
              const itemId = item._id || (typeof item.menuId === 'object' ? item.menuId?._id : item.menuId) || String(index)
              const itemTotal = (item.price * item.quantity).toFixed(2)
              const isOrdered = item.kitchenStatus && item.kitchenStatus !== "NEW"

              return (
                <div
                  key={itemId}
                  className={`py-2 px-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                    isOrdered
                      ? "bg-slate-50/80 border-slate-200/80 opacity-90"
                      : "bg-white border-slate-200/70 hover:border-red-200 hover:shadow-xs"
                  }`}
                >
                  {/* Left: Item name and unit price & tags */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug truncate" title={item.name}>
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-bold text-slate-500">
                        ₹{Number(item.price).toFixed(2)}
                      </span>
                      {item.isManual && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                          Manual
                        </span>
                      )}
                      {isOrdered && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                          {item.kitchenStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Stepper, Item Total, and Remove */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Stepper */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(itemId, 'decrease')}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-white text-slate-600 transition-all active:scale-90 cursor-pointer"
                        title="Decrease"
                      >
                        <FiMinus size={11} />
                      </button>
                      <span className="w-5 text-center font-black text-slate-900 text-xs">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(itemId, 'increase')}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-white text-slate-600 transition-all active:scale-90 cursor-pointer"
                        title="Increase"
                      >
                        <FiPlus size={11} />
                      </button>
                    </div>

                    {/* Total for item */}
                    <div className="w-14 text-right">
                      <span className="font-bold text-slate-900 text-xs sm:text-[13px]">₹{itemTotal}</span>
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1 active:scale-90 cursor-pointer"
                      title="Remove Item"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Billing Section (Streamlined & Compact POS Footer) */}
        <div className="border-t border-slate-200 bg-white px-4 py-3 shrink-0 shadow-lg space-y-2 z-10">
          {/* Subtotal & Taxes breakdown */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">Subtotal</span>
              <span className="font-black text-slate-900 text-sm">
                ₹{(cart.subtotal || 0).toFixed(2)}
              </span>
            </div>

            {/* GST 5% Toggle Switch inline */}
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Apply GST (5%)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cart.gstEnabled}
                    onChange={handleToggleGst}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:bg-[#e02424] transition-all after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-4 shadow-inner" />
                </label>
              </div>
              <span className="font-bold text-slate-700 text-xs">
                {cart.gstEnabled ? `₹${(cart.gstAmount || 0).toFixed(2)}` : "₹0.00"}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Service Charge</span>
              <span className="font-bold text-slate-800">₹{(cart.serviceCharge || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Total Amount Payable */}
          <div className="pt-2 border-t border-dashed border-slate-200 flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
              Total Payable
            </span>
            <span className="text-2xl font-black text-[#e02424] tracking-tight">
              ₹{(cart.totalAmount || 0).toFixed(2)}
            </span>
          </div>

          {/* Live Kitchen Status Banner (if order is active in kitchen) */}
          {cart.status && cart.status !== "PENDING" && cart.status !== "COMPLETED" && cart.items.length > 0 && (
            <div className="rounded-xl px-3 py-2 bg-slate-900 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    cart.status === "READY"
                      ? "bg-emerald-400 animate-bounce"
                      : cart.status === "PREPARING"
                      ? "bg-amber-400 animate-pulse"
                      : "bg-red-400 animate-ping"
                  }`}
                />
                <p className="text-[11px] font-bold text-slate-200 truncate">
                  {cart.status === "READY"
                    ? "Ready to Serve!"
                    : cart.status === "PREPARING"
                    ? "Kitchen: In Preparation"
                    : "Kitchen Queue"}
                </p>
              </div>

              <Link
                href="/user-dashboard/kitchen"
                className="rounded-lg bg-white/10 hover:bg-white/20 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>KDS</span>
                <FiArrowRight size={10} />
              </Link>
            </div>
          )}

          {/* Actions: KOT / BILL / PAY */}
          <div className="space-y-1.5 pt-0.5">
            {hasPendingItems ? (
              <button
                type="button"
                onClick={handleSendKot}
                disabled={cart.items.length === 0 || sendingKot || cart.status === "COMPLETED"}
                className="w-full bg-[#e02424] hover:bg-red-700 text-white py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all shadow-md shadow-red-200 active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-40"
              >
                <RiFireLine className="mr-1.5 text-sm animate-pulse" />
                {sendingKot
                  ? "Sending to Kitchen..."
                  : cart.status === "ORDERED" || cart.status === "PREPARING" || cart.status === "READY"
                  ? "Send New Items to Kitchen (KOT) ➔"
                  : "Order & Send to Kitchen (KOT) ➔"}
              </button>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowBillModal(true)}
                disabled={cart.items.length === 0 || cart.status === "COMPLETED"}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl font-black uppercase tracking-wider text-[11px] transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
              >
                <FiPrinter className="mr-1.5 text-xs" />
                Bill
              </button>

              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                disabled={cart.items.length === 0 || cart.status === "COMPLETED"}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-black uppercase tracking-wider text-[11px] transition-all shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-40 flex items-center justify-center cursor-pointer"
              >
                <FiCheckCircle className="mr-1.5 text-xs" />
                Pay
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 3. ADD MANUAL ITEM MODAL (EXACT PETPOOJA SCREENSHOT 4) */}
      <AnimatePresence>
        {showManualItemModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Add Manual Item</h3>
                <button
                  onClick={() => setShowManualItemModal(false)}
                  className="text-slate-400 hover:text-slate-900 cursor-pointer"
                >
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleAddManualItem} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Item Name
                  </label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. Special Dessert"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#e02424] focus:border-transparent outline-none transition-all font-bold text-slate-800 placeholder:font-normal text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#e02424] focus:border-transparent outline-none transition-all font-bold text-slate-800 placeholder:font-normal text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingManual}
                  className="w-full bg-[#e02424] hover:bg-red-700 text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-lg hover:shadow-xl mt-4 cursor-pointer disabled:opacity-50"
                >
                  {submittingManual ? "Adding..." : "Add to Order"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. COMPLETE PAYMENT MODAL (EXACT PETPOOJA SCREENSHOT 5) */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 relative"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Complete Payment</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    Select method for Order {orderIdNumber}
                  </p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <FiX size={22} />
                </button>
              </div>

              {/* Total Amount Due */}
              <div className="px-8 py-6 bg-slate-50/50 text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Amount Due
                </span>
                <div className="flex items-center justify-center mt-1">
                  <span className="text-4xl font-black text-[#e02424] tracking-tighter">
                    ₹{(cart.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Methods 2x2 Grid (CASH, CARD, UPI, CHEQUE) */}
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {["CASH", "CARD", "UPI", "CHEQUE"].map((method) => (
                    <button
                      key={method}
                      type="button"
                      disabled={processingPayment}
                      onClick={() => handleCompletePayment(method)}
                      className="group relative flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-slate-100 hover:border-[#e02424] hover:bg-red-50/50 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <span className="text-sm font-black text-slate-700 group-hover:text-[#e02424] uppercase tracking-wider">
                        {method}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors cursor-pointer text-center block"
                >
                  Cancel Transaction
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. PAYMENT SUCCESS MODAL WITH AUTO-REDIRECT */}
      <AnimatePresence>
        {paymentSuccess && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-7 text-center space-y-5 border border-slate-100"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
                <FiCheckCircle />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900">Payment Completed!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Transaction recorded via {paidOrderData?.paymentMethod || "CASH"}. Table is now free and available.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Order:</span>
                  <span className="font-bold text-slate-800">
                    {paidOrderData?.orderNumber || (paidOrderData?._id ? `#${paidOrderData._id.slice(-4).toUpperCase()}` : orderIdNumber)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Table:</span>
                  <span className="font-bold text-slate-800">{tableDisplayNum}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Paid:</span>
                  <span className="font-bold text-[#e02424]">₹{(paidOrderData?.totalAmount || cart.totalAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Status:</span>
                  <span>TABLE RELEASED (AVAILABLE)</span>
                </div>
              </div>

              {/* Countdown Banner */}
              {redirectCountdown !== null && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 flex items-center justify-center gap-2">
                  <FiClock className="animate-spin text-amber-600" size={14} />
                  <span>Redirecting to Tables in {redirectCountdown}s...</span>
                </div>
              )}

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setRedirectCountdown(null)
                    setPaymentSuccess(false)
                    setShowBillModal(true)
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-2xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center cursor-pointer"
                >
                  <FiPrinter className="mr-2" size={15} />
                  Print Receipt
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentSuccess(false)
                    setRedirectCountdown(null)
                    navigateToTables(`Payment recorded for Table ${tableDisplayNum}. Table is now free and available.`)
                  }}
                  className="w-full bg-[#e02424] hover:bg-red-700 text-white py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-red-500/20 active:scale-95 cursor-pointer"
                >
                  Return to Floors & Tables Now ➔
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. PRINTABLE BILL / RECEIPT MODAL */}
      <AnimatePresence>
        {showBillModal && (() => {
          const receipt = paidOrderData || cart
          return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="font-black text-slate-900 text-base uppercase tracking-wider">Restaurant Receipt</h4>
                  <button
                    onClick={() => {
                      setShowBillModal(false)
                      // If this was after payment, return to tables
                      if (paidOrderData) {
                        navigateToTables(`Payment recorded for Table ${tableDisplayNum}. Table is now free and available.`)
                      }
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <FiX size={18} />
                  </button>
                </div>

                {/* Printable Receipt Preview matching exact reference image */}
                <div id="printable-receipt" className="font-sans text-xs space-y-2 text-slate-900 bg-white p-4 pb-5 rounded-2xl border border-slate-200 max-w-[340px] mx-auto shadow-md">
                  {/* Header & Logo */}
                  <div className="text-center space-y-1">
                    {(branchReceiptInfo?.logoUrl || terminalSettings.logoUrl) ? (
                      <div className="flex justify-center mb-1.5">
                        <img
                          src={branchReceiptInfo?.logoUrl || terminalSettings.logoUrl}
                          alt="Branch Logo"
                          className="max-h-20 max-w-[190px] object-contain mx-auto drop-shadow-xs"
                        />
                      </div>
                    ) : (
                      <h3 className="font-black text-lg uppercase tracking-tight text-red-700">
                        {branchReceiptInfo?.branchName || terminalSettings.restaurantName || "RESTAURANT"}
                      </h3>
                    )}

                    {(branchReceiptInfo?.tagline || terminalSettings.tagline) && (
                      <p className="text-[10.5px] font-bold text-red-600 uppercase tracking-wider">
                        {branchReceiptInfo?.tagline || terminalSettings.tagline}
                      </p>
                    )}
                    {(branchReceiptInfo?.address || terminalSettings.address) && (
                      <p className="text-[10.5px] text-slate-600 leading-snug">
                        {branchReceiptInfo?.address || terminalSettings.address}
                      </p>
                    )}
                    {(branchReceiptInfo?.phone || terminalSettings.phone) && (
                      <p className="text-[10.5px] text-slate-600">
                        Tel: {branchReceiptInfo?.phone || terminalSettings.phone}
                      </p>
                    )}
                    {(branchReceiptInfo?.gstin || terminalSettings.gstin) && (
                      <p className="text-[11.5px] font-extrabold text-slate-900 pt-0.5">
                        GSTIN: <span className="font-mono">{branchReceiptInfo?.gstin || terminalSettings.gstin}</span>
                      </p>
                    )}
                  </div>

                  {/* Red Solid Line */}
                  <div className="border-t-2 border-red-600 my-1.5" />

                  {/* Customer / Name placeholder */}
                  <div className="text-[11px] text-slate-800 flex items-baseline">
                    <span className="font-bold mr-1.5">Name:</span>
                    <span className="border-b border-dotted border-slate-400 flex-1 h-3 inline-block" />
                  </div>

                  {/* Red Dashed Line */}
                  <div className="border-t border-dashed border-red-400 my-1" />

                  {/* Metadata: Date, Order Type, Cashier, Bill No */}
                  <div className="space-y-0.5 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Date: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="font-black text-red-600 uppercase tracking-wide">Dine-in (Table {tableDisplayNum})</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Cashier: Biller</span>
                      <span>Bill No.: {receipt.orderNumber?.slice(-4) || orderIdNumber.slice(-4) || "1"}</span>
                    </div>
                    <div className="pt-0.5">
                      <span className="font-black text-base text-red-600 tracking-tight">Token No.: {receipt.orderNumber?.replace(/\D/g, '').slice(-3) || orderIdNumber.replace(/\D/g, '').slice(-3) || "01"}</span>
                    </div>
                  </div>

                  {/* Red Dashed Line */}
                  <div className="border-t border-dashed border-red-400 my-1" />

                  {/* Items Table with Beige Header */}
                  <div>
                    <div className="bg-[#f5e9d9] text-slate-900 font-bold text-[10.5px] uppercase py-1.5 px-2 grid grid-cols-12 gap-1 rounded-sm border-y border-slate-200">
                      <span className="col-span-5 text-left">Item</span>
                      <span className="col-span-2 text-center">Qty.</span>
                      <span className="col-span-2 text-right">Price (₹)</span>
                      <span className="col-span-3 text-right">Amount (₹)</span>
                    </div>

                    <div className="divide-y divide-dotted divide-slate-200 text-[11px]">
                      {receipt.items.map((it, idx) => (
                        <div key={idx} className="py-1 px-1.5 grid grid-cols-12 gap-1 items-center">
                          <span className="col-span-5 font-medium truncate text-slate-900">{it.name}</span>
                          <span className="col-span-2 text-center text-slate-700 font-semibold">{it.quantity}</span>
                          <span className="col-span-2 text-right text-slate-700">{it.price.toFixed(2)}</span>
                          <span className="col-span-3 text-right font-bold text-slate-900">{(it.price * it.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dashed Red Line */}
                  <div className="border-t border-dashed border-red-400 pt-1.5 space-y-1 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">Total Qty: {receipt.items.reduce((acc, i) => acc + i.quantity, 0)}</span>
                      <span className="space-x-2">
                        <span className="text-slate-600">Sub Total:</span>
                        <span className="font-bold text-slate-900">₹{(receipt.subtotal || 0).toFixed(2)}</span>
                      </span>
                    </div>

                    {receipt.gstEnabled && (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>CGST 2.5%</span>
                          <span>₹{((receipt.gstAmount || 0) / 2).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>SGST 2.5%</span>
                          <span>₹{((receipt.gstAmount || 0) / 2).toFixed(2)}</span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between text-slate-600">
                      <span>Round off</span>
                      <span>+ ₹{(Math.ceil(receipt.totalAmount || 0) - (receipt.totalAmount || 0)).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Grand Total Highlighted Strip */}
                  <div className="bg-[#fae7dc] text-[#c92a2a] border-y-2 border-red-600 py-2 px-3 flex justify-between items-center font-black text-sm my-2">
                    <span className="uppercase tracking-wide font-black">Grand Total</span>
                    <span className="text-lg">₹{Math.ceil(receipt.totalAmount || 0).toFixed(2)}</span>
                  </div>

                  {receipt.paymentMethod && (
                    <div className="flex justify-between text-[10px] text-emerald-700 font-bold px-1">
                      <span>Payment Status:</span>
                      <span>{receipt.paymentMethod} (PAID)</span>
                    </div>
                  )}

                  {/* Script Footer */}
                  <div className="text-center pt-2">
                    <p className="italic font-bold text-slate-900 text-base font-serif">
                      {branchReceiptInfo?.receiptFooter || "Thank you! Visit again...!!!"}
                    </p>
                    <div className="w-16 h-0.5 bg-red-600 rounded-full mx-auto mt-1" />
                  </div>
                </div>

                {/* Print Button */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full bg-[#e02424] hover:bg-red-700 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center shadow-lg active:scale-95 cursor-pointer"
                  >
                    <FiPrinter className="mr-2 text-sm" />
                    Print Receipt Now
                  </button>

                  {paidOrderData && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowBillModal(false)
                        navigateToTables(`Payment recorded for Table ${tableDisplayNum}. Table is now free and available.`)
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center cursor-pointer"
                    >
                      Return to Floors & Tables ➔
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )
        })()}
      </AnimatePresence>

    </div>
  )
}