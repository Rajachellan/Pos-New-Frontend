"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "../../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { FaHistory } from "react-icons/fa";
import {
  FiSearch,
  FiPrinter,
  FiEye,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiX,
  FiRefreshCw,
  FiCalendar,
  FiShoppingBag,
  FiFilter,
  FiArrowRight,
  FiTrendingUp,
} from "react-icons/fi";
import { MdTableRestaurant, MdDateRange } from "react-icons/md";
import { useAuth } from "@/src/app/context/AuthContext";
import { getActiveBranchReceiptInfo, generateThermalReceiptHtml } from "../../utils/receiptBranding";

interface OrderItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
}

interface TableInfo {
  _id: string;
  tableNumber: string | number;
}

interface Order {
  _id: string;
  orderNumber?: string;
  orderType?: string;
  tableId?: TableInfo;
  items: OrderItem[];
  subtotal?: number;
  gstAmount?: number;
  totalAmount: number;
  paymentMethod?: string;
  status: "PENDING" | "ORDERED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}

interface Summary {
  totalOrders: number;
  totalRevenue: number | null;
  activeCount: number;
  cancelledCount: number;
  canViewFinances?: boolean;
  todayRevenue?: number;
  yesterdayRevenue?: number;
  thisMonthRevenue?: number;
}

type DatePreset =
  | "ALL"
  | "TODAY"
  | "YESTERDAY"
  | "THIS_MONTH"
  | "SPECIFIC_DATE"
  | "SPECIFIC_MONTH"
  | "CUSTOM_RANGE";

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getLocalMonthString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const calculateDateRange = (
  preset: DatePreset,
  customFrom: string,
  customTo: string,
  specificDate: string,
  specificMonth: string
): { startDate?: string; endDate?: string; label: string } => {
  const now = new Date();

  switch (preset) {
    case "TODAY": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const dateLabel = now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        label: `Today (${dateLabel})`,
      };
    }
    case "YESTERDAY": {
      const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
      const end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
      const dateLabel = y.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        label: `Yesterday (${dateLabel})`,
      };
    }
    case "THIS_MONTH": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        label: `This Month (${monthLabel})`,
      };
    }
    case "SPECIFIC_DATE": {
      if (!specificDate) return { label: "Pick a Date" };
      const [year, month, day] = specificDate.split("-").map(Number);
      const start = new Date(year, month - 1, day, 0, 0, 0, 0);
      const end = new Date(year, month - 1, day, 23, 59, 59, 999);
      const dateLabel = start.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        label: `Date: ${dateLabel}`,
      };
    }
    case "SPECIFIC_MONTH": {
      if (!specificMonth) return { label: "Pick a Month" };
      const [year, month] = specificMonth.split("-").map(Number);
      const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      const monthLabel = start.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        label: `Month: ${monthLabel}`,
      };
    }
    case "CUSTOM_RANGE": {
      if (!customFrom || !customTo) return { label: "Custom Date Range" };
      const [sY, sM, sD] = customFrom.split("-").map(Number);
      const start = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
      const [eY, eM, eD] = customTo.split("-").map(Number);
      const end = new Date(eY, eM - 1, eD, 23, 59, 59, 999);
      const fromLabel = start.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      const toLabel = end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        label: `${fromLabel} - ${toLabel}`,
      };
    }
    case "ALL":
    default:
      return {
        label: "All Time",
      };
  }
};

