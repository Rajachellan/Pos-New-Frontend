"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
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
  FiCreditCard,
  FiSmartphone,
  FiLayers,
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
  const [statusFilter, setStatusFilter] = useState<"PREPARING" | "READY" | "ACTIVE" | "COMPLETED" | "ALL">("PREPARING");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Order POS State
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuSearch, setMenuSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [dietFilter, setDietFilter] = useState<"ALL" | "VEG" | "NON_VEG" | "IN_ORDER">("ALL");
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

  // Auto-resolve branch context
  useEffect(() => {
    async function initBranches() {
      try {
        const res = await api.get("/get/branch/role");
        const list = res.data?.data || [];
        const stored = typeof window !== "undefined" ? localStorage.getItem("pos_selected_branch") : null;
        if (list.length === 1) {
          localStorage.setItem("pos_selected_branch", list[0]._id);
        } else if ((!stored || stored === "ALL") && list.length > 0) {
          localStorage.setItem("pos_selected_branch", list[0]._id);
        }
      } catch (err) {
        console.warn("Could not auto-resolve branch:", err);
      }
    }
    initBranches();
  }, []);

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
    const targetOrder = orders.find((o) => o._id === orderId);

    // Optimistically update React state immediately
    setOrders((prev) =>
      prev.map((o) => {
        if (o._id === orderId) {
          const updatedStatus = newStatus === "SERVED" ? "COMPLETED" : newStatus === "READY" ? "READY" : o.status;
          return {
            ...o,
            kitchenStatus: newStatus,
            status: updatedStatus,
          };
        }
        return o;
      })
    );

    if (newStatus === "READY") {
      setToastMessage(`Order ${targetOrder?.orderNumber || ""} marked Ready! Moved to "Ready for Pickup".`);
      setTimeout(() => setToastMessage(null), 4000);
    } else if (newStatus === "SERVED") {
      setToastMessage(`Order ${targetOrder?.orderNumber || ""} handed over! Moved to "Completed Today".`);
      setTimeout(() => setToastMessage(null), 3000);
    }

    try {
      await api.patch(`/kitchen/orders/${orderId}/status`, { status: newStatus });
      fetchOrders(true);
    } catch (err) {
      console.error("Failed to update order status", err);
      fetchOrders(true);
    }
  }

  // Settle & Complete Payment (DIRECTLY PRINTS RECEIPT!)
  async function handleCompletePayment(
    targetOrder?: TakeawayOrder,
    methodOverride?: "CASH" | "UPI" | "CARD"
  ) {
    const orderToSettle = targetOrder || settleOrder;
    if (!orderToSettle) return;
    const paymentMethodToUse = methodOverride || settlePaymentMethod || "CASH";

    setIsSubmittingPayment(true);
    try {
      await api.post("/pay/order", {
        orderId: orderToSettle._id,
        paymentMethod: paymentMethodToUse,
      });

      const updatedOrder: TakeawayOrder = {
        ...orderToSettle,
        status: "COMPLETED",
        kitchenStatus: "SERVED",
        paymentMethod: paymentMethodToUse,
      };

      // Optimistically update React state immediately
      setOrders((prev) =>
        prev.map((o) => (o._id === orderToSettle._id ? updatedOrder : o))
      );

      // DIRECTLY TRIGGER THERMAL RECEIPT PRINT!
      await handlePrintReceipt(updatedOrder);

      setSettleOrder(null);
      setToastMessage(
        `Order ${orderToSettle.orderNumber || ""} billed via ${paymentMethodToUse} and receipt printed!`
      );
      setTimeout(() => setToastMessage(null), 3500);
      fetchOrders(true);
    } catch (err) {
      console.error("Failed to complete payment and print receipt", err);
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
  async function handleCreateOrder(
    e?: React.FormEvent,
    overridePaymentMethod?: "UNPAID" | "CASH" | "UPI" | "CARD"
  ) {
    if (e) e.preventDefault();
    if (cartItems.length === 0) {
      setFormError("Please add at least one item to the takeaway order.");
      return;
    }
    const chosenPayment = overridePaymentMethod || paymentChoice;
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
        paymentMethod: chosenPayment === "UNPAID" ? "" : chosenPayment,
        branchId: savedBranchId && savedBranchId !== "ALL" ? savedBranchId : undefined,
      };

      const res = await api.post("/takeaway/create", payload);
      const createdOrder = res?.data?.data;

      // Reset Form & Close Modal
      setCartItems([]);
      setCustomerName("");
      setCustomerPhone("");
      setSpecialNotes("");
      setPaymentChoice("UNPAID");
      setIsNewOrderModalOpen(false);

      // Auto-print thermal bill receipt immediately on Bill and Pay!
      if (createdOrder) {
        await handlePrintReceipt(createdOrder);
      }

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
        dateStr: new Date(order.createdAt || new Date()).toLocaleString("en-IN", {
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

      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (e) {
          // ignore
        }
      }, 300);
    } catch (err) {
      console.error("Failed to generate thermal receipt", err);
    }
  }

  // Filtered Orders Logic
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Status filtering
      if (statusFilter === "ACTIVE") {
        if (o.status === "COMPLETED" || o.status === "CANCELLED" || o.kitchenStatus === "SERVED") return false;
      } else if (statusFilter === "READY") {
        if (o.kitchenStatus !== "READY" || o.status === "COMPLETED" || o.status === "CANCELLED") return false;
      } else if (statusFilter === "PREPARING") {
        if (o.kitchenStatus === "READY" || o.kitchenStatus === "SERVED" || o.status === "COMPLETED" || o.status === "CANCELLED") return false;
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

  const inKitchenCount = useMemo(() => {
    return orders.filter(
      (o) =>
        (o.status === "ORDERED" || o.status === "PREPARING" || !o.kitchenStatus || o.kitchenStatus === "PREPARING" || o.kitchenStatus === "NEW") &&
        o.kitchenStatus !== "READY" &&
        o.kitchenStatus !== "SERVED" &&
        o.status !== "COMPLETED" &&
        o.status !== "CANCELLED"
    ).length;
  }, [orders]);

  const readyCount = useMemo(() => {
    return orders.filter((o) => o.kitchenStatus === "READY" && o.status !== "COMPLETED" && o.status !== "CANCELLED").length;
  }, [orders]);

  const activeCount = useMemo(() => {
    return inKitchenCount + readyCount;
  }, [inKitchenCount, readyCount]);

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
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [menuItems]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    menuItems.forEach((item) => {
      const cat = getDishCategory(item).toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [menuItems]);

  const inCartMenuIds = useMemo(() => new Set(cartItems.map((ci) => ci.menuItem._id)), [cartItems]);

  // Filtered menu items for POS catalog
  const filteredMenuItems = useMemo(() => {
    const q = menuSearch.trim().toLowerCase();

    return menuItems.filter((item) => {
      if (dietFilter === "IN_ORDER" && !inCartMenuIds.has(item._id)) return false;
      const isVeg = isDishVeg(item);
      if (dietFilter === "VEG" && !isVeg) return false;
      if (dietFilter === "NON_VEG" && isVeg) return false;

      const cat = getDishCategory(item);
      const matchesCategory =
        selectedCategory === "ALL" ||
        cat.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, menuSearch, dietFilter, inCartMenuIds]);

  // Partitioned lists for clean separate sections
  const vegDishes = useMemo(() => filteredMenuItems.filter((m) => isDishVeg(m)), [filteredMenuItems]);
  const nonVegDishes = useMemo(() => filteredMenuItems.filter((m) => !isDishVeg(m)), [filteredMenuItems]);

  // Render a dish card matching the POS Menu style from menus/page.tsx
  function renderCatalogDishCard(item: MenuItem, isVegDish: boolean) {
    const cartEntry = cartItems.find((ci) => ci.menuItem._id === item._id);
    const qty = cartEntry?.quantity || 0;
    const catName = getDishCategory(item);

    return (
      <div
        key={item._id}
        onClick={() => {
          if (qty === 0) {
            addItemToCart(item);
          }
        }}
        className={`rounded-2xl p-3 sm:p-3.5 transition-all flex flex-col justify-between group h-36 relative select-none ${
          qty > 0
            ? "bg-red-50/30 border-2 border-[#e02424] shadow-xs ring-2 ring-red-500/10 cursor-default"
            : isVegDish
            ? "bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-500 hover:ring-2 hover:ring-emerald-100 cursor-pointer"
            : "bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-red-400 hover:ring-2 hover:ring-red-100 cursor-pointer"
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`w-3.5 h-3.5 rounded-xs border-2 flex items-center justify-center bg-white shrink-0 ${
                  isVegDish ? "border-emerald-600" : "border-rose-700"
                }`}
                title={isVegDish ? "Pure Veg" : "Non-Veg"}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isVegDish ? "bg-emerald-600" : "bg-rose-700"}`} />
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 truncate">
                {catName || "General"}
              </span>
            </div>

            {qty > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-[#e02424] text-white shadow-2xs shrink-0 animate-in zoom-in-75 duration-150">
                <FiCheckCircle size={9} />
                <span>{qty} In Order</span>
              </span>
            )}
          </div>

          <h3
            className={`text-xs sm:text-[13px] font-bold leading-snug line-clamp-2 transition-colors ${
              qty > 0 ? "text-slate-900 font-extrabold" : "text-slate-800 group-hover:text-slate-900"
            }`}
            title={item.name}
          >
            {item.name}
          </h3>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
          <div>
            <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              ₹{Number(item.price).toFixed(2)}
            </span>
          </div>

          {qty > 0 ? (
            <div
              className="flex items-center bg-white rounded-lg p-0.5 border border-red-200 shadow-2xs shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => updateCartQuantity(item._id, -1)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-slate-700 hover:text-[#e02424] transition active:scale-90 cursor-pointer"
                title="Decrease quantity"
              >
                <FiMinus size={11} />
              </button>
              <span className="w-5 text-center font-black text-[#e02424] text-xs">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => updateCartQuantity(item._id, 1)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-slate-700 hover:text-[#e02424] transition active:scale-90 cursor-pointer"
                title="Increase quantity"
              >
                <FiPlus size={11} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addItemToCart(item);
              }}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95 shrink-0 ${
                isVegDish
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                  : "bg-red-50 text-[#e02424] hover:bg-[#e02424] hover:text-white"
              }`}
              title="Add to order"
            >
              <FiPlus size={13} />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderOrderCard(order: TakeawayOrder) {
    const isReady = order.kitchenStatus === "READY";
    const isCompleted = order.status === "COMPLETED";
    const isPreparing = !isReady && !isCompleted;
    const isPaid = Boolean(order.paymentMethod);

    return (
      <div
        key={order._id}
        className="flex flex-col justify-between rounded-xl p-4 bg-white border border-gray-200 shadow-xs hover:shadow-md hover:border-gray-300 transition-all duration-150"
      >
        <div>
          {/* Top Bar with Token & Badges */}
          <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-900 border border-gray-200">
                {order.orderNumber || "#TK"}
              </span>
              {isReady ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <FiCheckCircle size={11} /> Ready
                </span>
              ) : isPreparing ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                  <FiClock size={11} /> In Kitchen
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                  Completed
                </span>
              )}
            </div>

            <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
              <FiClock size={11} />
              {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Customer Info */}
          {(order.customerName || order.customerPhone) && (
            <div className="mb-2.5 pb-2 border-b border-gray-100 flex items-center justify-between text-xs text-gray-700">
              <div className="flex items-center gap-1.5 truncate">
                <FiUser size={12} className="text-gray-400 shrink-0" />
                <span className="font-semibold text-gray-800 truncate">{order.customerName || "Walk-in Guest"}</span>
              </div>
              {order.customerPhone && (
                <a
                  href={`tel:${order.customerPhone}`}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-900 shrink-0 text-[11px] font-medium"
                >
                  <FiPhone size={11} />
                  <span>{order.customerPhone}</span>
                </a>
              )}
            </div>
          )}

          {/* Items List */}
          <div className="space-y-1.5 my-2.5 max-h-36 overflow-y-auto scrollbar-none pr-1">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-gray-800">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-gray-900 w-5 text-right">{item.quantity}×</span>
                  <span className="text-gray-700 truncate">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-900 text-xs shrink-0">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Packaging Notes */}
          {order.notes && (
            <div className="mb-2.5 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-[11px] text-gray-600">
              <span className="font-bold text-gray-700">Packing: </span>
              {order.notes}
            </div>
          )}
        </div>

        {/* Bottom Card Footer */}
        <div className="pt-3 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total</span>
              <p className="text-lg font-black text-gray-900 leading-tight">
                ₹{order.totalAmount?.toFixed(2)}
              </p>
            </div>

            <div>
              <span
                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  isPaid
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {isPaid ? `Paid (${order.paymentMethod})` : "Unpaid (Due)"}
              </span>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center gap-1.5 pt-1">
            {isPreparing && (
              <>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(order._id, "READY")}
                  className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition cursor-pointer"
                  title="Move order to Ready for Pickup"
                >
                  <FiCheckCircle size={13} className="inline mr-1 text-emerald-600" />
                  Ready
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isPaid) {
                      handleCompletePayment(order, (order.paymentMethod as any) || "CASH");
                    } else {
                      setSettleOrder(order);
                      setSettlePaymentMethod("CASH");
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs tracking-wide shadow-xs active:scale-[0.98] transition cursor-pointer"
                  title="Settle bill and print receipt"
                >
                  <FiPrinter size={14} />
                  <span>{isPaid ? "Handover & Print" : "Bill & Print"}</span>
                </button>
              </>
            )}

            {isReady && !isPaid && (
              <button
                type="button"
                onClick={() => {
                  setSettleOrder(order);
                  setSettlePaymentMethod("CASH");
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs tracking-wide shadow-xs active:scale-[0.98] transition cursor-pointer"
                title="Collect payment and automatically print receipt"
              >
                <FiPrinter size={14} />
                <span>Bill & Print</span>
              </button>
            )}

            {isReady && isPaid && (
              <button
                type="button"
                onClick={() => handleCompletePayment(order, (order.paymentMethod as any) || "CASH")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs tracking-wide shadow-xs active:scale-[0.98] transition cursor-pointer"
                title="Hand over to customer and automatically print receipt"
              >
                <FiPrinter size={14} />
                <span>Hand Over & Print</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handlePrintReceipt(order)}
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition cursor-pointer shrink-0"
              title="Print Parcel Slip / Receipt"
            >
              <FiPrinter size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Settle & Print Modal
  const renderSettleModal = () => {
    if (!settleOrder) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                <FiPrinter size={18} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 leading-tight">
                  Settle & Print Receipt
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Order <span className="font-bold text-slate-700">{settleOrder.orderNumber || "#TK"}</span>
                  {settleOrder.customerName ? ` • ${settleOrder.customerName}` : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSettleOrder(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Total Amount Payable Banner */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Payable
            </span>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
              ₹{settleOrder.totalAmount?.toFixed(2)}
            </p>
            <div className="mt-1 text-[11px] text-slate-500 font-medium">
              {settleOrder.items?.reduce((acc, it) => acc + (it.quantity || 1), 0)} items total
              {settleOrder.gstAmount ? ` • Inc. GST ₹${settleOrder.gstAmount.toFixed(2)}` : ""}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: "CASH", label: "Cash", sub: "Physical cash", icon: FiDollarSign },
                { id: "UPI", label: "UPI / QR", sub: "GPay / PhonePe", icon: FiSmartphone },
                { id: "CARD", label: "Card", sub: "Debit / Credit", icon: FiCreditCard },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = settlePaymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSettlePaymentMethod(m.id as "CASH" | "UPI" | "CARD")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon size={18} className={isSelected ? "text-white" : "text-slate-600"} />
                      {isSelected && <FiCheck size={14} className="text-emerald-400" />}
                    </div>
                    <div>
                      <span className="block font-bold text-xs">{m.label}</span>
                      <span className={`block text-[10px] mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                        {m.sub}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={() => handleCompletePayment(settleOrder, settlePaymentMethod)}
              disabled={isSubmittingPayment}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-slate-900/15 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
            >
              <FiPrinter size={15} />
              <span>
                {isSubmittingPayment
                  ? "Processing Payment..."
                  : `Collect ₹${settleOrder.totalAmount?.toFixed(2)} via ${settlePaymentMethod} & Print`}
              </span>
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setSettleOrder(null)}
                className="text-slate-500 hover:text-slate-700 font-medium py-1 px-2 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!settleOrder) return;
                  setIsSubmittingPayment(true);
                  try {
                    await api.post("/pay/order", {
                      orderId: settleOrder._id,
                      paymentMethod: settlePaymentMethod || "CASH",
                    });
                    try {
                      await api.patch(`/kitchen/orders/${settleOrder._id}/status`, { status: "SERVED" });
                    } catch (e) {}
                    setSettleOrder(null);
                    fetchOrders(true);
                  } catch (e) {
                    console.error("Failed to settle without printing", e);
                  } finally {
                    setIsSubmittingPayment(false);
                  }
                }}
                disabled={isSubmittingPayment}
                className="text-slate-400 hover:text-slate-600 underline font-medium py-1 px-2 transition"
              >
                Settle without printing
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return !isNewOrderModalOpen ? (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <RiTakeawayLine className="text-[#e02424]" /> Takeaway & Parcel Counter
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage takeaway tokens, kitchen parcel packaging, customer pickups & billing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchOrders(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shadow-xs w-fit cursor-pointer"
            title="Refresh Feed"
          >
            <FiRefreshCw className={isRefreshing ? "animate-spin text-[#e02424]" : ""} />
            <span>Refresh Feed</span>
          </button>

          <button
            onClick={() => setIsNewOrderModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#e02424] hover:bg-[#c81e1e] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <FiPlus size={15} />
            <span>New Takeaway Order</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          onClick={() => setStatusFilter("PREPARING")}
          className={`bg-white p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
            statusFilter === "PREPARING"
              ? "border-[#e02424] ring-2 ring-[#e02424]/10 shadow-xs"
              : "border-gray-200 hover:border-gray-300 shadow-xs"
          }`}
        >
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">In Kitchen</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{inKitchenCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
            <FiClock />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("READY")}
          className={`bg-white p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
            statusFilter === "READY"
              ? "border-[#e02424] ring-2 ring-[#e02424]/10 shadow-xs"
              : "border-gray-200 hover:border-gray-300 shadow-xs"
          }`}
        >
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ready for Pickup</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{readyCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            <FiCheckCircle />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("COMPLETED")}
          className={`bg-white p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
            statusFilter === "COMPLETED"
              ? "border-[#e02424] ring-2 ring-[#e02424]/10 shadow-xs"
              : "border-gray-200 hover:border-gray-300 shadow-xs"
          }`}
        >
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Today&apos;s Parcel Sales</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">₹{todaySales.toFixed(2)}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#fdf2f2] text-[#e02424] flex items-center justify-center text-xl font-bold">
            <FiDollarSign />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("ALL")}
          className={`bg-white p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
            statusFilter === "ALL"
              ? "border-[#e02424] ring-2 ring-[#e02424]/10 shadow-xs"
              : "border-gray-200 hover:border-gray-300 shadow-xs"
          }`}
        >
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Today</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{todayOrders.length}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-bold">
            <FiTag />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: "ACTIVE", label: `Active Pipeline (${activeCount})` },
            { key: "PREPARING", label: `In Kitchen (${inKitchenCount})` },
            { key: "READY", label: `Ready for Pickup (${readyCount})` },
            { key: "COMPLETED", label: "Completed Today" },
            { key: "ALL", label: `All Orders (${orders.length})` },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? "bg-[#e02424] text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search Token, Customer, Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-gray-50 border border-gray-300 text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e02424]"
          />
        </div>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-gray-100 animate-pulse border border-gray-200" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center rounded-xl bg-white border border-dashed border-gray-300 shadow-xs">
          <FiShoppingBag className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-base font-bold text-gray-700">No Takeaway Orders Found</p>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No takeaway orders matched "${searchQuery}".`
              : statusFilter === "PREPARING"
              ? "All caught up! No pending takeaway orders in kitchen."
              : statusFilter === "READY"
              ? "No orders currently waiting for customer pickup."
              : "Click the 'New Takeaway Order' button above to place a parcel ticket."}
          </p>
        </div>
      ) : statusFilter === "ACTIVE" ? (
        /* Segmented Active Pipeline: separates orders being cooked from orders ready for collection */
        <div className="space-y-6">
          {(() => {
            const inKitchenOrders = filteredOrders.filter(
              (o) => o.kitchenStatus !== "READY" && o.status !== "COMPLETED"
            );
            const readyOrders = filteredOrders.filter(
              (o) => o.kitchenStatus === "READY" && o.status !== "COMPLETED"
            );

            return (
              <>
                {/* Section 1: In Kitchen */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                      <h3 className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wider">
                        In Kitchen & Preparing ({inKitchenOrders.length})
                      </h3>
                    </div>
                    <span className="text-[11px] font-medium text-gray-500">
                      Click &quot;Ready&quot; when packaging is complete
                    </span>
                  </div>

                  {inKitchenOrders.length === 0 ? (
                    <div className="p-6 rounded-xl bg-white border border-gray-200 text-xs text-gray-500 font-medium text-center">
                      No takeaway orders currently in kitchen. All dishes are packed!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {inKitchenOrders.map((order) => renderOrderCard(order))}
                    </div>
                  )}
                </div>

                {/* Section 2: Ready for Pickup */}
                <div className="space-y-3 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <h3 className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wider">
                        Ready for Pickup ({readyOrders.length})
                      </h3>
                    </div>
                    <span className="text-[11px] font-medium text-gray-500">
                      Awaiting customer arrival & handover
                    </span>
                  </div>

                  {readyOrders.length === 0 ? (
                    <div className="p-6 rounded-xl bg-white border border-gray-200 text-xs text-gray-500 font-medium text-center">
                      No ready orders waiting for pickup right now.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {readyOrders.map((order) => renderOrderCard(order))}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => renderOrderCard(order))}
        </div>
      )}

      {/* Realtime Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <FiCheckCircle className="text-emerald-400 shrink-0" size={18} />
          <span className="text-xs font-semibold">{toastMessage}</span>
          {statusFilter !== "READY" && toastMessage.includes("Ready") && (
            <button
              onClick={() => setStatusFilter("READY")}
              className="ml-2 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer"
            >
              View Ready ➔
            </button>
          )}
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg ml-1"
          >
            <FiX size={14} />
          </button>
        </div>
      )}
      {renderSettleModal()}
    </div>
  ) : (
    <div className="h-[calc(100vh-65px)] flex flex-col bg-slate-50 relative overflow-hidden w-full min-w-0 max-w-full animate-in fade-in duration-150">
      
      {/* Top POS Header Bar */}
      <div className="h-14 sm:h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center">
            <span className="mr-2 p-1.5 bg-red-100 rounded-lg text-[#e02424]">
              <RiTakeawayLine size={20} />
            </span>
            Takeaway Menu
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNewOrderModalOpen(false)}
            className="text-xs font-bold text-gray-700 hover:text-slate-900 transition flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 shadow-2xs cursor-pointer"
            title="Return to Takeaway Orders Board"
          >
            <FiArrowLeft size={13} /> Back to Orders Board
          </button>

          <Link
            href="/user-dashboard/tables"
            className="text-xs font-bold text-gray-700 hover:text-slate-900 transition flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 shadow-2xs"
            title="Floors & Tables"
          >
            Floors & Tables
          </Link>

              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Clear all items from this ticket?")) {
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
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer ml-1"
                title="Close POS Counter (Esc)"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          {/* POS Counter Main Body */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
            
            {/* 1. LEFT COLUMN: MENU (SEARCH + DIET SWITCH, CATEGORIES SIDEBAR, DISHES GRID) */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0 h-full border-r border-slate-200 bg-white overflow-hidden">
              
              {/* Search Bar & Diet Filters Row */}
              <div className="p-3 sm:p-4 border-b border-slate-100 space-y-2.5 shrink-0 min-w-0 w-full">
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                  {/* Search Bar */}
                  <div className="relative group flex-1 min-w-[200px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#e02424] transition-colors">
                      <FiSearch size={16} />
                    </div>
                    <input
                      type="text"
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      placeholder="Search menu items..."
                      className="block w-full pl-10 pr-8 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#e02424] focus:border-transparent transition-all text-sm font-medium text-slate-800"
                    />
                    {menuSearch && (
                      <button
                        type="button"
                        onClick={() => setMenuSearch("")}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Clear search"
                      >
                        <FiX size={15} />
                      </button>
                    )}
                  </div>

                  {/* Diet Segmented Switch */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDietFilter("ALL")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
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
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        dietFilter === "VEG"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-emerald-700 hover:bg-emerald-50/80"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-xs border border-current flex items-center justify-center">
                        <span className="w-1 h-1 rounded-full bg-current" />
                      </span>
                      <span>Veg ({totalVegCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDietFilter("NON_VEG")}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        dietFilter === "NON_VEG"
                          ? "bg-rose-700 text-white shadow-xs"
                          : "text-rose-700 hover:bg-rose-50/80"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-xs border border-current flex items-center justify-center">
                        <span className="w-1 h-1 rounded-full bg-current" />
                      </span>
                      <span>Non-Veg ({totalNonVegCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDietFilter("IN_ORDER")}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        dietFilter === "IN_ORDER"
                          ? "bg-[#e02424] text-white shadow-xs"
                          : "text-slate-700 hover:text-[#e02424] hover:bg-red-50/80"
                      }`}
                    >
                      <FiCheckCircle size={11} className={dietFilter === "IN_ORDER" ? "text-white" : "text-[#e02424]"} />
                      <span>In Order ({cartItems.length})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Menu Body: Left Categories Sidebar + Right Dishes Grid */}
              <div className="flex-1 flex flex-row min-h-0 min-w-0 overflow-hidden">
                
                {/* 🏷️ CATEGORIES SIDEBAR ON THE LEFT */}
                <div className="w-48 sm:w-52 lg:w-56 shrink-0 border-r border-slate-200 bg-slate-50/70 flex flex-col h-full overflow-hidden select-none">
                  <div className="px-3.5 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <FiLayers className="text-[#e02424]" size={15} />
                      Categories
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
                      {categories.length + 1}
                    </span>
                  </div>

                  {/* Scrollable category list */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("ALL")}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer text-left ${
                        selectedCategory === "ALL"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-700 hover:bg-slate-200/80 hover:text-slate-900"
                      }`}
                    >
                      <span className="truncate">All Categories</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1.5 shrink-0 ${
                          selectedCategory === "ALL"
                            ? "bg-white/20 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {menuItems.length}
                      </span>
                    </button>

                    {categories.map((cat) => {
                      const normalized = cat.toLowerCase();
                      const count = categoryCounts[normalized] || 0;
                      const isSelected = selectedCategory.toLowerCase() === normalized;

                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer text-left ${
                            isSelected
                              ? "bg-[#e02424] text-white shadow-xs shadow-red-200"
                              : "text-slate-700 hover:bg-slate-200/80 hover:text-slate-900"
                          }`}
                        >
                          <span className="truncate leading-tight" title={cat}>
                            {cat}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1.5 shrink-0 ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 🍽️ DISHES GRID */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-50/50 space-y-4 min-w-0">
                  {/* Active Category Banner (if filtered) */}
                  {selectedCategory !== "ALL" && (
                    <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-xs shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-slate-400 font-bold">Category:</span>
                        <span className="uppercase text-[#e02424] font-black truncate">{selectedCategory}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-[#e02424] font-bold border border-red-100 shrink-0">
                          {filteredMenuItems.length} dishes
                        </span>
                        {dietFilter !== "ALL" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold uppercase border border-slate-200">
                            Filter: {dietFilter.replace("_", " ")}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory("ALL");
                          if (dietFilter === "IN_ORDER") setDietFilter("ALL");
                        }}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer hover:underline shrink-0 ml-2"
                      >
                        <FiX size={13} /> View All Dishes
                      </button>
                    </div>
                  )}

                  {filteredMenuItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6 text-center">
                      <p className="font-bold tracking-tight text-slate-700 text-sm">
                        {dietFilter === "IN_ORDER"
                          ? "No items selected in this ticket yet"
                          : selectedCategory !== "ALL"
                          ? `No ${dietFilter === "VEG" ? "Vegetarian " : dietFilter === "NON_VEG" ? "Non-Vegetarian " : ""}dishes found in ${selectedCategory.toUpperCase()}`
                          : "No menu items found"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1.5 max-w-sm text-center">
                        {dietFilter === "IN_ORDER"
                          ? "Click on any dish from the catalog to add it to the ticket."
                          : "Try switching diet filters or select another category."}
                      </p>
                      <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
                        {dietFilter !== "ALL" && (
                          <button
                            type="button"
                            onClick={() => setDietFilter("ALL")}
                            className="px-3.5 py-1.5 bg-[#e02424] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer hover:bg-red-700"
                          >
                            Show All Diet ({menuItems.length})
                          </button>
                        )}
                        {selectedCategory !== "ALL" && (
                          <button
                            type="button"
                            onClick={() => setSelectedCategory("ALL")}
                            className="px-3.5 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer hover:bg-slate-900"
                          >
                            View All Categories
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* 🟢 VEGETARIAN DISHES SECTION */}
                      {(dietFilter === "ALL" || dietFilter === "VEG" || dietFilter === "IN_ORDER") && vegDishes.length > 0 && (
                        <div className="space-y-2.5 min-w-0">
                          <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/80">
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

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-3">
                            {vegDishes.map((item) => renderCatalogDishCard(item, true))}
                          </div>
                        </div>
                      )}

                      {/* 🔴 NON-VEGETARIAN DISHES SECTION */}
                      {(dietFilter === "ALL" || dietFilter === "NON_VEG" || dietFilter === "IN_ORDER") && nonVegDishes.length > 0 && (
                        <div className="space-y-2.5 min-w-0">
                          <div className="flex items-center justify-between pb-1.5 border-b border-rose-200/80">
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

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-3">
                            {nonVegDishes.map((item) => renderCatalogDishCard(item, false))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 2. RIGHT COLUMN: TAKEAWAY ORDER / CART PANEL (MATCHING IMAGE 2) */}
            <div className="w-[340px] lg:w-[360px] xl:w-[380px] flex flex-col bg-white border-l border-slate-200 h-full shrink-0 min-h-0 min-w-0 z-20">
              
              {/* Order Header */}
              <div className="px-3.5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 min-w-0 z-20">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-9 h-9 bg-[#e02424] rounded-xl flex items-center justify-center text-white shadow-md shadow-red-200 shrink-0 font-black text-xs">
                    TK
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-black text-slate-900 text-sm tracking-tight truncate">
                        Order Details
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-50 text-[#e02424] border border-red-100 shrink-0">
                        {cartItems.reduce((acc, c) => acc + c.quantity, 0)} Items
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      TAKEAWAY / PARCEL
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {cartItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCartItems([])}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer px-1.5 py-0.5"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsNewOrderModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                    title="Close"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              </div>

              {/* Customer Details Form */}
              <div className="p-3 border-b border-slate-100 bg-slate-50/60 space-y-2 shrink-0">
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <FiUser className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                    <input
                      ref={customerNameInputRef}
                      type="text"
                      placeholder="Customer Name"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (formError) setFormError("");
                      }}
                      className="w-full pl-7 pr-2 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#e02424] font-medium text-slate-800"
                    />
                  </div>
                  <div className="relative">
                    <FiPhone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pl-7 pr-2 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#e02424] font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="relative">
                  <FiShoppingBag className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                  <input
                    type="text"
                    placeholder="Packaging instructions (e.g. pack sambar separate)..."
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#e02424] font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#e02424] flex items-center justify-center mb-2.5">
                      <RiTakeawayLine size={24} />
                    </div>
                    <p className="font-bold text-slate-800 text-sm">No dishes added yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                      Select dishes from the menu catalog on the left to pack.
                    </p>
                  </div>
                ) : (
                  cartItems.map((ci) => {
                    const lineTotal = (ci.menuItem.price * ci.quantity).toFixed(2);
                    return (
                      <div
                        key={ci.menuItem._id}
                        className="py-2 px-2.5 rounded-xl border border-slate-200 bg-white hover:border-gray-300 transition-all flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0 pr-1">
                          <h4 className="font-bold text-slate-900 text-xs truncate" title={ci.menuItem.name}>
                            {ci.menuItem.name}
                          </h4>
                          <span className="text-[11px] font-bold text-slate-400">
                            ₹{Number(ci.menuItem.price).toFixed(2)}
                          </span>
                        </div>

                        {/* Stepper, line total, remove */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(ci.menuItem._id, -1)}
                              className="w-5 h-5 flex items-center justify-center rounded hover:bg-white text-slate-600 transition active:scale-90 cursor-pointer"
                              title="Decrease"
                            >
                              <FiMinus size={11} />
                            </button>
                            <span className="w-5 text-center font-black text-slate-900 text-xs">{ci.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(ci.menuItem._id, 1)}
                              className="w-5 h-5 flex items-center justify-center rounded hover:bg-white text-slate-600 transition active:scale-90 cursor-pointer"
                              title="Increase"
                            >
                              <FiPlus size={11} />
                            </button>
                          </div>

                          <div className="w-14 text-right">
                            <span className="font-bold text-slate-900 text-xs">₹{lineTotal}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => updateCartQuantity(ci.menuItem._id, -ci.quantity)}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1 cursor-pointer"
                            title="Remove"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Billing Summary & Actions Footer (Matching 2nd image) */}
              <div className="border-t border-slate-200 bg-white px-4 py-3 shrink-0 space-y-2 z-10 shadow-lg">
                {formError && (
                  <p className="text-xs text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-200">
                    {formError}
                  </p>
                )}

                {/* Subtotal & GST */}
                <div className="space-y-1 text-xs">
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
                        <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:bg-[#e02424] transition-all after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-4 shadow-inner" />
                      </label>
                    </div>
                    <span className="font-bold text-slate-700 text-xs">
                      {isGstEnabled ? `₹${newOrderGst.toFixed(2)}` : "₹0.00"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">Service Charge</span>
                    <span className="font-semibold text-slate-700 text-xs">₹0.00</span>
                  </div>
                </div>

                {/* Total Payable */}
                <div className="pt-2 border-t border-dashed border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    Total Payable
                  </span>
                  <span className="text-2xl font-black text-[#e02424] tracking-tight">
                    ₹{newOrderTotal.toFixed(2)}
                  </span>
                </div>

                {/* Main Action Buttons Matching Image 2 */}
                <div className="pt-1 space-y-2">
                  {/* Primary: ORDER & SEND TO KITCHEN (KOT) */}
                  <button
                    type="button"
                    onClick={(e) => handleCreateOrder(e, "UNPAID")}
                    disabled={isSubmittingOrder || cartItems.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#e02424] hover:bg-[#c81e1e] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-red-900/20 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
                  >
                    <span>{isSubmittingOrder ? "Submitting..." : "Order & Send to Kitchen (KOT) ➔"}</span>
                  </button>

                  {/* Secondary Row: BILL (White button) & PAY (Green button) */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleCreateOrder(e, "UNPAID")}
                      disabled={isSubmittingOrder || cartItems.length === 0}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs uppercase tracking-wider transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                      <FiPrinter size={13} />
                      <span>Bill</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleCreateOrder(e, "CASH")}
                      disabled={isSubmittingOrder || cartItems.length === 0}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                      <FiCheckCircle size={13} />
                      <span>Pay</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {renderSettleModal()}
        </div>
    );
}
