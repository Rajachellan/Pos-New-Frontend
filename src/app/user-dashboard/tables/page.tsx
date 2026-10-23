"use client";

import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import { getSocket } from "../../services/socket";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiX,
  FiMoreHorizontal,
  FiRefreshCw,
  FiMapPin,
  FiCheck,
  FiAlertCircle,
  FiChevronDown,
  FiSearch,
  FiLayers,
  FiZap,
  FiPrinter,
  FiDollarSign,
  FiCreditCard,
  FiSmartphone,
  FiCheckCircle,
  FiShoppingBag,
  FiTrash2,
  FiArrowUpRight,
} from "react-icons/fi";
import { MdOutlineTableRestaurant } from "react-icons/md";
import { sortTablesNaturally } from "../../utils/tableSort";
import { getActiveBranchReceiptInfo, generateThermalReceiptHtml } from "../../utils/receiptBranding";

interface AreaData {
  _id: string;
  areaName: string;
  areaCode?: string;
}

export interface ActiveOrderSummary {
  _id: string;
  orderNumber: string;
  itemsCount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  status: string;
  createdAt?: string;
}

interface TableData {
  _id: string;
  tableNumber: string;
  areaName:
    | {
        _id: string;
        areaName: string;
      }
    | string;
  availabilityStatus: "AVAILABLE" | "OCCUPIED";
  activeOrder?: ActiveOrderSummary | null;
  createdBy?: string;
}

// Helper to extract Area ID safely from table.areaName
const getTableAreaId = (table: TableData): string => {
  if (typeof table.areaName === "object" && table.areaName !== null) {
    return table.areaName._id;
  }
  return String(table.areaName || "");
};

