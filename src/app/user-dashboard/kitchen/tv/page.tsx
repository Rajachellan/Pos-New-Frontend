"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AxiosError } from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiClock,
  FiRefreshCw,
  FiMaximize,
  FiMinimize,
  FiVolume2,
  FiVolumeX,
  FiAlertTriangle,
  FiCheckCircle,
  FiPlay,
  FiCheck,
  FiWifi,
  FiWifiOff,
  FiChevronRight,
  FiChevronDown,
  FiInfo,
} from "react-icons/fi";
import Link from "next/link";
import { RiFireLine, RiRestaurantLine } from "react-icons/ri";
import { MdMeetingRoom, MdRoomService } from "react-icons/md";
import { FaUtensils, FaBell, FaCheckDouble, FaBullhorn } from "react-icons/fa6";
import api from "../../../services/api";
import {
  getSocket,
  joinBranchRoom,
  leaveBranchRoom,
} from "../../../services/socket";
import {
  playNewOrderChime,
  initAudioContext,
} from "../../../services/sound";

export type KitchenStatus = "NEW" | "PREPARING" | "READY" | "SERVED";

export interface KitchenItem {
  _id?: string;
  menuId?: string | { _id: string; name: string };
  name: string;
  price?: number;
  quantity: number;
  isManual?: boolean;
  kitchenStatus?: KitchenStatus;
  notes?: string;
}

export interface KdsOrder {
  _id: string;
  orderNumber?: string;
  orderType?: "DINE-IN" | "TAKEAWAY" | "DELIVERY" | "ROOM SERVICE" | "ROOM-SERVICE";
  tableId?: {
    _id: string;
    tableNumber: string;
    areaName?: {
      _id?: string;
      areaName?: string;
      branchName?: {
        _id?: string;
        branchName?: string;
      };
    };
  } | string;
  roomNumber?: string;
  items: KitchenItem[];
  totalAmount?: number;
  notes?: string;
  status: string;
  kitchenStatus: KitchenStatus;
  branchId?: string;
  startedAt?: string;
  readyAt?: string;
  servedAt?: string;
  createdAt: string;
}

interface BranchInfo {
  _id: string;
  branchName: string;
  branchCode?: string;
}

