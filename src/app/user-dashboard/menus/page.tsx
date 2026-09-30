"use client"

import React, { useEffect, useState, useMemo, Suspense } from 'react'
import api from '../../services/api'
import { AxiosError } from "axios"
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaShoppingCart, FaUtensils, FaReceipt, FaPizzaSlice, FaCoffee, FaIceCream } from "react-icons/fa"
import { FaMinus, FaXmark, FaTrash, FaCheck, FaPlateWheat } from "react-icons/fa6"
import { FiSearch, FiArrowLeft, FiShoppingBag, FiCheckCircle, FiClock, FiTag, FiLayers, FiDollarSign } from "react-icons/fi"
import { PiTableBold, PiMapPinSimpleAreaFill } from "react-icons/pi"
import { RiFireLine, RiRestaurantLine } from "react-icons/ri"

interface Menu {
  _id: string
  category: string
  name: string
  price: number
}

interface CartItem {
  menuId: string
  name: string
  category: string
  price: number
  quantity: number
}

interface SavedCartItem {
  menuId: string | { _id: string }
  name: string
  price: number
  quantity: number
}

interface TableDetails {
  _id: string
  tableNumber: string
  areaName?: {
    _id?: string
    areaName?: string
  }
  availabilityStatus?: string
}

export default function MenusPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-xs text-slate-500">Loading Menu Portal...</div>}>
      <MenusContent />
    </Suspense>
  )
}

