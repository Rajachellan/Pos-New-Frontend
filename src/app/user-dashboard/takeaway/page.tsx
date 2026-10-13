"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import api from "../../services/api";
import { getSocket } from "../../services/socket";
import { AxiosError } from "axios";
import {
  FiPlus,
  FiMinus,
  FiSearch,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiPrinter,
  FiShoppingBag,
  FiDollarSign,
  FiPhone,
  FiUser,
  FiRefreshCw,
  FiArrowRight,
  FiArrowLeft,
  FiTrash2,
  FiTag,
  FiCheck,
} from "react-icons/fi";
import { RiTakeawayLine, RiRestaurantLine, RiFireLine } from "react-icons/ri";
import { getActiveBranchReceiptInfo, generateThermalReceiptHtml } from "../../utils/receiptBranding";

interface TakeawayItem {
  menuId?: string;
  name: string;
  price: number;
  quantity: number;
  isManual?: boolean;
  notes?: string;
  kitchenStatus?: string;
}

interface TakeawayOrder {
  _id: string;
  orderNumber?: string;
  orderType?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  items: TakeawayItem[];
  subtotal: number;
  gstEnabled?: boolean;
  gstAmount?: number;
  discount?: number;
  totalAmount: number;
  paymentMethod?: string;
  status: "PENDING" | "ORDERED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
  kitchenStatus?: "NEW" | "PREPARING" | "READY" | "SERVED";
  createdAt: string;
  updatedAt: string;
}

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  foodType?: string;
  category?: string;
  categoryName?: { _id: string; categoryName: string } | string;
  availabilityStatus?: string;
}