export default function FloorsAndTablesPage() {
  const router = useRouter();

  const [areas, setAreas] = useState<AreaData[]>([]);
  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [flashNotification, setFlashNotification] = useState<string | null>(null);

  // Read any flash message (e.g. from payment completion or table release)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const msg = sessionStorage.getItem("pos_flash_message");
      if (msg) {
        setFlashNotification(msg);
        sessionStorage.removeItem("pos_flash_message");
        const timer = setTimeout(() => setFlashNotification(null), 4500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Modals
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);

  // Quick Settle Modal State for Occupied Tables
  const [settleTable, setSettleTable] = useState<TableData | null>(null);
  const [settlePaymentMethod, setSettlePaymentMethod] = useState<"CASH" | "UPI" | "CARD">("CASH");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isPrintingBillId, setIsPrintingBillId] = useState<string | null>(null);

  // Area Action Popover
  const [activeAreaMenuId, setActiveAreaMenuId] = useState<string | null>(null);

  // Form states
  const [newAreaName, setNewAreaName] = useState("");
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableAreaId, setNewTableAreaId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Custom Dropdown & Helpers
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [areaSearchQuery, setAreaSearchQuery] = useState("");

  // Next suggested table number
  const suggestedTableNum = useMemo(() => {
    const targetAreaId = newTableAreaId || (areas.length > 0 ? areas[0]._id : "");
    if (!targetAreaId) return "T1";
    const areaTables = tables.filter((t) => getTableAreaId(t) === targetAreaId);
    const nums = areaTables
      .map((t) => parseInt(t.tableNumber.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n));
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `T${nextNum}`;
  }, [tables, newTableAreaId, areas]);

  const selectedAreaObj = useMemo(() => {
    return areas.find((a) => a._id === newTableAreaId) || (areas.length > 0 ? areas[0] : null);
  }, [areas, newTableAreaId]);

  const filteredModalAreas = useMemo(() => {
    if (!areaSearchQuery.trim()) return areas;
    const q = areaSearchQuery.toLowerCase();
    return areas.filter((a) => a.areaName.toLowerCase().includes(q));
  }, [areas, areaSearchQuery]);

  // Fetch Areas
  async function fetchAreas() {
    try {
      let savedBranchId = typeof window !== "undefined" ? localStorage.getItem("pos_selected_branch") : null;
      if (savedBranchId === "b1") {
        localStorage.removeItem("pos_selected_branch");
        savedBranchId = null;
      }
      const branchQuery = savedBranchId && savedBranchId !== "ALL" ? `?branchId=${savedBranchId}` : "";
      let res = await api.get(`/get/area/branch${branchQuery}`);
      let data = Array.isArray(res?.data?.data) ? res.data.data : [];

      if (data.length === 0 && savedBranchId && savedBranchId !== "ALL") {
        const fallbackRes = await api.get(`/get/area/branch`);
        const fallbackData = Array.isArray(fallbackRes?.data?.data) ? fallbackRes.data.data : [];
        if (fallbackData.length > 0) {
          data = fallbackData;
        }
      }

      setAreas(data);
      if (data.length > 0 && !newTableAreaId) {
        setNewTableAreaId(data[0]._id);
      }
    } catch (err) {
      console.error("Error fetching areas", err);
    }
  }

  // Fetch Tables
  async function fetchTables() {
    try {
      let savedBranchId = typeof window !== "undefined" ? localStorage.getItem("pos_selected_branch") : null;
      if (savedBranchId === "b1") {
        localStorage.removeItem("pos_selected_branch");
        savedBranchId = null;
      }
      const branchQuery = savedBranchId && savedBranchId !== "ALL" ? `?branchId=${savedBranchId}` : "";
      let res = await api.get(`/get/tables/branch${branchQuery}`);
      let data = Array.isArray(res?.data?.data) ? res.data.data : [];

      if (data.length === 0 && savedBranchId && savedBranchId !== "ALL") {
        const fallbackRes = await api.get(`/get/tables/branch`);
        const fallbackData = Array.isArray(fallbackRes?.data?.data) ? fallbackRes.data.data : [];
        if (fallbackData.length > 0) {
          data = fallbackData;
        }
      }

      setTables(sortTablesNaturally(data));
    } catch (err) {
      console.error("Error fetching tables", err);
    }
  }

  async function loadData() {
    setLoading(true);
    await Promise.all([fetchAreas(), fetchTables()]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();

    const socket = getSocket();
    const handleTableUpdated = (data: { tableId: string; availabilityStatus: "AVAILABLE" | "OCCUPIED" }) => {
      if (!data?.tableId) return;
      setTables((prev) =>
        prev.map((t) => (t._id === data.tableId ? { ...t, availabilityStatus: data.availabilityStatus } : t))
      );
    };

    const handleBranchChange = () => {
      loadData();
    };

    socket.on("table_updated", handleTableUpdated);
    window.addEventListener("pos_branch_changed", handleBranchChange);

    return () => {
      socket.off("table_updated", handleTableUpdated);
      window.removeEventListener("pos_branch_changed", handleBranchChange);
    };
  }, []);

  const handleReleaseTable = async (tableId: string, tableNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/tables/${tableId}/release`);
      setTables((prev) =>
        prev.map((t) => (t._id === tableId ? { ...t, availabilityStatus: "AVAILABLE", activeOrder: null } : t))
      );
    } catch (err) {
      console.error("Failed to release table:", err);
    }
  };

  // High-Density Thermal Receipt Print Handler (TVS RP3160)
  const handlePrintReceipt = async (order: ActiveOrderSummary, tableNum: string, paymentMethod?: string) => {
    const printWindow = window.open("", "_blank", "width=380,height=650");
    if (!printWindow) {
      window.print();
      return;
    }

    try {
      const receiptInfo = await getActiveBranchReceiptInfo();
      const rawOrderNo = order.orderNumber || "1";
      const rawToken = order.orderNumber?.replace(/\D/g, "") || "65";
      const tokenNumber = rawToken.length > 3 ? rawToken.slice(-3) : rawToken || "65";

      const subtotalVal = order.subtotal || 0;
      const gstVal = order.gstAmount || 0;
      const totalVal = Math.ceil(order.totalAmount || subtotalVal + gstVal);
      const roundOffVal = Math.round((totalVal - subtotalVal - gstVal) * 100) / 100;

      const formattedTable = tableNum.toUpperCase().startsWith("T") ? tableNum.toUpperCase() : `T${tableNum}`;

      const html = generateThermalReceiptHtml({
        receiptInfo,
        orderNumber: rawOrderNo,
        tokenNumber,
        orderType: "Dine-In",
        tableNumber: formattedTable,
        customerName: "",
        cashierName: "biller",
        dateStr: new Date().toLocaleString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        items: (order.items || []).map((it) => ({
          name: it.name,
          quantity: it.quantity,
          price: it.price,
        })),
        subtotal: subtotalVal,
        gstAmount: gstVal,
        gstRate: 5,
        roundOff: roundOffVal,
        grandTotal: totalVal,
        paymentMethod: paymentMethod,
      });

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (err) {
      console.error("Failed to generate thermal receipt", err);
      printWindow.close();
    }
  };

  // Direct Bill Print from Table Card
  const handleDirectPrintBill = async (table: TableData, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!table.activeOrder) {
      router.push(`/user-dashboard/menus?tableId=${table._id}&tableNumber=${table.tableNumber}`);
      return;
    }

    setIsPrintingBillId(table._id);
    try {
      await handlePrintReceipt(table.activeOrder, table.tableNumber);
    } catch (err) {
      console.error("Direct print bill error", err);
    } finally {
      setIsPrintingBillId(null);
    }
  };

  // Settle Bill directly from Tables Page
  const handleCompleteSettle = async () => {
    if (!settleTable || !settleTable._id) return;
    setIsSubmittingPayment(true);
    try {
      await api.post("/pay/order", {
        tableId: settleTable._id,
        paymentMethod: settlePaymentMethod,
      });

      // Auto-print thermal receipt upon payment completion
      if (settleTable.activeOrder) {
        try {
          await handlePrintReceipt(settleTable.activeOrder, settleTable.tableNumber, settlePaymentMethod);
        } catch (printErr) {
          console.warn("Auto-print error on settle", printErr);
        }
      }

      setFlashNotification(`Payment recorded for Table ${settleTable.tableNumber} via ${settlePaymentMethod}! Table is now available.`);
      setSettleTable(null);
      await fetchTables();
    } catch (err) {
      console.error("Failed to settle order", err);
      const axiosErr = err as AxiosError<{ message?: string }>;
      alert(axiosErr.response?.data?.message || "Failed to record payment. Please try again.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchAreas(), fetchTables()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Format Title helper for proper casing
  const formatTitle = (str: string): string => {
    if (!str) return "";
    return str
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  // Helper to extract Area Name safely
  const getTableAreaName = (table: TableData): string => {
    let name = "Dining";
    if (typeof table.areaName === "object" && table.areaName !== null) {
      name = table.areaName.areaName;
    } else {
      const matched = areas.find((a) => a._id === table.areaName);
      if (matched) name = matched.areaName;
    }
    return formatTitle(name);
  };

  // Group tables by area
  const groupedAreas = useMemo(() => {
    return areas.map((area) => {
      const areaTables = tables.filter((t) => {
        const aId = getTableAreaId(t);
        return aId === area._id;
      });

      // Sort tables naturally (T1, T2, T3... T10, T11)
      const sortedTables = sortTablesNaturally(areaTables);

      return {
        area,
        tables: sortedTables,
      };
    });
  }, [areas, tables]);

  // Overall counts
  const totalTables = tables.length;
  const availableCount = tables.filter(
    (t) => t.availabilityStatus === "AVAILABLE"
  ).length;
  const occupiedCount = tables.filter(
    (t) => t.availabilityStatus === "OCCUPIED"
  ).length;

  // Filtered list of area sections to display
  const displayedSections = useMemo(() => {
    if (selectedAreaId === "all") {
      return groupedAreas;
    }
    return groupedAreas.filter((g) => g.area._id === selectedAreaId);
  }, [groupedAreas, selectedAreaId]);

  // Add Area Form Submit
  async function handleCreateArea(e: React.FormEvent) {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    setIsSubmitting(true);
    setFormError("");
    try {
      let savedBranchId = typeof window !== "undefined" ? localStorage.getItem("pos_selected_branch") : null;
      if (savedBranchId === "b1") {
        localStorage.removeItem("pos_selected_branch");
        savedBranchId = null;
      }
      await api.post("/add/area", {
        areaName: newAreaName.trim(),
        branchName: savedBranchId && savedBranchId !== "ALL" ? savedBranchId : undefined,
      });

      setNewAreaName("");
      setShowAddAreaModal(false);
      await fetchAreas();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setFormError(axiosError.response?.data?.message || "Failed to create area");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Add Table Form Submit
  async function handleCreateTable(e: React.FormEvent) {
    e.preventDefault();
    if (!newTableNumber.trim() || !newTableAreaId) return;
    setIsSubmitting(true);
    setFormError("");
    try {
      const formattedNum = newTableNumber.trim().toUpperCase().startsWith("T")
        ? newTableNumber.trim().toUpperCase()
        : `T${newTableNumber.trim()}`;

      await api.post("/add/tables", {
        tableNumber: formattedNum,
        areaName: newTableAreaId,
      });

      setNewTableNumber("");
      setShowAddTableModal(false);
      await fetchTables();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setFormError(axiosError.response?.data?.message || "Failed to create table");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6 md:p-8 bg-[#f8fafc] min-h-screen text-slate-800 relative">
      {/* Flash Success Notification */}
      <AnimatePresence>
        {flashNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold border border-emerald-500 max-w-md"
          >
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-white">
              <FiCheck size={16} />
            </div>
            <div className="flex-1">
              <p className="leading-tight">{flashNotification}</p>
              <p className="text-[10px] text-emerald-100 font-medium mt-0.5">Ready to seat & occupy the next customer.</p>
            </div>
            <button
              type="button"
              onClick={() => setFlashNotification(null)}
              className="p-1 rounded-lg text-emerald-200 hover:text-white transition cursor-pointer"
            >
              <FiX size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header Row (Title, Subtitle & Top Right Action Buttons) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Floors & Tables
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Manage your restaurant floors, areas and tables
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setFormError("");
              setShowAddAreaModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 hover:bg-gray-50 transition shadow-2xs cursor-pointer active:scale-95"
          >
            <FiPlus size={15} /> New Area
          </button>

          <button
            onClick={() => {
              setFormError("");
              setShowAddTableModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#e02424] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
          >
            <FiPlus size={15} /> New Table
          </button>
        </div>
      </div>

      {/* 2. Floor / Area Filter Pills Bar + Status Counts */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-7">
        {/* Left Side: Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {/* All Areas Pill */}
          <button
            onClick={() => setSelectedAreaId("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
              selectedAreaId === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span>All Areas</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                selectedAreaId === "all"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {totalTables}
            </span>
          </button>

          {/* Area Specific Pills */}
          {groupedAreas.map((g) => {
            const isSelected = selectedAreaId === g.area._id;
            return (
              <button
                key={g.area._id}
                onClick={() => setSelectedAreaId(g.area._id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span>{formatTitle(g.area.areaName)}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {g.tables.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Available & Occupied Status Chips */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-emerald-800 text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50 inline-block" />
            <span>Available <span className="text-emerald-900 font-black">({availableCount})</span></span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50/80 border border-rose-200/70 text-rose-800 text-xs font-bold shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span>Occupied <span className="text-rose-950 font-black">({occupiedCount})</span></span>
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition shadow-2xs cursor-pointer active:scale-95"
            title="Refresh Feed"
          >
            <FiRefreshCw className={isRefreshing ? "animate-spin" : ""} size={14} />
          </button>
        </div>
      </div>

      {/* 3. FLOOR DIVIDED SECTIONS */}
      {loading ? (
        <div className="space-y-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="space-y-3">
              <div className="w-48 h-6 bg-gray-200 rounded-md animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-white rounded-2xl border border-gray-200 animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : displayedSections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-50 text-[#e02424] flex items-center justify-center mx-auto text-2xl">
            <FiAlertCircle />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">No Areas Found</h3>
            <p className="text-xs text-gray-500 mt-1">
              Start by creating your restaurant's first floor or dining zone.
            </p>
          </div>
          <button
            onClick={() => setShowAddAreaModal(true)}
            className="px-5 py-2.5 bg-[#e02424] text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
          >
            + Create New Area
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {displayedSections.map(({ area, tables: areaTables }) => (
            <div key={area._id} className="space-y-3">
              {/* Section Header */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center">
                  {/* Accent vertical bar */}
                  <span className="w-1.5 h-5 bg-[#e02424] rounded-full mr-2.5 inline-block" />
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    {formatTitle(area.areaName)}
                  </h2>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 rounded-full ml-3">
                    {areaTables.length} {areaTables.length === 1 ? "Table" : "Tables"}
                  </span>
                </div>

                {/* Three dots menu */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setActiveAreaMenuId(
                        activeAreaMenuId === area._id ? null : area._id
                      )
                    }
                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                    title="Area Options"
                  >
                    <FiMoreHorizontal size={18} />
                  </button>

                  {activeAreaMenuId === area._id && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-20">
                      <button
                        onClick={() => {
                          setNewTableAreaId(area._id);
                          setActiveAreaMenuId(null);
                          setShowAddTableModal(true);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <FiPlus className="text-[#e02424]" /> Add Table here
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Table Grid for this specific floor/area */}
              {areaTables.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
                  <p className="text-xs text-slate-400">
                    No tables configured in {formatTitle(area.areaName)}.
                  </p>
                  <button
                    onClick={() => {
                      setNewTableAreaId(area._id);
                      setShowAddTableModal(true);
                    }}
                    className="mt-2 text-xs font-bold text-[#e02424] hover:underline cursor-pointer"
                  >
                    + Add First Table
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {areaTables.map((table) => {
                    const isOccupied = table.availabilityStatus === "OCCUPIED";
                    const formattedNum = table.tableNumber
                      .toUpperCase()
                      .startsWith("T")
                      ? table.tableNumber.toUpperCase()
                      : `T${table.tableNumber}`;

                    const areaDisplayName = getTableAreaName(table);

                    return (
                      <div
                        key={table._id}
                        onClick={() =>
                          router.push(
                            `/user-dashboard/menus?tableId=${table._id}&tableNumber=${table.tableNumber}`
                          )
                        }
                        className={`group bg-white rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-[158px] p-3.5 select-none ${
                          isOccupied
                            ? "border-rose-200/90 shadow-2xs hover:shadow-md hover:border-rose-300 ring-1 ring-rose-500/10"
                            : "border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-md hover:-translate-y-0.5"
                        }`}
                      >
                        {/* Top Row: Table Number + Badges */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-base font-black text-slate-900 group-hover:text-[#e02424] transition leading-none">
                              {formattedNum}
                            </span>
                            {isOccupied && (
                              <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-mono font-bold text-[9.5px] border border-rose-200/70 leading-none">
                                {table.activeOrder?.orderNumber || "Bill"}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isOccupied ? (
                              <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2" title="Occupied table">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                </span>
                                <button
                                  type="button"
                                  title="Release / Free Table Manually"
                                  onClick={(e) => handleReleaseTable(table._id, table.tableNumber, e)}
                                  className="text-slate-300 hover:text-rose-600 p-0.5 rounded transition cursor-pointer"
                                >
                                  <FiTrash2 size={12} />
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                Available
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Middle Section: Metrics or Area Info */}
                        {isOccupied ? (
                          <div className="py-1 px-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                                Total
                              </span>
                              <span className="text-base font-black text-slate-900 tracking-tight leading-tight">
                                ₹{Number(table.activeOrder?.totalAmount || 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200/80 shadow-2xs">
                                {table.activeOrder?.itemsCount || 1} {table.activeOrder?.itemsCount === 1 ? "Item" : "Items"}
                              </span>
                              <span className="block text-[9.5px] text-slate-400 font-medium capitalize mt-0.5 truncate max-w-[85px]">
                                {areaDisplayName}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-1 px-1 flex flex-col justify-center">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 capitalize">
                              <FiMapPin size={11} className="text-slate-400 shrink-0" />
                              <span className="truncate">{areaDisplayName}</span>
                            </div>
                            <span className="text-[10.5px] text-slate-400 font-normal mt-0.5">
                              Ready for guests
                            </span>
                          </div>
                        )}

                        {/* Bottom Row: Actions */}
                        <div>
                          {isOccupied ? (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={(e) => handleDirectPrintBill(table, e)}
                                disabled={isPrintingBillId === table._id}
                                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold border border-slate-200/90 shadow-2xs hover:border-slate-300 transition active:scale-95 cursor-pointer"
                                title="Direct Print TVS Slip (RP3160)"
                              >
                                <FiPrinter size={12} className={isPrintingBillId === table._id ? "animate-spin text-[#e02424]" : "text-slate-500"} />
                                <span>{isPrintingBillId === table._id ? "..." : "Bill"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSettleTable(table);
                                }}
                                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition active:scale-95 cursor-pointer"
                                title="Quick Settle Payment"
                              >
                                <FiCheckCircle size={12} />
                                <span>Settle</span>
                              </button>
                            </div>
                          ) : (
                            <div className="w-full py-1.5 px-2.5 rounded-xl bg-slate-50 group-hover:bg-slate-900 group-hover:text-white text-slate-600 border border-slate-200/80 group-hover:border-slate-900 text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 shadow-2xs">
                              <FiPlus size={13} className="text-slate-400 group-hover:text-white transition-colors" />
                              <span>Take Order</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 4. NEW AREA MODAL */}
      <AnimatePresence>
        {showAddAreaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#e02424] flex items-center justify-center font-bold text-lg shrink-0">
                    <FiLayers size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">New Floor / Zone</h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                      Zone Configuration
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddAreaModal(false)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Quick Presets */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Quick Presets
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Ground Floor",
                    "1st Floor",
                    "2nd Floor",
                    "Rooftop Lounge",
                    "AC Dining",
                    "Outdoor Patio",
                  ].map((presetName) => (
                    <button
                      key={presetName}
                      type="button"
                      onClick={() => setNewAreaName(presetName)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-transparent text-gray-700 transition cursor-pointer"
                    >
                      {presetName}
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <FiAlertCircle className="shrink-0 text-red-500" size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateArea} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Area Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <FiMapPin size={16} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Garden, Roof Top, 3rd Floor"
                      value={newAreaName}
                      onChange={(e) => setNewAreaName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowAddAreaModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-linear-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-500/20 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {isSubmitting ? "Creating..." : "Create Area"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. NEW TABLE MODAL (CUSTOM DROPDOWN & LIVE PREVIEW) */}
      <AnimatePresence>
        {showAddTableModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#e02424] flex items-center justify-center font-bold text-lg shrink-0">
                    <MdOutlineTableRestaurant size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">New Table</h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                      Capacity Expansion
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddTableModal(false);
                    setIsAreaDropdownOpen(false);
                  }}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                >
                  <FiX size={18} />
                </button>
              </div>

              {formError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <FiAlertCircle className="shrink-0 text-red-500" size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateTable} className="space-y-4">
                {/* Table Number Field with Auto Suggest */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Table Number / ID
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewTableNumber(suggestedTableNum)}
                      className="text-[11px] font-bold text-[#e02424] hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1 transition cursor-pointer"
                      title="Use next available number in this area"
                    >
                      <FiZap size={11} />
                      <span>Suggest: {suggestedTableNum}</span>
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-bold text-sm">
                      #
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 15, T7"
                      value={newTableNumber}
                      onChange={(e) => setNewTableNumber(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                    />
                  </div>
                </div>

                {/* Custom Area Selection Dropdown (No ugly OS native select!) */}
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Area / Floor Selection
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 text-sm font-medium flex items-center justify-between transition cursor-pointer shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FiMapPin className="text-[#e02424] shrink-0" size={16} />
                      <span className="font-bold text-gray-800 truncate">
                        {selectedAreaObj ? selectedAreaObj.areaName : "Select an Area"}
                      </span>
                    </div>
                    <FiChevronDown
                      className={`text-gray-400 transition-transform duration-200 shrink-0 ${
                        isAreaDropdownOpen ? "rotate-180" : ""
                      }`}
                      size={16}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isAreaDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-2 max-h-56 overflow-y-auto"
                      >
                        {areas.length > 4 && (
                          <div className="relative mb-2 px-1">
                            <FiSearch className="absolute left-3.5 top-2.5 text-gray-400" size={13} />
                            <input
                              type="text"
                              placeholder="Search floor or area..."
                              value={areaSearchQuery}
                              onChange={(e) => setAreaSearchQuery(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 rounded-lg border border-gray-200 focus:outline-hidden focus:border-red-500"
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          {filteredModalAreas.map((area) => {
                            const isSelected = (newTableAreaId || areas[0]?._id) === area._id;
                            const tableCount = tables.filter((t) => getTableAreaId(t) === area._id).length;

                            return (
                              <button
                                key={area._id}
                                type="button"
                                onClick={() => {
                                  setNewTableAreaId(area._id);
                                  setIsAreaDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                                  isSelected
                                    ? "bg-red-50 text-[#e02424] font-bold"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="truncate">{area.areaName}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] text-gray-400">
                                    {tableCount} {tableCount === 1 ? "table" : "tables"}
                                  </span>
                                  {isSelected && <FiCheck className="text-[#e02424]" size={14} />}
                                </div>
                              </button>
                            );
                          })}
                          {filteredModalAreas.length === 0 && (
                            <p className="text-center py-3 text-xs text-gray-400">No areas found</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Live Card Preview */}
                <div className="rounded-2xl border border-gray-100 bg-slate-50/70 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    <span>Live Preview</span>
                    <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                      Default: AVAILABLE
                    </span>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200/80 p-3 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-red-50 text-[#e02424] flex items-center justify-center font-black text-sm border border-red-100">
                        {newTableNumber
                          ? newTableNumber.toUpperCase().startsWith("T")
                            ? newTableNumber.toUpperCase()
                            : `T${newTableNumber}`
                          : suggestedTableNum}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">
                          {selectedAreaObj?.areaName || "Selected Area"}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">Ready for immediate diner seating</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                      AVAILABLE
                    </span>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTableModal(false);
                      setIsAreaDropdownOpen(false);
                    }}
                    className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-linear-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-500/20 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {isSubmitting ? "Creating..." : "Create Table"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK SETTLE MODAL (DIRECT SETTLE & PRINT FROM TABLES PAGE) */}
      <AnimatePresence>
        {settleTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                    <FiPrinter size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-tight">
                      Settle Bill & Take Payment
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Table <span className="font-bold text-slate-800">{settleTable.tableNumber}</span>
                      {settleTable.activeOrder?.orderNumber ? ` • ${settleTable.activeOrder.orderNumber}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSettleTable(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Total Amount Banner */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Payable
                </span>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
                  ₹{Number(settleTable.activeOrder?.totalAmount || 0).toFixed(2)}
                </p>
                <div className="mt-1 text-[11px] text-slate-500 font-medium">
                  {settleTable.activeOrder?.itemsCount || 1} {settleTable.activeOrder?.itemsCount === 1 ? "item" : "items"}
                  {settleTable.activeOrder?.gstAmount ? ` • Inc. GST ₹${Number(settleTable.activeOrder.gstAmount).toFixed(2)}` : ""}
                </div>
              </div>

              {/* Items Summary */}
              {settleTable.activeOrder?.items && settleTable.activeOrder.items.length > 0 && (
                <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 space-y-1.5 scrollbar-thin">
                  {settleTable.activeOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 truncate pr-2">
                        {it.name} <span className="text-slate-400 font-bold">x{it.quantity}</span>
                      </span>
                      <span className="font-bold text-slate-900 shrink-0">
                        ₹{(it.price * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

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

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={handleCompleteSettle}
                  disabled={isSubmittingPayment}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-slate-900/15 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
                >
                  <FiPrinter size={15} />
                  <span>
                    {isSubmittingPayment
                      ? "Recording Payment..."
                      : `Collect ₹${Number(settleTable.activeOrder?.totalAmount || 0).toFixed(2)} via ${settlePaymentMethod} & Print`}
                  </span>
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setSettleTable(null)}
                    className="text-slate-500 hover:text-slate-700 font-medium py-1 px-2 rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const tId = settleTable._id;
                      const tNum = settleTable.tableNumber;
                      setSettleTable(null);
                      router.push(`/user-dashboard/menus?tableId=${tId}&tableNumber=${tNum}`);
                    }}
                    className="text-[#e02424] hover:underline font-bold py-1 px-2 transition cursor-pointer"
                  >
                    Open Full POS Menu ➔
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}