function MenusContent() {

  const [menuDatas, setMenuDatas] = useState<Menu[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [cart, setCart] = useState<CartItem[]>([])
  const [tableDetails, setTableDetails] = useState<TableDetails | null>(null)
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [isPaying, setIsPaying] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const tableId = searchParams.get("tableId")

  // Fetch menus
  async function getMenus() {
    try {
      const res = await api.get('/get/menus')
      setMenuDatas(Array.isArray(res?.data?.data) ? res.data.data : [])
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      console.error(axiosError.response?.data?.message || axiosError.message)
    }
  }

  // Fetch table details if tableId exists
  async function getTableInfo() {
    if (!tableId) return
    try {
      const res = await api.get('/get/tables/branch')
      const list = Array.isArray(res?.data?.data) ? res.data.data : []
      const match = list.find((t: TableDetails) => t._id === tableId)
      if (match) setTableDetails(match)
    } catch (err) {
      console.error("Failed to fetch table details", err)
    }
  }

  async function getCart() {
    if (!tableId) return

    try {
      const res = await api.get(`/get/cart/${tableId}`)
      const savedCart = res?.data?.data

      if (!savedCart || !Array.isArray(savedCart.items)) return

      setCart(
        savedCart.items.map((item: SavedCartItem) => {
          const menuId =
            typeof item.menuId === "string" ? item.menuId : item.menuId._id
          const matchingMenu = menuDatas.find((menu) => menu._id === menuId)

          return {
            menuId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: matchingMenu?.category || "MENU",
          }
        })
      )
      setOrderPlaced(savedCart.status === "ORDERED")
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      console.error(axiosError.response?.data?.message || axiosError.message)
    }
  }

  useEffect(() => {
    getMenus()
    getTableInfo()
    getCart()
  }, [tableId])

  async function addToCart(menu: Menu) {
    if (!tableId) {
      alert("Table ID is missing. Please select a table first from the Floor Plan!")
      router.push('/user-dashboard/tables')
      return
    }

    try {
      const response = await api.post("/add/cart", {
        tableId,
        menuId: menu._id,
        quantity: 1,
      })

      const savedCart = response.data.data

      if (savedCart && Array.isArray(savedCart.items)) {
        setCart(
          savedCart.items.map((item: CartItem) => ({
            menuId: String(item.menuId),
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category:
              menuDatas.find((menuItem) => menuItem._id === String(item.menuId))
                ?.category || menu.category,
          }))
        )
      } else {
        setCart((prev) => {
          const existing = prev.find((item) => item.menuId === menu._id)
          if (existing) {
            return prev.map((item) =>
              item.menuId === menu._id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          }
          return [
            ...prev,
            {
              menuId: menu._id,
              name: menu.name,
              category: menu.category,
              price: menu.price,
              quantity: 1,
            },
          ]
        })
      }
      setCartOpen(true)
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      alert(
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Failed to add item to cart."
      )
    }
  }

  function decreaseQuantity(menuId: string) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.menuId === menuId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function removeFromCart(menuId: string) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.menuId !== menuId)
    )
  }

  async function handleTakeOrder() {
    if (!tableId || cart.length === 0) return

    try {
      setIsOrdering(true)
      const response = await api.post("/take/order", { tableId })
      setOrderPlaced(true)
      setOrderSuccess(true)
      setTimeout(() => setOrderSuccess(false), 5000)
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      alert(
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Failed to place order."
      )
    } finally {
      setIsOrdering(false)
    }
  }

  function printOrder() {
    window.print()
  }

  async function handlePay() {
    if (!tableId) return

    try {
      setIsPaying(true)
      const response = await api.post("/pay/order", { tableId })
      setCart([])
      setOrderPlaced(false)
      setOrderSuccess(false)
      router.push("/user-dashboard/tables")
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      alert(
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Failed to complete payment."
      )
    } finally {
      setIsPaying(false)
    }
  }

  const totalAmount = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  )

  const totalQuantity = cart.reduce(
    (total, item) => total + item.quantity,
    0
  )

  const categories = [
    "ALL",
    ...Array.from(new Set(menuDatas.map((menu) => menu.category.toUpperCase()))),
  ]

  const filteredMenus = menuDatas.filter((menu) => {
    const matchesCategory =
      selectedCategory === "ALL" ||
      menu.category.toUpperCase() === selectedCategory
    const matchesSearch = menu.name
      .toLowerCase()
      .includes(search.trim().toLowerCase())

    return matchesCategory && matchesSearch
  })

  // Format table label
  const displayTableLabel = tableDetails
    ? `Table ${tableDetails.tableNumber}`
    : tableId
      ? `Table #${tableId.slice(-4).toUpperCase()}`
      : "Select a Table"

  const displayAreaLabel = tableDetails?.areaName?.areaName || "Main Dining Area"

  return (
    <>
      {/* MAIN CONTENT CONTAINER */}
      <section className="min-h-screen bg-gray-50/70 p-4 sm:p-6 lg:p-8 lg:pr-[410px] space-y-6">

        {/* HERO TOP BAR */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-black p-6 rounded-3xl text-white shadow-xl border border-slate-800"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/user-dashboard/tables')}
                className="text-xs font-semibold text-slate-300 hover:text-red-400 transition inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs cursor-pointer"
              >
                <FiArrowLeft size={13} /> Return to Floor Plan
              </button>
              <span className="text-slate-500">•</span>
              <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {displayAreaLabel}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-playfair flex items-center gap-3">
              <span>{displayTableLabel}</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {orderPlaced ? 'KITCHEN DISPATCHED' : 'ORDERING ACTIVE'}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#9b1c1c] to-[#e02424] hover:from-[#8b1515] hover:to-[#c81e1e] text-white px-5 py-3 rounded-2xl text-xs font-extrabold shadow-lg transition active:scale-95 cursor-pointer"
            >
              <FaShoppingCart size={15} />
              <span>Order Summary ({totalQuantity})</span>
              {totalQuantity > 0 && (
                <span className="bg-white text-[#9b1c1c] px-2 py-0.5 rounded-full text-[11px] font-black">
                  INR {totalAmount}
                </span>
              )}
            </button>
          </div>
        </motion.div>

        {/* SEARCH & FILTERS BAR */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* SEARCH INPUT */}
          <div className="relative w-full sm:max-w-md">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search dishes, drinks, starters..."
              className="w-full pl-11 pr-10 py-3.5 bg-white border border-gray-200 rounded-2xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#9b1c1c]/20 focus:border-[#9b1c1c] shadow-xs transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full h-5 w-5 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="text-xs text-gray-500 font-semibold text-right">
            Showing <span className="text-gray-900 font-bold">{filteredMenus.length}</span> menu items
          </div>
        </div>

        {/* CATEGORY FILTER PILLS */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((category) => {
            const isSelected = selectedCategory === category
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap rounded-2xl px-5 py-3 text-xs font-bold tracking-wider transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#9b1c1c] text-white shadow-md shadow-red-950/20 scale-102"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                {category}
              </button>
            )
          })}
        </div>

        {/* MENU ITEMS CARDS GRID */}
        {filteredMenus.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-14 text-center">
            <RiRestaurantLine className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-sm font-bold text-gray-700">No dishes found</p>
            <p className="text-xs text-gray-400 mt-1">Try changing search keywords or category filters.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMenus.map((menu) => {
              const inCartItem = cart.find(c => c.menuId === menu._id)
              return (
                <motion.article
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  key={menu._id}
                  className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-xs hover:shadow-xl hover:border-red-200 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                        {menu.category}
                      </span>
                      <span className="text-base font-extrabold text-[#9b1c1c] bg-red-50 px-2.5 py-0.5 rounded-lg">
                        INR {menu.price}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 group-hover:text-[#9b1c1c] transition-colors leading-snug">
                      {menu.name}
                    </h3>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between">
                    {inCartItem ? (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                        In Cart: {inCartItem.quantity}x
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-gray-400">Add to order</span>
                    )}

                    <button
                      type="button"
                      aria-label={`Add ${menu.name} to cart`}
                      onClick={() => addToCart(menu)}
                      className="flex h-10 px-4 items-center justify-center gap-1.5 rounded-xl bg-red-50 text-[#9b1c1c] font-bold text-xs transition-all group-hover:bg-[#9b1c1c] group-hover:text-white shadow-xs cursor-pointer"
                    >
                      <FaPlus size={11} />
                      <span>Add</span>
                    </button>
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}
      </section>

      {/* BACKDROP OVERLAY FOR MOBILE */}
      {cartOpen && (
        <div
          onClick={() => setCartOpen(false)}
          className="fixed inset-0 z-40 bg-gray-950/50 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* REDESIGNED OFFCANVAS CART DRAWER */}
      <aside
        className={`fixed right-0 top-0 bottom-0 z-40 flex flex-col w-full max-w-md bg-white border-l border-gray-200 shadow-2xl transition-transform duration-300 ease-in-out lg:fixed lg:right-6 lg:top-24 lg:bottom-auto lg:h-[calc(100vh-7rem)] lg:min-h-[580px] lg:max-h-[700px] lg:w-[380px] lg:max-w-[380px] lg:rounded-3xl lg:border lg:z-30 lg:translate-x-0 overflow-hidden ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* DRAWER HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-black text-white p-5 lg:rounded-t-3xl shadow-md shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                <PiTableBold size={20} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                  Table Order Ticket
                </p>
                <h2 className="text-lg font-black text-white leading-tight">
                  {displayTableLabel}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCartOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white transition lg:hidden cursor-pointer"
            >
              <FaXmark size={14} />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-semibold text-gray-300 pt-2 border-t border-white/10">
            <span className="flex items-center gap-1.5">
              <PiMapPinSimpleAreaFill className="text-red-400" />
              {displayAreaLabel}
            </span>
            <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-gray-200">
              {totalQuantity} {totalQuantity === 1 ? "Item" : "Items"}
            </span>
          </div>
        </div>

        {/* SUCCESS NOTIFICATION BANNER */}
        <AnimatePresence>
          {orderSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-emerald-600 text-white p-3.5 px-5 text-xs font-bold flex items-center gap-2 shadow-inner shrink-0"
            >
              <FiCheckCircle size={16} />
              <span>Order successfully dispatched to kitchen!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DRAWER BODY - CART ITEMS */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-3">
          {cart.length === 0 ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="h-16 w-16 rounded-2xl bg-red-50 text-[#9b1c1c] flex items-center justify-center text-2xl shadow-inner">
                <FaShoppingCart />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-gray-800">Cart is Empty</h3>
                <p className="text-xs text-gray-400 max-w-[220px] mx-auto leading-relaxed">
                  Click <strong className="text-[#9b1c1c]">+ Add</strong> on menu dishes to add items for this table.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <motion.article
                  layout
                  key={item.menuId}
                  className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5 shadow-2xs hover:bg-white hover:border-gray-200 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                        {item.category}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 leading-snug">
                        {item.name}
                      </h4>
                    </div>

                    <button
                      type="button"
                      aria-label={`Remove ${item.name} from cart`}
                      onClick={() => removeFromCart(item.menuId)}
                      className="text-gray-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/60">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Decrease ${item.name} quantity`}
                        onClick={() => decreaseQuantity(item.menuId)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition font-bold cursor-pointer"
                      >
                        <FaMinus size={9} />
                      </button>

                      <span className="w-6 text-center text-xs font-black text-gray-900">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          addToCart({
                            _id: item.menuId,
                            name: item.name,
                            category: item.category,
                            price: item.price,
                          })
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900 text-white hover:bg-[#9b1c1c] transition font-bold cursor-pointer"
                      >
                        <FaPlus size={9} />
                      </button>
                    </div>

                    <span className="text-xs font-extrabold text-gray-900">
                      INR {item.price * item.quantity}
                    </span>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>

        {/* DRAWER FOOTER */}
        <div className="border-t border-gray-100 bg-white p-5 space-y-4 shadow-lg">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-gray-500">
              <span>Subtotal ({totalQuantity} items)</span>
              <span>INR {totalAmount}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <span className="text-xs font-extrabold text-gray-800">Total Payable</span>
              <span className="text-2xl font-black text-[#9b1c1c]">
                INR {totalAmount}
              </span>
            </div>
          </div>

          {!orderPlaced ? (
            <button
              type="button"
              disabled={cart.length === 0 || isOrdering}
              onClick={handleTakeOrder}
              className="w-full rounded-xl bg-gradient-to-r from-[#9b1c1c] to-[#dc2626] py-3.5 px-4 font-extrabold text-white text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg hover:from-[#8b1515] hover:to-[#b91c1c] active:scale-98 disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isOrdering ? (
                <span>Dispatching Order...</span>
              ) : (
                <>
                  <FiShoppingBag size={16} />
                  <span>Send Order to Kitchen</span>
                </>
              )}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={printOrder}
                className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 text-xs font-extrabold uppercase tracking-wider text-gray-700 transition hover:bg-gray-200 cursor-pointer"
              >
                <FaReceipt size={14} />
                Print Bill
              </button>
              <button
                type="button"
                disabled={isPaying}
                onClick={handlePay}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                <FaCheck size={14} />
                {isPaying ? "Processing..." : "Pay & Clear"}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}