export default function TakeawayPage() {
  const [orders, setOrders] = useState<TakeawayOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "READY" | "PREPARING" | "COMPLETED" | "ALL">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");

  // New Order POS State
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuSearch, setMenuSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [dietFilter, setDietFilter] = useState<"ALL" | "VEG" | "NON_VEG">("ALL");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [cartItems, setCartItems] = useState<{ menuItem: MenuItem; quantity: number; notes: string }[]>([]);
  const [isGstEnabled, setIsGstEnabled] = useState(true);
  const [paymentChoice, setPaymentChoice] = useState<"UNPAID" | "CASH" | "UPI" | "CARD">("UNPAID");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [formError, setFormError] = useState("");
  const customerNameInputRef = useRef<HTMLInputElement>(null);

  // Settle Payment Modal State
  const [settleOrder, setSettleOrder] = useState<TakeawayOrder | null>(null);
  const [settlePaymentMethod, setSettlePaymentMethod] = useState<"CASH" | "UPI" | "CARD">("CASH");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Fetch Takeaway Orders
  async function fetchOrders(silent = false) {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const savedBranchId = typeof window !== "undefined" ? localStorage.getItem("pos_selected_branch") : null;
      const branchQuery = savedBranchId && savedBranchId !== "ALL" ? `?branchId=${savedBranchId}` : "";
      const res = await api.get(`/takeaway/orders${branchQuery}`);
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load takeaway orders", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  // Fetch Menu Items for new order modal
  async function fetchMenuItems() {
    try {
      const res = await api.get("/get/menus");
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      setMenuItems(list.filter((m: MenuItem) => m.availabilityStatus !== "UNAVAILABLE"));
    } catch (err) {
      console.error("Failed to fetch menu items", err);
    }
  }

  useEffect(() => {
    fetchOrders();
    fetchMenuItems();

    const socket = getSocket();
    const handleOrderChange = () => {
      fetchOrders(true);
    };

    socket.on("kot_received", handleOrderChange);
    socket.on("order_updated", handleOrderChange);

    const handleBranchChange = () => {
      fetchOrders();
    };
    window.addEventListener("pos_branch_changed", handleBranchChange);

    return () => {
      socket.off("kot_received", handleOrderChange);
      socket.off("order_updated", handleOrderChange);
      window.removeEventListener("pos_branch_changed", handleBranchChange);
    };
  }, []);

  // Update Status of Order (e.g. Mark Ready)
  async function handleUpdateStatus(orderId: string, newStatus: "PREPARING" | "READY" | "SERVED") {
    try {
      await api.patch(`/kitchen/orders/${orderId}/status`, { status: newStatus });
      fetchOrders(true);
    } catch (err) {
      console.error("Failed to update order status", err);
    }
  }

  // Settle & Complete Payment
  async function handleCompletePayment() {
    if (!settleOrder) return;
    setIsSubmittingPayment(true);
    try {
      await api.post("/pay/order", {
        orderId: settleOrder._id,
        paymentMethod: settlePaymentMethod,
      });
      setSettleOrder(null);
      fetchOrders(true);
    } catch (err) {
      console.error("Failed to complete payment", err);
    } finally {
      setIsSubmittingPayment(false);
    }
  }

  // New Order Item helpers
  function addItemToCart(item: MenuItem) {
    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.menuItem._id === item._id);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItem._id === item._id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { menuItem: item, quantity: 1, notes: "" }];
    });
  }

  function updateCartQuantity(menuId: string, delta: number) {
    setCartItems((prev) => {
      return prev
        .map((ci) => {
          if (ci.menuItem._id === menuId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as typeof prev;
    });
  }

  // Cart Totals calculation
  const newOrderSubtotal = useMemo(() => {
    return cartItems.reduce((sum, ci) => sum + ci.menuItem.price * ci.quantity, 0);
  }, [cartItems]);

  const newOrderGst = useMemo(() => {
    return isGstEnabled ? Math.round(newOrderSubtotal * 0.05 * 100) / 100 : 0;
  }, [newOrderSubtotal, isGstEnabled]);

  const newOrderTotal = useMemo(() => {
    return Math.round((newOrderSubtotal + newOrderGst) * 100) / 100;
  }, [newOrderSubtotal, newOrderGst]);

  // Submit New Takeaway Order
  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim()) {
      setFormError("Customer Name is compulsory for takeaway orders. Please enter customer name.");
      customerNameInputRef.current?.focus();
      return;
    }
    if (cartItems.length === 0) {
      setFormError("Please add at least one item to the takeaway order.");
      return;
    }
    setFormError("");
    setIsSubmittingOrder(true);

    try {
      const savedBranchId = typeof window !== "undefined" ? localStorage.getItem("pos_selected_branch") : null;
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        notes: specialNotes.trim(),
        items: cartItems.map((ci) => ({
          menuId: ci.menuItem._id,
          name: ci.menuItem.name,
          price: ci.menuItem.price,
          quantity: ci.quantity,
          notes: ci.notes,
        })),
        gstEnabled: isGstEnabled,
        paymentMethod: paymentChoice === "UNPAID" ? "" : paymentChoice,
        branchId: savedBranchId && savedBranchId !== "ALL" ? savedBranchId : undefined,
      };

      await api.post("/takeaway/create", payload);

      // Reset Form & Close Modal
      setCartItems([]);
      setCustomerName("");
      setCustomerPhone("");
      setSpecialNotes("");
      setPaymentChoice("UNPAID");
      setIsNewOrderModalOpen(false);
      fetchOrders(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setFormError(axiosError.response?.data?.message || "Failed to create takeaway order");
    } finally {
      setIsSubmittingOrder(false);
    }
  }

  // Print Parcel Receipt / Slip using active branch thermal branding
  async function handlePrintReceipt(order: TakeawayOrder) {
    const printWindow = window.open("", "_blank", "width=380,height=650");
    if (!printWindow) return;

    try {
      const receiptInfo = await getActiveBranchReceiptInfo();
      const rawToken = order.orderNumber?.replace(/\D/g, '') || "65";
      const tokenNumber = rawToken.length > 3 ? rawToken.slice(-3) : rawToken || "65";

      const html = generateThermalReceiptHtml({
        receiptInfo,
        orderNumber: order.orderNumber || "TK",
        tokenNumber,
        orderType: "Takeaway",
        customerName: order.customerName || "",
        cashierName: "biller",
        dateStr: new Date(order.createdAt).toLocaleString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        items: order.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
        subtotal: order.subtotal || order.totalAmount || 0,
        gstAmount: order.gstAmount || 0,
        roundOff: Math.round(((order.totalAmount || 0) - (order.subtotal || 0) - (order.gstAmount || 0)) * 100) / 100,
        grandTotal: order.totalAmount || 0,
        paymentMethod: order.paymentMethod,
      });

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (err) {
      console.error("Failed to generate thermal receipt", err);
    }
  }

  // Filtered Orders Logic
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Status filtering
      if (statusFilter === "ACTIVE") {
        if (o.status === "COMPLETED" || o.status === "CANCELLED") return false;
      } else if (statusFilter === "READY") {
        if (o.kitchenStatus !== "READY" || o.status === "COMPLETED") return false;
      } else if (statusFilter === "PREPARING") {
        if (o.kitchenStatus === "READY" || o.status === "COMPLETED" || o.status === "CANCELLED") return false;
      } else if (statusFilter === "COMPLETED") {
        if (o.status !== "COMPLETED") return false;
      }

      // Search filtering
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numMatch = (o.orderNumber || "").toLowerCase().includes(q);
        const nameMatch = (o.customerName || "").toLowerCase().includes(q);
        const phoneMatch = (o.customerPhone || "").toLowerCase().includes(q);
        const itemMatch = o.items.some((i) => i.name.toLowerCase().includes(q));
        if (!numMatch && !nameMatch && !phoneMatch && !itemMatch) return false;
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  // Overall KPI Metrics for Today
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayOrders = useMemo(() => {
    return orders.filter((o) => new Date(o.createdAt) >= todayStart);
  }, [orders, todayStart]);

  const activeCount = useMemo(() => {
    return orders.filter((o) => ["ORDERED", "PREPARING", "READY"].includes(o.status)).length;
  }, [orders]);

  const readyCount = useMemo(() => {
    return orders.filter((o) => o.kitchenStatus === "READY" && o.status !== "COMPLETED").length;
  }, [orders]);

  const todaySales = useMemo(() => {
    return todayOrders
      .filter((o) => o.status === "COMPLETED")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [todayOrders]);

  // Helper to extract dish category safely
  function getDishCategory(item: MenuItem): string {
    if (typeof item.category === "string" && item.category.trim()) return item.category.trim();
    if (typeof item.categoryName === "string" && item.categoryName.trim()) return item.categoryName.trim();
    if (item.categoryName && typeof item.categoryName === "object" && (item.categoryName as { categoryName?: string }).categoryName) {
      return (item.categoryName as { categoryName: string }).categoryName.trim();
    }
    return "General";
  }

  // Helper to detect if a dish is Vegetarian or Non-Vegetarian
  function isDishVeg(item: MenuItem): boolean {
    if (item.foodType) {
      const ft = item.foodType.toUpperCase();
      if (ft === "VEG" || ft === "VEGETARIAN") return true;
      if (ft === "NON_VEG" || ft === "NON-VEG" || ft === "NONVEG") return false;
    }
    const text = `${item.name || ""} ${item.category || ""} ${
      typeof item.categoryName === "string"
        ? item.categoryName
        : (item.categoryName as { categoryName?: string })?.categoryName || ""
    }`.toLowerCase();

    const nonVegKeywords = [
      "chicken", "mutton", "fish", "prawn", "egg", "non veg", "non-veg", "nonveg",
      "meat", "crab", "keema", "pork", "beef", "lamb", "duck", "liver", "boti", "spl meals"
    ];
    if (nonVegKeywords.some((kw) => text.includes(kw))) {
      return false;
    }
    return true;
  }

  // Total counts for Veg & Non-Veg
  const totalVegCount = useMemo(() => menuItems.filter((m) => isDishVeg(m)).length, [menuItems]);
  const totalNonVegCount = useMemo(() => menuItems.filter((m) => !isDishVeg(m)).length, [menuItems]);

  // Extract unique categories from menus
  const categories = useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach((item) => {
      const cat = getDishCategory(item);
      if (cat) set.add(cat);
    });
    return ["ALL", ...Array.from(set)];
  }, [menuItems]);

  // Filtered menu items for POS catalog
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const isVeg = isDishVeg(item);
      if (dietFilter === "VEG" && !isVeg) return false;
      if (dietFilter === "NON_VEG" && isVeg) return false;

      const cat = getDishCategory(item);
      const matchesCategory =
        selectedCategory === "ALL" ||
        cat.toLowerCase() === selectedCategory.toLowerCase();
      const q = menuSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, menuSearch, dietFilter]);

  // Partitioned lists for clean separate sections
  const vegDishes = useMemo(() => filteredMenuItems.filter((m) => isDishVeg(m)), [filteredMenuItems]);
  const nonVegDishes = useMemo(() => filteredMenuItems.filter((m) => !isDishVeg(m)), [filteredMenuItems]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & New Order Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-900/20">
              <RiTakeawayLine size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Takeaway & Parcel Counter
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Manage takeaway tokens, kitchen parcel packaging, customer pickups & billing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => fetchOrders(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs cursor-pointer"
            title="Refresh Takeaway Orders"
          >
            <FiRefreshCw size={17} className={isRefreshing ? "animate-spin text-amber-600" : ""} />
          </button>

          <button
            onClick={() => setIsNewOrderModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-red-950/20 active:scale-95 transition cursor-pointer"
          >
            <FiPlus size={16} />
            <span>New Takeaway Order</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center shrink-0">
            <FiShoppingBag size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Orders</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center shrink-0">
            <FiCheckCircle size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ready for Pickup</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{readyCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center shrink-0">
            <FiDollarSign size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today&apos;s Parcel Sales</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              ₹{todaySales.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200/60 text-purple-600 flex items-center justify-center shrink-0">
            <FiTag size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Today</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{todayOrders.length}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              statusFilter === "ACTIVE"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Active Pipeline ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter("READY")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              statusFilter === "READY"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Ready for Pickup ({readyCount})
          </button>
          <button
            onClick={() => setStatusFilter("PREPARING")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              statusFilter === "PREPARING"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            In Kitchen ({Math.max(0, activeCount - readyCount)})
          </button>
          <button
            onClick={() => setStatusFilter("COMPLETED")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              statusFilter === "COMPLETED"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Completed Today
          </button>
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Orders ({orders.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search Token, Customer, Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-dashed border-slate-200 shadow-xs">
          <FiShoppingBag className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-base font-bold text-slate-700">No Takeaway Orders Found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No takeaway orders matched "${searchQuery}".`
              : "Click the 'New Takeaway Order' button above to place a parcel ticket."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isReady = order.kitchenStatus === "READY";
            const isCompleted = order.status === "COMPLETED";
            const isPreparing = !isReady && !isCompleted;
            const isPaid = Boolean(order.paymentMethod);

            return (
              <div
                key={order._id}
                className={`flex flex-col justify-between rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-xs hover:shadow-md ${
                  isReady
                    ? "bg-emerald-50/40 border-emerald-300 hover:border-emerald-400"
                    : isPreparing
                    ? "bg-amber-50/30 border-amber-300 hover:border-amber-400"
                    : "bg-white border-slate-200"
                }`}
              >
                <div>
                  {/* Top Bar with Token & Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 text-white font-black text-sm tracking-wide shadow-xs">
                        {order.orderNumber || "#TK"}
                      </span>
                      {isReady ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Ready for Pickup
                        </span>
                      ) : isPreparing ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          In Kitchen
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-300">
                          Handed Over
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 justify-end">
                        <FiClock size={11} />
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  {(order.customerName || order.customerPhone) && (
                    <div className="mb-2.5 pb-2.5 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-700">
                      <div className="flex items-center gap-1.5 truncate">
                        <FiUser size={13} className="text-slate-400 shrink-0" />
                        <span className="font-bold truncate">{order.customerName || "Walk-in Guest"}</span>
                      </div>
                      {order.customerPhone && (
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="flex items-center gap-1 text-slate-500 hover:text-amber-600 shrink-0 font-medium"
                        >
                          <FiPhone size={12} />
                          <span>{order.customerPhone}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-1.5 my-3 max-h-36 overflow-y-auto scrollbar-none pr-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-slate-800">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-amber-600 w-5 text-right">{item.quantity}x</span>
                          <span className="truncate">{item.name}</span>
                        </div>
                        <span className="font-medium text-slate-500 shrink-0">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Packaging Notes */}
                  {order.notes && (
                    <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-amber-100/60 border border-amber-200/60 text-[11px] text-amber-900">
                      <span className="font-bold">Packing: </span>
                      {order.notes}
                    </div>
                  )}
                </div>

                {/* Bottom Card Footer */}
                <div className="pt-3 border-t border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total</span>
                      <p className="text-base font-black text-slate-900 leading-none mt-0.5">
                        ₹{order.totalAmount?.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isPaid
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-rose-100 text-rose-800 border border-rose-300"
                        }`}
                      >
                        {isPaid ? `Paid (${order.paymentMethod})` : "Unpaid (Due)"}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {isPreparing && (
                      <button
                        onClick={() => handleUpdateStatus(order._id, "READY")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wide shadow-xs active:scale-95 transition cursor-pointer"
                      >
                        <FiCheckCircle size={14} />
                        <span>Mark Ready</span>
                      </button>
                    )}

                    {isReady && !isPaid && (
                      <button
                        onClick={() => {
                          setSettleOrder(order);
                          setSettlePaymentMethod("CASH");
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs uppercase tracking-wide shadow-xs active:scale-95 transition cursor-pointer"
                      >
                        <FiDollarSign size={14} />
                        <span>Pay & Handover</span>
                      </button>
                    )}

                    {isReady && isPaid && (
                      <button
                        onClick={() => handleUpdateStatus(order._id, "SERVED")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wide shadow-xs active:scale-95 transition cursor-pointer"
                      >
                        <FiCheck size={14} />
                        <span>Hand Over</span>
                      </button>
                    )}

                    <button
                      onClick={() => handlePrintReceipt(order)}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer shrink-0"
                      title="Print Parcel Slip / Receipt"
                    >
                      <FiPrinter size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =================================================================== */}
      {/* FULL-PAGE TAKEAWAY POS COUNTER INTERFACE                           */}
      {/* =================================================================== */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col h-screen w-screen overflow-hidden animate-in fade-in duration-150">
          {/* Top POS Header Bar */}
          <div className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs z-30">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setIsNewOrderModalOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                title="Return to Takeaway Orders Board"
              >
                <FiArrowLeft size={16} />
                <span className="hidden sm:inline">Back to Orders</span>
              </button>

              <div className="h-6 w-px bg-slate-200 hidden sm:block" />

              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-900/20">
                  <RiTakeawayLine size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                      Takeaway POS Counter
                    </h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                      Parcel Ticket
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                    Punch parcel ticket, capture customer details, and dispatch directly to kitchen
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Clear all items from this takeaway ticket?")) {
                      setCartItems([]);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition cursor-pointer"
                >
                  Clear Ticket
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsNewOrderModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                title="Close POS Counter (Esc)"
              >
                <FiX size={22} />
              </button>
            </div>
          </div>

          {/* POS Counter Main Body */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
            {/* LEFT COLUMN: Dish Catalog & Search & Categories */}
            <div className="flex-1 flex flex-col bg-slate-50 min-h-0 overflow-hidden border-r border-slate-200">
              {/* Search, Diet Filter & Category Tabs Bar */}
              <div className="p-4 bg-white border-b border-slate-200/80 space-y-3 shrink-0">
                {/* Search Bar */}
                <div className="relative">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search dishes to pack (e.g. biryani, meals, curry, starter)..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition"
                  />
                  {menuSearch && (
                    <button
                      type="button"
                      onClick={() => setMenuSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    >
                      <FiX size={14} />
                    </button>
                  )}
                </div>

                {/* Filters Row: Diet Filter (Veg / Non-Veg) + Category Pills */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                  {/* Diet Segmented Switch */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDietFilter("ALL")}
                      className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        dietFilter === "ALL"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      All ({menuItems.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setDietFilter("VEG")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        dietFilter === "VEG"
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
                      onClick={() => setDietFilter("NON_VEG")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        dietFilter === "NON_VEG"
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

                  {/* Category Pills Filter */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1">
                    {categories.map((cat) => {
                      const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                            isSelected
                              ? "bg-slate-900 text-white shadow-xs"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/60"
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Menu Items Catalog with Separate Veg & Non-Veg Sections */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-300">
                {filteredMenuItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center">
                    <FiSearch size={36} className="text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No dishes found</p>
                    <p className="text-xs text-slate-400 mt-1">Try another search or change the diet/category filter.</p>
                  </div>
                ) : (
                  <>
                    {/* 🟢 VEGETARIAN DISHES SECTION */}
                    {(dietFilter === "ALL" || dietFilter === "VEG") && vegDishes.length > 0 && (
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

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 content-start">
                          {vegDishes.map((item) => {
                            const cartEntry = cartItems.find((ci) => ci.menuItem._id === item._id);
                            const inCartQty = cartEntry?.quantity || 0;
                            const catName = getDishCategory(item);

                            return (
                              <div
                                key={item._id}
                                onClick={() => addItemToCart(item)}
                                className={`bg-white rounded-2xl p-3.5 border transition-all cursor-pointer group flex flex-col justify-between relative select-none hover:shadow-md active:scale-[0.98] ${
                                  inCartQty > 0
                                    ? "border-emerald-400 ring-2 ring-emerald-400/20 shadow-xs"
                                    : "border-slate-200 hover:border-emerald-300 shadow-2xs"
                                }`}
                              >
                                {inCartQty > 0 && (
                                  <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                                    {inCartQty}
                                  </div>
                                )}

                                <div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="w-3.5 h-3.5 rounded-xs border-2 border-emerald-600 flex items-center justify-center bg-white shrink-0" title="Pure Veg">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">
                                      {catName}
                                    </span>
                                    <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-emerald-50 text-emerald-700">
                                      Veg
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-emerald-700 transition">
                                    {item.name}
                                  </h4>
                                </div>

                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                                  <span className="font-black text-slate-900 text-sm">
                                    ₹{Number(item.price).toFixed(2)}
                                  </span>
                                  <button
                                    type="button"
                                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                                      inCartQty > 0
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : "bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-700"
                                    }`}
                                  >
                                    <FiPlus size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 🔴 NON-VEGETARIAN DISHES SECTION */}
                    {(dietFilter === "ALL" || dietFilter === "NON_VEG") && nonVegDishes.length > 0 && (
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

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 content-start">
                          {nonVegDishes.map((item) => {
                            const cartEntry = cartItems.find((ci) => ci.menuItem._id === item._id);
                            const inCartQty = cartEntry?.quantity || 0;
                            const catName = getDishCategory(item);

                            return (
                              <div
                                key={item._id}
                                onClick={() => addItemToCart(item)}
                                className={`bg-white rounded-2xl p-3.5 border transition-all cursor-pointer group flex flex-col justify-between relative select-none hover:shadow-md active:scale-[0.98] ${
                                  inCartQty > 0
                                    ? "border-rose-400 ring-2 ring-rose-400/20 shadow-xs"
                                    : "border-slate-200 hover:border-rose-300 shadow-2xs"
                                }`}
                              >
                                {inCartQty > 0 && (
                                  <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-rose-700 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                                    {inCartQty}
                                  </div>
                                )}

                                <div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="w-3.5 h-3.5 rounded-xs border-2 border-rose-700 flex items-center justify-center bg-white shrink-0" title="Non-Veg">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-700" />
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">
                                      {catName}
                                    </span>
                                    <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-rose-50 text-rose-700">
                                      Non-Veg
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-rose-700 transition">
                                    {item.name}
                                  </h4>
                                </div>

                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                                  <span className="font-black text-slate-900 text-sm">
                                    ₹{Number(item.price).toFixed(2)}
                                  </span>
                                  <button
                                    type="button"
                                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                                      inCartQty > 0
                                        ? "bg-rose-700 text-white shadow-xs"
                                        : "bg-slate-100 group-hover:bg-rose-700 group-hover:text-white text-slate-700"
                                    }`}
                                  >
                                    <FiPlus size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Customer Details & Order Cart Sidebar */}
            <div className="w-full lg:w-[440px] xl:w-[480px] bg-white flex flex-col h-full shrink-0 min-h-0 shadow-xl">
              {/* Customer Details Header Card */}
              <div className="p-4 border-b border-slate-200/80 bg-slate-50/70 space-y-2.5 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FiUser className="text-amber-600" />
                    Customer Details
                  </span>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    * Name is Compulsory
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <FiUser
                      className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                        !customerName.trim() && formError ? "text-rose-500" : "text-slate-400"
                      }`}
                      size={13}
                    />
                    <input
                      ref={customerNameInputRef}
                      type="text"
                      placeholder="Customer Name * (Required)"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (formError && e.target.value.trim()) setFormError("");
                      }}
                      className={`w-full pl-8 pr-2.5 py-1.5 text-xs bg-white rounded-xl border font-medium focus:outline-none transition ${
                        !customerName.trim() && formError
                          ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/30 text-rose-950 placeholder:text-rose-400"
                          : "border-slate-200 focus:ring-2 focus:ring-amber-500/30 text-slate-800"
                      }`}
                    />
                  </div>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input
                      type="text"
                      placeholder="Phone Number (Optional)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium text-slate-800"
                    />
                  </div>
                </div>

                {!customerName.trim() && formError && (
                  <p className="text-[10.5px] text-rose-600 font-bold flex items-center gap-1">
                    <span>⚠️</span> Customer name is mandatory to identify parcel orders.
                  </p>
                )}

                <div className="relative">
                  <FiShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    type="text"
                    placeholder="Packaging instructions (e.g. pack sambar separate, extra gravy)..."
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium"
                  />
                </div>
              </div>

              {/* Selected Items List */}
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Parcel Items</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                    {cartItems.reduce((acc, c) => acc + c.quantity, 0)} items
                  </span>
                </span>
                {cartItems.length > 0 && (
                  <span className="text-[11px] font-bold text-slate-400">
                    Subtotal: ₹{newOrderSubtotal.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center mb-3">
                      <RiTakeawayLine size={28} />
                    </div>
                    <p className="font-bold text-slate-800 text-sm">Ticket is Empty</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                      Click dishes from the catalog on the left to pack into this parcel order.
                    </p>
                  </div>
                ) : (
                  cartItems.map((ci) => {
                    const lineTotal = (ci.menuItem.price * ci.quantity).toFixed(2);
                    return (
                      <div
                        key={ci.menuItem._id}
                        className="py-2 px-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-amber-200 hover:shadow-xs transition-all flex items-center justify-between gap-2"
                      >
                        {/* Name and unit price */}
                        <div className="flex-1 min-w-0 pr-1">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug truncate" title={ci.menuItem.name}>
                            {ci.menuItem.name}
                          </h4>
                          <span className="text-[11px] font-bold text-slate-400">
                            ₹{Number(ci.menuItem.price).toFixed(2)} each
                          </span>
                        </div>

                        {/* Stepper, line total, remove */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/80">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(ci.menuItem._id, -1)}
                              className="w-5 h-5 flex items-center justify-center rounded hover:bg-white text-slate-600 transition-all active:scale-90 cursor-pointer"
                              title="Decrease"
                            >
                              <FiMinus size={11} />
                            </button>
                            <span className="w-5 text-center font-black text-slate-900 text-xs">{ci.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(ci.menuItem._id, 1)}
                              className="w-5 h-5 flex items-center justify-center rounded hover:bg-white text-slate-600 transition-all active:scale-90 cursor-pointer"
                              title="Increase"
                            >
                              <FiPlus size={11} />
                            </button>
                          </div>

                          <div className="w-14 text-right">
                            <span className="font-bold text-slate-900 text-xs sm:text-[13px]">₹{lineTotal}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => updateCartQuantity(ci.menuItem._id, -ci.quantity)}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1 active:scale-90 cursor-pointer"
                            title="Remove from ticket"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Billing Summary & Actions Footer */}
              <div className="border-t border-slate-200 bg-white px-4 py-3 shrink-0 shadow-lg space-y-2 z-10">
                {/* Subtotal & GST */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">Subtotal</span>
                    <span className="font-black text-slate-900 text-sm">
                      ₹{newOrderSubtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Apply GST (5%)</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isGstEnabled}
                          onChange={(e) => setIsGstEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:bg-amber-600 transition-all after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-4 shadow-inner" />
                      </label>
                    </div>
                    <span className="font-bold text-slate-700 text-xs">
                      {isGstEnabled ? `₹${newOrderGst.toFixed(2)}` : "₹0.00"}
                    </span>
                  </div>
                </div>

                {/* Total Payable */}
                <div className="pt-2 border-t border-dashed border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    Total Amount
                  </span>
                  <span className="text-2xl font-black text-red-600 tracking-tight">
                    ₹{newOrderTotal.toFixed(2)}
                  </span>
                </div>

                {/* Payment Option Selector */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Method</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["UNPAID", "CASH", "UPI", "CARD"] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentChoice(method)}
                        className={`py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase transition cursor-pointer ${
                          paymentChoice === method
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60"
                        }`}
                      >
                        {method === "UNPAID" ? "Pay Later" : method}
                      </button>
                    ))}
                  </div>
                </div>

                {formError && (
                  <p className="text-xs text-red-600 font-semibold bg-red-50 p-2 rounded-xl border border-red-200">
                    {formError}
                  </p>
                )}

                {/* Dispatch Button */}
                <button
                  type="button"
                  onClick={handleCreateOrder}
                  disabled={isSubmittingOrder || cartItems.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-red-900/20 active:scale-95 transition disabled:opacity-40 cursor-pointer"
                >
                  {isSubmittingOrder ? (
                    <span>Placing Takeaway Ticket...</span>
                  ) : (
                    <>
                      <RiFireLine size={16} className="animate-pulse" />
                      <span>Order & Send KOT to Kitchen ➔</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: SETTLE / RECORD PAYMENT                                      */}
      {/* =================================================================== */}
      {settleOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">Settle Takeaway Bill</h3>
                <p className="text-xs text-slate-400">Order {settleOrder.orderNumber || "#TK"}</p>
              </div>
              <button
                onClick={() => setSettleOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="text-center py-2">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Amount to Collect</span>
              <p className="text-3xl font-black text-slate-900 tracking-tight mt-1">
                ₹{settleOrder.totalAmount?.toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                {(["CASH", "UPI", "CARD"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSettlePaymentMethod(method)}
                    className={`py-3 rounded-xl text-xs font-bold tracking-wider transition cursor-pointer border ${
                      settlePaymentMethod === method
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-900/20"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCompletePayment}
              disabled={isSubmittingPayment}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-950/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmittingPayment ? "Recording Payment..." : `Collect ₹${settleOrder.totalAmount?.toFixed(2)} & Handover`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