export default function KitchenTvDisplayPage() {
  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [branch, setBranch] = useState<BranchInfo | null>(null);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [needsSoundConsent, setNeedsSoundConsent] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recentNotification, setRecentNotification] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Single global clock tick for all cards & header (updated every 1s)
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // 1. Single Clock Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format header time & date
  const timeFormatted = useMemo(() => {
    const d = new Date(currentTime);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }, [currentTime]);

  const dateFormatted = useMemo(() => {
    const d = new Date(currentTime);
    return d.toLocaleDateString([], {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [currentTime]);

  // 2. Fetch Active Branch & User Context
  const fetchBranchContext = useCallback(async () => {
    try {
      const res = await api.get("/get/branch/role");
      const branchList: BranchInfo[] = res.data?.data || [];
      setBranches(branchList);

      const savedBranch = typeof window !== "undefined" ? localStorage.getItem("pos_selected_branch") : null;
      if (savedBranch && savedBranch !== "ALL") {
        const found = branchList.find((b) => b._id === savedBranch);
        if (found) {
          setBranch(found);
          setSelectedBranchId(found._id);
          return found._id;
        }
      }
      if (savedBranch === "ALL") {
        setBranch(null);
        setSelectedBranchId("ALL");
        return "ALL";
      }
      setSelectedBranchId("ALL");
      setBranch(null);
      return "ALL";
    } catch (err) {
      console.warn("Could not load branch context from API:", err);
    }
    return "ALL";
  }, []);

  // 3. Fetch Active Kitchen Orders
  const fetchKitchenOrders = useCallback(async (branchId?: string) => {
    try {
      setLoading(true);
      const targetBranch = branchId !== undefined ? branchId : selectedBranchId;
      const url = targetBranch && targetBranch !== "ALL"
        ? `/kitchen/orders?branchId=${targetBranch}`
        : "/kitchen/orders";
      const res = await api.get(url);
      const rawOrders: KdsOrder[] = res.data?.data || [];

      // Normalize statuses
      const normalized = rawOrders.map((o) => {
        let kStatus: KitchenStatus = "NEW";
        if (o.kitchenStatus) {
          kStatus = o.kitchenStatus;
        } else if (o.status === "PREPARING") {
          kStatus = "PREPARING";
        } else if (o.status === "READY") {
          kStatus = "READY";
        } else if (o.status === "ORDERED" || o.status === "PENDING") {
          kStatus = "NEW";
        }

        return {
          ...o,
          orderNumber: o.orderNumber || `#${o._id.slice(-4).toUpperCase()}`,
          orderType: o.orderType || "DINE-IN",
          kitchenStatus: kStatus,
        };
      });

      // Filter out any SERVED or COMPLETED
      setOrders(normalized.filter((o) => o.kitchenStatus !== "SERVED" && o.status !== "COMPLETED"));
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error("Error loading kitchen orders:", axiosError.message);
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  // Initial Load
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const bId = await fetchBranchContext();
      if (isMounted) {
        fetchKitchenOrders(bId);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [fetchBranchContext, fetchKitchenOrders]);

  // 4. Socket.IO Real-time Lifecycle
  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      if (selectedBranchId && selectedBranchId !== "ALL") {
        joinBranchRoom(selectedBranchId);
      } else {
        socket.emit("join_branch", { branchId: "ALL" });
      }
      fetchKitchenOrders(selectedBranchId);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    if (socket.connected) {
      setIsConnected(true);
      if (selectedBranchId && selectedBranchId !== "ALL") {
        joinBranchRoom(selectedBranchId);
      } else {
        socket.emit("join_branch", { branchId: "ALL" });
      }
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // KOT Received event
    const handleKotReceived = (data: {
      orderId: string;
      branchId?: string;
      orderNumber?: string;
      orderType?: "DINE-IN" | "TAKEAWAY" | "DELIVERY" | "ROOM SERVICE" | "ROOM-SERVICE";
      tableNumber?: string;
      roomNumber?: string;
      items: KitchenItem[];
      notes?: string;
      status?: string;
      kitchenStatus?: KitchenStatus;
      createdAt?: string;
    }) => {
      console.log("[KDS Socket] KOT received:", data);

      // Play chime
      if (!isSoundMuted) {
        playNewOrderChime();
      }

      // Visual notification
      const label = data.roomNumber
        ? `ROOM ${data.roomNumber}`
        : data.tableNumber
        ? `TABLE T${data.tableNumber}`
        : data.orderType || "NEW ORDER";
      setRecentNotification(`🔔 NEW KOT: ${data.orderNumber || "Order"} (${label})`);
      setTimeout(() => setRecentNotification(null), 6000);

      // Add to orders without duplication
      setOrders((prev) => {
        const exists = prev.some((o) => o._id === data.orderId);
        if (exists) {
          return prev.map((o) =>
            o._id === data.orderId
              ? {
                  ...o,
                  items: data.items,
                  kitchenStatus: "NEW",
                  status: "ORDERED",
                }
              : o
          );
        }

        const newOrder: KdsOrder = {
          _id: data.orderId,
          orderNumber: data.orderNumber || `#${data.orderId.slice(-4).toUpperCase()}`,
          orderType: data.orderType || "DINE-IN",
          tableId: {
            _id: "tbl",
            tableNumber: data.tableNumber || "NA",
          },
          roomNumber: data.roomNumber,
          items: data.items || [],
          notes: data.notes,
          status: "ORDERED",
          kitchenStatus: "NEW",
          branchId: data.branchId,
          createdAt: data.createdAt || new Date().toISOString(),
        };

        return [...prev, newOrder];
      });
    };

    // Order Updated event
    const handleOrderUpdated = (data: {
      orderId: string;
      branchId?: string;
      status: string;
      kitchenStatus?: KitchenStatus;
      startedAt?: string;
      readyAt?: string;
      servedAt?: string;
    }) => {
      console.log("[KDS Socket] Order updated:", data);

      if (data.status === "CANCELLED") {
        setRecentNotification(`⚠ Order #${data.orderId.slice(-4).toUpperCase()} cancelled`);
        setTimeout(() => setRecentNotification(null), 5000);
      }

      setOrders((prev) => {
        // If served, completed, or cancelled, remove from KDS
        if (
          data.kitchenStatus === "SERVED" ||
          data.status === "COMPLETED" ||
          data.status === "CANCELLED"
        ) {
          return prev.filter((o) => o._id !== data.orderId);
        }

        return prev.map((o) => {
          if (o._id === data.orderId) {
            let nextKStatus: KitchenStatus = o.kitchenStatus;
            if (data.kitchenStatus) {
              nextKStatus = data.kitchenStatus;
            } else if (data.status === "PREPARING") {
              nextKStatus = "PREPARING";
            } else if (data.status === "READY") {
              nextKStatus = "READY";
            }

            return {
              ...o,
              status: data.status,
              kitchenStatus: nextKStatus,
              startedAt: data.startedAt || o.startedAt,
              readyAt: data.readyAt || o.readyAt,
              servedAt: data.servedAt || o.servedAt,
            };
          }
          return o;
        });
      });
    };

    socket.on("kot_received", handleKotReceived);
    socket.on("order_updated", handleOrderUpdated);

    const pollTimer = setInterval(() => {
      fetchKitchenOrders(selectedBranchId);
    }, 6000);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("kot_received", handleKotReceived);
      socket.off("order_updated", handleOrderUpdated);
      clearInterval(pollTimer);
      if (selectedBranchId && selectedBranchId !== "ALL") {
        leaveBranchRoom(selectedBranchId);
      }
    };
  }, [selectedBranchId, fetchKitchenOrders, isSoundMuted]);

  // Audio Context Autoplay Consent Watcher
  useEffect(() => {
    const handleFirstUserInteraction = () => {
      const ctx = initAudioContext();
      if (ctx && ctx.state === "running") {
        setNeedsSoundConsent(false);
      }
    };

    window.addEventListener("click", handleFirstUserInteraction, { once: true });
    window.addEventListener("keydown", handleFirstUserInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstUserInteraction);
      window.removeEventListener("keydown", handleFirstUserInteraction);
    };
  }, []);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request error:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn("Exit fullscreen error:", err);
      });
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Status Action Transitions
  const handleAdvanceStatus = async (order: KdsOrder, targetStatus: KitchenStatus) => {
    try {
      setActionInProgress(order._id);
      initAudioContext(); // Ensure sound context is active

      await api.patch(`/kitchen/orders/${order._id}/status`, {
        status: targetStatus,
      });

      // Optimistic update
      setOrders((prev) => {
        if (targetStatus === "SERVED") {
          return prev.filter((o) => o._id !== order._id);
        }
        return prev.map((o) => {
          if (o._id === order._id) {
            return {
              ...o,
              status: targetStatus,
              kitchenStatus: targetStatus,
              startedAt: targetStatus === "PREPARING" ? new Date().toISOString() : o.startedAt,
              readyAt: targetStatus === "READY" ? new Date().toISOString() : o.readyAt,
            };
          }
          return o;
        });
      });
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      alert(axiosError.response?.data?.message || "Failed to update order status");
    } finally {
      setActionInProgress(null);
    }
  };

  // Group orders into 3 KDS Columns
  const newOrders = useMemo(
    () => orders.filter((o) => o.kitchenStatus === "NEW"),
    [orders]
  );
  const prepOrders = useMemo(
    () => orders.filter((o) => o.kitchenStatus === "PREPARING"),
    [orders]
  );
  const readyOrders = useMemo(
    () => orders.filter((o) => o.kitchenStatus === "READY"),
    [orders]
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      {/* ============================================================== */}
      {/* 1. PROFESSIONAL TV HEADER                                     */}
      {/* ============================================================== */}
      <header className="flex-none bg-slate-900 border-b border-slate-800 px-6 py-3.5 shadow-2xl z-30">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Branding & Branch & Live Connection Badge */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
                <FaUtensils size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  KITCHEN DISPLAY
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                      className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 transition cursor-pointer bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-700"
                    >
                      <span>{selectedBranchId === "ALL" ? "ALL OUTLETS" : branch?.branchName || "OUTLET"}</span>
                      <FiChevronDown size={11} className={branchDropdownOpen ? "rotate-180" : ""} />
                    </button>
                    {branchDropdownOpen && (
                      <div className="absolute left-0 top-full mt-2 w-56 bg-slate-950 border border-slate-700 rounded-2xl p-2 shadow-2xl z-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-1.5">
                          Switch Display Outlet
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBranchId("ALL");
                            setBranch(null);
                            localStorage.setItem("pos_selected_branch", "ALL");
                            setBranchDropdownOpen(false);
                            fetchKitchenOrders("ALL");
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                            selectedBranchId === "ALL" ? "bg-rose-600 text-white" : "text-gray-300 hover:bg-white/10"
                          }`}
                        >
                          <span>All Outlets</span>
                          {selectedBranchId === "ALL" && <FiCheck size={14} />}
                        </button>
                        {branches.map((b) => (
                          <button
                            key={b._id}
                            type="button"
                            onClick={() => {
                              setSelectedBranchId(b._id);
                              setBranch(b);
                              localStorage.setItem("pos_selected_branch", b._id);
                              setBranchDropdownOpen(false);
                              fetchKitchenOrders(b._id);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                              selectedBranchId === b._id ? "bg-rose-600 text-white" : "text-gray-300 hover:bg-white/10"
                            }`}
                          >
                            <span className="truncate">{b.branchName}</span>
                            {selectedBranchId === b._id && <FiCheck size={14} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-slate-600">•</span>
                  {/* Socket Status Indicator */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                      isConnected
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse"
                    }`}
                  >
                    {isConnected ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        LIVE
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                        RECONNECTING
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Live Date & Time with Seconds */}
          <div className="flex flex-col items-center">
            <div className="text-3xl font-black font-mono tracking-tight text-slate-100">
              {timeFormatted}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-0.5">
              {dateFormatted}
            </div>
          </div>

          {/* Right: Counts & Controls */}
          <div className="flex items-center gap-4">
            {/* Quick Metrics Pills */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800">
              <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                NEW: {newOrders.length.toString().padStart(2, "0")}
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PREP: {prepOrders.length.toString().padStart(2, "0")}
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                READY: {readyOrders.length.toString().padStart(2, "0")}
              </span>
            </div>

            {/* Sound Toggle Button */}
            <button
              onClick={() => {
                initAudioContext();
                setIsSoundMuted((m) => !m);
              }}
              className={`p-3 rounded-2xl border transition-all active:scale-95 flex items-center justify-center ${
                isSoundMuted
                  ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-md shadow-amber-500/10"
              }`}
              title={isSoundMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isSoundMuted ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
            </button>

            {/* Manual Sync / Refresh Button */}
            <button
              onClick={() => fetchKitchenOrders()}
              className="p-3 rounded-2xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all active:scale-95 flex items-center justify-center"
              title="Refresh Orders"
            >
              <FiRefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>

            {/* Customer Display Link */}
            <Link
              href="/user-dashboard/kitchen/customer-tv"
              className="px-4 py-3 rounded-2xl border border-emerald-500/30 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-600/10 cursor-pointer"
              title="Open Customer Order Status Display"
            >
              <FaBullhorn size={16} />
              <span>CUSTOMER TV 📢</span>
            </Link>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="px-4 py-3 rounded-2xl border border-rose-500/30 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-rose-600/10"
            >
              {isFullscreen ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
              <span>{isFullscreen ? "EXIT TV" : "FULLSCREEN"}</span>
            </button>
          </div>
        </div>

        {/* Global Toast Banner for KOT Arrival */}
        <AnimatePresence>
          {recentNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-3 bg-gradient-to-r from-amber-600 to-rose-600 text-white px-5 py-2.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-between shadow-xl"
            >
              <div className="flex items-center gap-3">
                <FaBell className="animate-bounce" size={18} />
                <span>{recentNotification}</span>
              </div>
              <button
                onClick={() => setRecentNotification(null)}
                className="text-xs uppercase bg-black/20 hover:bg-black/30 px-3 py-1 rounded-xl"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ============================================================== */}
      {/* 2. THREE-COLUMN KDS BOARD                                      */}
      {/* ============================================================== */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 p-5 overflow-hidden">
        {/* ---------------- COLUMN 1: NEW ORDERS ---------------- */}
        <KdsColumn
          title="NEW ORDERS"
          count={newOrders.length}
          badgeBg="bg-amber-500"
          headerBg="bg-amber-950/20 border-amber-500/30 text-amber-300"
          orders={newOrders}
          currentTime={currentTime}
          emptyText="No new orders in queue"
          actionInProgress={actionInProgress}
          onAction={(order) => handleAdvanceStatus(order, "PREPARING")}
          actionLabel="START PREPARING"
          actionColor="bg-amber-500 hover:bg-amber-400 text-slate-950"
          columnType="NEW"
        />

        {/* ---------------- COLUMN 2: PREPARING ---------------- */}
        <KdsColumn
          title="PREPARING"
          count={prepOrders.length}
          badgeBg="bg-blue-500"
          headerBg="bg-blue-950/20 border-blue-500/30 text-blue-300"
          orders={prepOrders}
          currentTime={currentTime}
          emptyText="No orders currently preparing"
          actionInProgress={actionInProgress}
          onAction={(order) => handleAdvanceStatus(order, "READY")}
          actionLabel="MARK READY"
          actionColor="bg-emerald-500 hover:bg-emerald-400 text-slate-950"
          columnType="PREPARING"
        />

        {/* ---------------- COLUMN 3: READY ---------------- */}
        <KdsColumn
          title="READY FOR PICKUP"
          count={readyOrders.length}
          badgeBg="bg-emerald-500"
          headerBg="bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
          orders={readyOrders}
          currentTime={currentTime}
          emptyText="No orders ready"
          actionInProgress={actionInProgress}
          onAction={(order) => handleAdvanceStatus(order, "SERVED")}
          actionLabel="SERVED / DONE"
          actionColor="bg-purple-600 hover:bg-purple-500 text-white"
          columnType="READY"
        />
      </main>
    </div>
  );
}

// ====================================================================
// COLUMN CONTAINER COMPONENT
// ====================================================================
interface KdsColumnProps {
  title: string;
  count: number;
  badgeBg: string;
  headerBg: string;
  orders: KdsOrder[];
  currentTime: number;
  emptyText: string;
  actionInProgress: string | null;
  onAction: (order: KdsOrder) => void;
  actionLabel: string;
  actionColor: string;
  columnType: KitchenStatus;
}

function KdsColumn({
  title,
  count,
  badgeBg,
  headerBg,
  orders,
  currentTime,
  emptyText,
  actionInProgress,
  onAction,
  actionLabel,
  actionColor,
  columnType,
}: KdsColumnProps) {
  return (
    <section className="flex flex-col h-full bg-slate-900/60 rounded-3xl border border-slate-800/80 overflow-hidden shadow-xl">
      {/* Column Fixed Header */}
      <div
        className={`flex-none px-6 py-4 border-b flex items-center justify-between ${headerBg}`}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black tracking-tight">{title}</h2>
        </div>
        <span
          className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-base text-slate-950 shadow-md ${badgeBg}`}
        >
          {count.toString().padStart(2, "0")}
        </span>
      </div>

      {/* Scrollable Cards Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        {orders.length === 0 ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800/60 rounded-2xl p-8 text-center">
            <RiRestaurantLine size={48} className="mb-3 opacity-30 text-slate-500" />
            <p className="font-black text-sm uppercase tracking-widest text-slate-500">
              {emptyText}
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <KdsOrderCard
              key={order._id}
              order={order}
              currentTime={currentTime}
              columnType={columnType}
              actionInProgress={actionInProgress === order._id}
              onAction={() => onAction(order)}
              actionLabel={actionLabel}
              actionColor={actionColor}
            />
          ))
        )}
      </div>
    </section>
  );
}

// ====================================================================
// LARGE-TYPOGRAPHY HIGH-CONTRAST ORDER CARD
// ====================================================================
interface KdsOrderCardProps {
  order: KdsOrder;
  currentTime: number;
  columnType: KitchenStatus;
  actionInProgress: boolean;
  onAction: () => void;
  actionLabel: string;
  actionColor: string;
}

function KdsOrderCard({
  order,
  currentTime,
  columnType,
  actionInProgress,
  onAction,
  actionLabel,
  actionColor,
}: KdsOrderCardProps) {
  // Elapsed time calculation
  const referenceTime = useMemo(() => {
    if (columnType === "PREPARING" && order.startedAt) {
      return new Date(order.startedAt).getTime();
    }
    if (columnType === "READY" && order.readyAt) {
      return new Date(order.readyAt).getTime();
    }
    return new Date(order.createdAt).getTime();
  }, [columnType, order.startedAt, order.readyAt, order.createdAt]);

  const elapsedSeconds = Math.max(0, Math.floor((currentTime - referenceTime) / 1000));
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const remainderSeconds = elapsedSeconds % 60;

  const timerString = `${elapsedMinutes.toString().padStart(2, "0")}:${remainderSeconds
    .toString()
    .padStart(2, "0")}`;

  // Delay Severity:
  // 0-10m: Normal
  // 10-15m: Warning
  // 15m+: Delayed
  const isDelayed = elapsedMinutes >= 15;
  const isWarning = elapsedMinutes >= 10 && !isDelayed;

  // Resolve Location Label
  const locationLabel = useMemo(() => {
    if (order.roomNumber) {
      return `ROOM ${order.roomNumber}`;
    }
    if (order.orderType === "ROOM SERVICE" || order.orderType === "ROOM-SERVICE") {
      return `ROOM ${order.roomNumber || "SRV"}`;
    }
    if (order.tableId) {
      if (typeof order.tableId === "object" && order.tableId.tableNumber) {
        return `TABLE T${order.tableId.tableNumber}`;
      }
    }
    if (order.orderType === "TAKEAWAY") {
      return "TAKEAWAY";
    }
    if (order.orderType === "DELIVERY") {
      return "DELIVERY";
    }
    return "TABLE DINE-IN";
  }, [order.roomNumber, order.orderType, order.tableId]);

  // Order Type Badge Style
  const typeBadgeStyle = useMemo(() => {
    switch (order.orderType) {
      case "ROOM SERVICE":
      case "ROOM-SERVICE":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "TAKEAWAY":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "DELIVERY":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      default:
        return "bg-sky-500/20 text-sky-300 border-sky-500/40";
    }
  }, [order.orderType]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-3xl bg-slate-900 border-2 transition-all p-5 shadow-2xl flex flex-col justify-between ${
        isDelayed
          ? "border-rose-500/80 shadow-rose-950/40"
          : isWarning
          ? "border-amber-500/60 shadow-amber-950/30"
          : "border-slate-800 hover:border-slate-700"
      }`}
    >
      {/* Card Top: Order Number + Order Type Badge */}
      <div>
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black tracking-tight text-white">
                {order.orderNumber || `#${order._id.slice(-4).toUpperCase()}`}
              </span>
            </div>
            <div className="text-xl font-black text-amber-400 tracking-tight mt-0.5">
              {locationLabel}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${typeBadgeStyle}`}
            >
              {order.orderType || "DINE-IN"}
            </span>

            {/* Delay Indicator Tag */}
            {isDelayed ? (
              <span className="px-2.5 py-0.5 rounded-lg bg-rose-500 text-slate-950 text-[11px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                <FiAlertTriangle size={13} />
                DELAYED
              </span>
            ) : isWarning ? (
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                <FiClock size={13} />
                WARNING
              </span>
            ) : null}
          </div>
        </div>

        {/* Live Elapsed Timer */}
        <div
          className={`flex items-center justify-between my-3 px-3.5 py-2 rounded-2xl border font-mono ${
            isDelayed
              ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
              : isWarning
              ? "bg-amber-950/30 border-amber-500/30 text-amber-300"
              : "bg-slate-950/60 border-slate-800 text-slate-300"
          }`}
        >
          <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <FiClock size={14} />
            {columnType === "PREPARING"
              ? "Prep Time"
              : columnType === "READY"
              ? "Ready Time"
              : "Waiting"}
          </span>
          <span className="text-xl font-black tracking-tight">{timerString}</span>
        </div>

        {/* Items List (Large Typography) */}
        <div className="space-y-2.5 my-4 divide-y divide-slate-800/60">
          {order.items.map((item, idx) => (
            <div key={idx} className="pt-2 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-black text-base flex items-center justify-center shrink-0">
                  {item.quantity}×
                </span>
                <div>
                  <span className="text-lg font-bold text-slate-100 leading-snug">
                    {item.name}
                  </span>
                  {item.isManual && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-widest border border-amber-500/30">
                      MANUAL
                    </span>
                  )}
                  {item.notes && (
                    <p className="text-xs text-amber-300/90 font-medium italic mt-0.5">
                      Note: {item.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order-level Notes / Special Instructions */}
        {order.notes && (
          <div className="mb-4 bg-amber-950/30 border border-amber-500/30 text-amber-200 px-3.5 py-2 rounded-2xl text-xs font-bold flex items-start gap-2">
            <FiAlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={14} />
            <span>Note: {order.notes}</span>
          </div>
        )}
      </div>

      {/* Card Action Button */}
      <div className="pt-3 border-t border-slate-800/80">
        <button
          onClick={onAction}
          disabled={actionInProgress}
          className={`w-full py-4 rounded-2xl font-black text-base uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 cursor-pointer ${actionColor} ${
            actionInProgress ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {actionInProgress ? (
            <FiRefreshCw className="animate-spin" size={20} />
          ) : columnType === "NEW" ? (
            <FiPlay size={20} />
          ) : columnType === "PREPARING" ? (
            <FiCheckCircle size={20} />
          ) : (
            <FaCheckDouble size={18} />
          )}
          <span>{actionInProgress ? "PROCESSING..." : actionLabel}</span>
        </button>
      </div>
    </motion.div>
  );
}