function OrderHistoryContent() {
  const { canViewFinances } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalOrders: 0,
    totalRevenue: 0,
    activeCount: 0,
    cancelledCount: 0,
    todayRevenue: 0,
    yesterdayRevenue: 0,
    thisMonthRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>(tabParam ? tabParam.toUpperCase() : "ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Date Filtering States
  const [datePreset, setDatePreset] = useState<DatePreset>("ALL");
  const [specificDate, setSpecificDate] = useState<string>(getLocalDateString());
  const [specificMonth, setSpecificMonth] = useState<string>(getLocalMonthString());
  const [customFrom, setCustomFrom] = useState<string>(getLocalDateString());
  const [customTo, setCustomTo] = useState<string>(getLocalDateString());

  // Active filter range sent to server
  const [activeDateRange, setActiveDateRange] = useState<{
    startDate?: string;
    endDate?: string;
    label: string;
  }>({ label: "All Time" });

  useEffect(() => {
    if (tabParam) {
      setSelectedStatus(tabParam.toUpperCase());
    }
  }, [tabParam]);

  const fetchOrders = async (range?: { startDate?: string; endDate?: string }) => {
    try {
      setLoading(true);
      const savedBranchId = typeof window !== "undefined" ? localStorage.getItem("pos_selected_branch") : null;
      const params = new URLSearchParams();

      if (savedBranchId && savedBranchId !== "ALL") {
        params.append("branchId", savedBranchId);
      }

      const targetRange = range !== undefined ? range : activeDateRange;
      if (targetRange?.startDate) params.append("startDate", targetRange.startDate);
      if (targetRange?.endDate) params.append("endDate", targetRange.endDate);

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const res = await api.get(`/orders/history${queryString}`);

      if (res.data.success) {
        setOrders(res.data.data);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error("Failed to fetch order history:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const range = calculateDateRange(preset, customFrom, customTo, specificDate, specificMonth);
    setActiveDateRange(range);
    fetchOrders(range);
  };

  const handleApplyCustomRange = () => {
    if (!customFrom || !customTo) return;
    const range = calculateDateRange("CUSTOM_RANGE", customFrom, customTo, specificDate, specificMonth);
    setActiveDateRange(range);
    fetchOrders(range);
  };

  const handleApplySpecificDate = (dateVal: string) => {
    setSpecificDate(dateVal);
    const range = calculateDateRange("SPECIFIC_DATE", customFrom, customTo, dateVal, specificMonth);
    setActiveDateRange(range);
    fetchOrders(range);
  };

  const handleApplySpecificMonth = (monthVal: string) => {
    setSpecificMonth(monthVal);
    const range = calculateDateRange("SPECIFIC_MONTH", customFrom, customTo, specificDate, monthVal);
    setActiveDateRange(range);
    fetchOrders(range);
  };

  const handleClearDateFilter = () => {
    applyPreset("ALL");
  };

  const handleSettleOrder = async (order: Order) => {
    try {
      await api.post("/pay/order", {
        orderId: order._id,
        tableId: order.tableId?._id,
        paymentMethod: "CASH",
      });
      await handlePrintReceipt({ ...order, paymentMethod: "CASH", status: "COMPLETED" });
      await fetchOrders();
    } catch (err) {
      console.error("Failed to settle order:", err);
    }
  };

  useEffect(() => {
    fetchOrders();

    const handleBranchChange = () => {
      fetchOrders();
    };
    window.addEventListener("pos_branch_changed", handleBranchChange);
    return () => {
      window.removeEventListener("pos_branch_changed", handleBranchChange);
    };
  }, []);

  // Filter orders based on status & search query
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        selectedStatus === "ALL"
          ? true
          : selectedStatus === "ACTIVE"
          ? ["PENDING", "ORDERED", "PREPARING", "READY"].includes(order.status)
          : order.status === selectedStatus;

      const tableNum = order.tableId?.tableNumber ? String(order.tableId.tableNumber) : "";
      const orderNum = order.orderNumber || "";
      const matchesSearch =
        order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        orderNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tableNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesStatus && matchesSearch;
    });
  }, [orders, selectedStatus, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <FiCheckCircle className="text-xs" /> Completed
          </span>
        );
      case "PREPARING":
      case "ORDERED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <FiClock className="text-xs animate-spin" style={{ animationDuration: "3s" }} /> In Kitchen
          </span>
        );
      case "READY":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <FiCheckCircle className="text-xs" /> Served / Ready
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <FiAlertCircle className="text-xs" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <FiClock className="text-xs" /> {status}
          </span>
        );
    }
  };

  const handlePrintReceipt = async (order: Order) => {
    const printWindow = window.open("", "_blank", "width=380,height=650");
    if (!printWindow) return;

    try {
      const receiptInfo = await getActiveBranchReceiptInfo();
      const rawToken = order.orderNumber?.replace(/\D/g, "") || "65";
      const tokenNumber = rawToken.length > 3 ? rawToken.slice(-3) : rawToken || "65";

      const html = generateThermalReceiptHtml({
        receiptInfo,
        orderNumber: order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`,
        tokenNumber,
        orderType: (order.orderType as any) || (order.tableId ? "Dine-In" : "Takeaway"),
        tableNumber: order.tableId?.tableNumber,
        customerName: "",
        cashierName: "biller",
        dateStr: new Date(order.createdAt).toLocaleString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        items: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
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
      console.error("Failed to generate receipt", err);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaHistory className="text-[#e02424]" /> Order History & Transactions
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            View detailed receipts, past orders, and sales performance across tables.
          </p>
        </div>

        <button
          onClick={() => fetchOrders()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shadow-xs w-fit"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh Feed
        </button>
      </div>

      {/* Quick Period Revenue Highlights (Today, Yesterday, This Month) */}
      {canViewFinances() && (
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
            <FiTrendingUp className="text-[#e02424] text-base" />
            <span>Quick Revenue Glance:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Today Pill */}
            <button
              onClick={() => applyPreset("TODAY")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                datePreset === "TODAY"
                  ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
              }`}
              title="Click to view Today's orders"
            >
              <span>Today:</span>
              <span className="font-extrabold">₹{(summary.todayRevenue || 0).toFixed(2)}</span>
            </button>

            {/* Yesterday Pill */}
            <button
              onClick={() => applyPreset("YESTERDAY")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                datePreset === "YESTERDAY"
                  ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                  : "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
              }`}
              title="Click to view Yesterday's orders"
            >
              <span>Yesterday:</span>
              <span className="font-extrabold">₹{(summary.yesterdayRevenue || 0).toFixed(2)}</span>
            </button>

            {/* This Month Pill */}
            <button
              onClick={() => applyPreset("THIS_MONTH")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                datePreset === "THIS_MONTH"
                  ? "bg-purple-600 text-white border-purple-700 shadow-xs"
                  : "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100"
              }`}
              title="Click to view This Month's orders"
            >
              <span>This Month:</span>
              <span className="font-extrabold">₹{(summary.thisMonthRevenue || 0).toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Date Filter & Range Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs mb-6 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <FiCalendar className="text-[#e02424]" /> Date:
            </span>

            {[
              { key: "ALL", label: "All Time" },
              { key: "TODAY", label: "Today" },
              { key: "YESTERDAY", label: "Yesterday" },
              { key: "THIS_MONTH", label: "This Month" },
              { key: "SPECIFIC_DATE", label: "Particular Date" },
              { key: "SPECIFIC_MONTH", label: "Particular Month" },
              { key: "CUSTOM_RANGE", label: "Date Range (From - To)" },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  if (p.key === "SPECIFIC_DATE" || p.key === "SPECIFIC_MONTH" || p.key === "CUSTOM_RANGE") {
                    setDatePreset(p.key as DatePreset);
                  } else {
                    applyPreset(p.key as DatePreset);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  datePreset === p.key
                    ? "bg-[#e02424] text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Active Range Indicator & Clear Button */}
          {activeDateRange.startDate && (
            <div className="flex items-center gap-2 self-start lg:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <FiFilter className="text-amber-600" />
                Active: {activeDateRange.label}
              </span>
              <button
                onClick={handleClearDateFilter}
                className="text-xs text-gray-500 hover:text-[#e02424] font-semibold underline transition cursor-pointer"
              >
                Reset to All Time
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Inputs when Particular Date is selected */}
        {datePreset === "SPECIFIC_DATE" && (
          <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-gray-700">Select Date:</span>
            <input
              type="date"
              value={specificDate}
              onChange={(e) => handleApplySpecificDate(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e02424]"
            />
            <button
              onClick={() => handleApplySpecificDate(specificDate)}
              className="px-3 py-1.5 bg-[#e02424] text-white rounded-lg text-xs font-bold hover:bg-[#c81e1e] transition shadow-2xs"
            >
              Apply Date
            </button>
          </div>
        )}

        {/* Dynamic Inputs when Particular Month is selected */}
        {datePreset === "SPECIFIC_MONTH" && (
          <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-gray-700">Select Month:</span>
            <input
              type="month"
              value={specificMonth}
              onChange={(e) => handleApplySpecificMonth(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e02424]"
            />
            <button
              onClick={() => handleApplySpecificMonth(specificMonth)}
              className="px-3 py-1.5 bg-[#e02424] text-white rounded-lg text-xs font-bold hover:bg-[#c81e1e] transition shadow-2xs"
            >
              Apply Month
            </button>
          </div>
        )}

        {/* Dynamic Inputs when Date Range (From - To) is selected */}
        {datePreset === "CUSTOM_RANGE" && (
          <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-gray-700">From Date:</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e02424]"
            />
            <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
              <FiArrowRight className="text-gray-400" /> To Date:
            </span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e02424]"
            />
            <button
              onClick={handleApplyCustomRange}
              className="px-4 py-1.5 bg-[#e02424] text-white rounded-lg text-xs font-bold hover:bg-[#c81e1e] transition shadow-2xs"
            >
              Filter Range
            </button>
            <button
              onClick={handleClearDateFilter}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Analytics Metric Cards for Selected Date Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {canViewFinances() && summary.totalRevenue !== null ? (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sales Revenue
                {activeDateRange.label && (
                  <span className="ml-1 text-[10px] text-[#e02424] font-bold lowercase">
                    ({activeDateRange.label})
                  </span>
                )}
              </p>
              <h3 className="text-2xl font-extrabold text-gray-900 mt-1">₹{(summary.totalRevenue || 0).toFixed(2)}</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#fdf2f2] text-[#e02424] flex items-center justify-center text-xl font-bold">
              <FiDollarSign />
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completed Orders
                {activeDateRange.label && (
                  <span className="ml-1 text-[10px] text-emerald-600 font-bold lowercase">
                    ({activeDateRange.label})
                  </span>
                )}
              </p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
                {orders.filter((o) => o.status === "COMPLETED").length}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
              <FiCheckCircle />
            </div>
          </div>
        )}

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Orders
              {activeDateRange.label && (
                <span className="ml-1 text-[10px] text-blue-600 font-bold lowercase">
                  ({activeDateRange.label})
                </span>
              )}
            </p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{summary.totalOrders}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            <FiShoppingBag />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active / In Kitchen</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{summary.activeCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
            <FiClock />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cancelled Orders</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{summary.cancelledCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl font-bold">
            <FiAlertCircle />
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { key: "ALL", label: "All Orders" },
            { key: "COMPLETED", label: "Completed" },
            { key: "ACTIVE", label: "In Progress" },
            { key: "CANCELLED", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedStatus === tab.key
                  ? "bg-[#e02424] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <FiSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search Order ID, Table #, Item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e02424]"
          />
        </div>
      </div>

      {/* Main Table / Data Grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <FiRefreshCw className="animate-spin text-2xl mx-auto mb-2 text-[#e02424]" />
            <p className="text-sm font-medium">Loading order records...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FiShoppingBag className="text-3xl mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-semibold text-gray-600">No orders found for the selected criteria.</p>
            <p className="text-xs text-gray-400 mt-1">
              {activeDateRange.startDate
                ? `No orders matching "${activeDateRange.label}". Try picking another date or resetting.`
                : "Try clearing your search query or switching tabs."}
            </p>
            {activeDateRange.startDate && (
              <button
                onClick={handleClearDateFilter}
                className="mt-3 px-3 py-1.5 bg-[#e02424] text-white rounded-lg text-xs font-semibold hover:bg-[#c81e1e] transition shadow-xs"
              >
                Reset to All Time
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] font-bold border-b border-gray-200 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Table / Area</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Total Bill</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      {order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <FiCalendar className="text-gray-400 text-xs" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-md">
                        <MdTableRestaurant className="text-[#e02424]" />
                        Table #{order.tableId?.tableNumber || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 max-w-xs">
                      <div className="truncate">
                        {order.items.map((i) => `${i.name} (x${i.quantity})`).join(", ")}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {order.items.reduce((acc, curr) => acc + curr.quantity, 0)} items total
                      </div>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-gray-900 text-sm">
                      ₹{(order.totalAmount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {order.paymentMethod ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                          {order.paymentMethod}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {["ORDERED", "PREPARING", "READY"].includes(order.status) && (
                          <button
                            onClick={() => handleSettleOrder(order)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition shadow-2xs whitespace-nowrap"
                            title="Complete Order & Free Table"
                          >
                            Settle & Free
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                          title="View Details"
                        >
                          <FiEye className="text-sm" />
                        </button>
                        <button
                          onClick={() => handlePrintReceipt(order)}
                          className="p-1.5 rounded-lg bg-[#fdf2f2] text-[#e02424] hover:bg-[#fde8e8] transition"
                          title="Print Receipt"
                        >
                          <FiPrinter className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Invoice Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100"
            >
              <button
                onClick={() => setSelectedOrder(null)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX className="text-lg" />
              </button>

              <div className="text-center pb-4 border-b border-gray-100">
                <span className="w-10 h-10 rounded-full bg-[#fdf2f2] text-[#e02424] inline-flex items-center justify-center font-bold text-xl mb-2">
                  <FiShoppingBag />
                </span>
                <h3 className="text-lg font-bold text-gray-900">Order Invoice Details</h3>
                <p className="text-xs text-gray-500">Order ID: {selectedOrder.orderNumber || `#${selectedOrder._id}`}</p>
              </div>

              <div className="py-4 space-y-3">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Table Number:</span>
                  <span className="font-bold text-gray-900">Table #{selectedOrder.tableId?.tableNumber || "N/A"}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Order Time:</span>
                  <span className="font-semibold text-gray-900">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Status:</span>
                  <span>{getStatusBadge(selectedOrder.status)}</span>
                </div>
                {selectedOrder.paymentMethod && (
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Payment Method:</span>
                    <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                      {selectedOrder.paymentMethod} (PAID)
                    </span>
                  </div>
                )}

                {/* Items Breakdown */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Ordered Items</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedOrder.items.map((item) => (
                      <div key={item._id || item.name} className="flex justify-between text-xs items-center bg-gray-50 p-2 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-800">{item.name}</p>
                          <p className="text-[10px] text-gray-500">₹{item.price.toFixed(2)} x {item.quantity}</p>
                        </div>
                        <span className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-800">Grand Total:</span>
                  <span className="text-xl font-extrabold text-[#e02424]">₹{(selectedOrder.totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => handlePrintReceipt(selectedOrder)}
                  className="flex-1 py-2.5 bg-[#e02424] text-white rounded-xl text-xs font-bold hover:bg-[#c81e1e] transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <FiPrinter /> Print Receipt
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OrderHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-500 font-medium">
          Loading Orders & History...
        </div>
      }
    >
      <OrderHistoryContent />
    </Suspense>
  );
}
