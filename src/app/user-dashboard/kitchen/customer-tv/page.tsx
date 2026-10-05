"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AxiosError } from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  FiClock,
  FiRefreshCw,
  FiMaximize,
  FiMinimize,
  FiVolume2,
  FiVolumeX,
  FiCheckCircle,
  FiChevronDown,
  FiCheck,
  FiMapPin,
  FiArrowLeft
} from "react-icons/fi";
import { FaUtensils, FaBell, FaBullhorn } from "react-icons/fa6";
import { RiFireLine, RiRestaurantLine } from "react-icons/ri";
import api from "../../../services/api";
import { getSocket, joinBranchRoom, leaveBranchRoom } from "../../../services/socket";
import { playNewOrderChime, initAudioContext } from "../../../services/sound";

export type KitchenStatus = "NEW" | "PREPARING" | "READY" | "SERVED";

export interface CustomerOrder {
  _id: string;
  orderNumber?: string;
  orderType?: string;
  tableId?: {
    _id: string;
    tableNumber: string;
    areaName?: {
      areaName?: string;
      branchName?: {
        _id?: string;
        branchName?: string;
      };
    };
  } | string;
  roomNumber?: string;
  status: string;
  kitchenStatus: KitchenStatus;
  branchId?: string;
  readyAt?: string;
  createdAt: string;
}

export interface BranchInfo {
  _id: string;
  branchName: string;
  branchCode?: string;
}

export default function CustomerTvDisplayPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [branch, setBranch] = useState<BranchInfo | null>(null);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isVoiceAnnounceEnabled, setIsVoiceAnnounceEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [activeAnnouncement, setActiveAnnouncement] = useState<string | null>(null);
  const announcedOrderIdsRef = useRef<Set<string>>(new Set());

  // 1. Clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Voice announcement helper using SpeechSynthesis API
  const announceOrder = useCallback((tokenText: string, locationText: string) => {
    if (typeof window === "undefined") return;
    
    // Play chime sound first
    if (!isSoundMuted) {
      playNewOrderChime();
    }

    // Speech announcement if enabled
    if (isVoiceAnnounceEnabled && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel(); // clear previous queue
        const phrase = `Order number ${tokenText}, ${locationText}, is now ready for pickup at the counter!`;
        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("[TTS] Speech synthesis error:", err);
      }
    }
  }, [isSoundMuted, isVoiceAnnounceEnabled]);

  // 2. Fetch Branches & Context
  const fetchBranchContext = useCallback(async () => {
    try {
      const res = await api.get("/get/branch/role");
      const branchList: BranchInfo[] = res.data?.data || [];
      setBranches(branchList);

      const savedBranch = typeof window !== "undefined" ? localStorage.getItem("pos_tv_branch") : null;
      if (savedBranch && savedBranch !== "ALL") {
        const found = branchList.find((b) => b._id === savedBranch);
        if (found) {
          setBranch(found);
          setSelectedBranchId(found._id);
          return found._id;
        }
      }
      setSelectedBranchId("ALL");
      setBranch(null);
      return "ALL";
    } catch (err) {
      console.warn("Could not load branches:", err);
    }
    return "ALL";
  }, []);

  // 3. Fetch Orders
  const fetchKitchenOrders = useCallback(async (branchId?: string) => {
    try {
      const targetBranch = branchId !== undefined ? branchId : selectedBranchId;
      const url = targetBranch && targetBranch !== "ALL"
        ? `/kitchen/orders?branchId=${targetBranch}`
        : "/kitchen/orders";
      const res = await api.get(url);
      const rawOrders: CustomerOrder[] = res.data?.data || [];

      const normalized = rawOrders.map((o) => {
        let kStatus: KitchenStatus = "NEW";
        if (o.kitchenStatus) {
          kStatus = o.kitchenStatus;
        } else if (o.status === "PREPARING") {
          kStatus = "PREPARING";
        } else if (o.status === "READY") {
          kStatus = "READY";
        } else {
          kStatus = "NEW";
        }

        // Format clean token
        let token = o.orderNumber || `#${o._id.slice(-4).toUpperCase()}`;

        return {
          ...o,
          orderNumber: token,
          kitchenStatus: kStatus,
        };
      });

      // Filter active orders (not served/completed)
      const active = normalized.filter(
        (o) => o.kitchenStatus !== "SERVED" && o.status !== "COMPLETED"
      );

      // Check for newly ready orders to announce
      active.forEach((order) => {
        if (order.kitchenStatus === "READY" && !announcedOrderIdsRef.current.has(order._id)) {
          announcedOrderIdsRef.current.add(order._id);
          const tokenClean = (order.orderNumber || "").replace("#", "");
          const locClean = typeof order.tableId === "object" && order.tableId?.tableNumber
            ? `Table ${order.tableId.tableNumber}`
            : order.roomNumber
            ? `Room ${order.roomNumber}`
            : order.orderType || "Takeaway";
          
          setActiveAnnouncement(`Order #${tokenClean} (${locClean}) is READY FOR PICKUP!`);
          announceOrder(tokenClean, locClean);
          setTimeout(() => setActiveAnnouncement(null), 8000);
        }
      });

      setOrders(active);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error("Error loading customer orders:", axiosError.message);
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId, announceOrder]);

  // Initial mount
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

  // 4. Socket.IO Real-time Events
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

    const handleKotReceived = () => {
      fetchKitchenOrders(selectedBranchId);
    };

    const handleOrderUpdated = (data: any) => {
      console.log("[Customer TV] Order updated:", data);
      fetchKitchenOrders(selectedBranchId);
    };

    socket.on("kot_received", handleKotReceived);
    socket.on("order_updated", handleOrderUpdated);

    // 4-second fallback poll
    const pollTimer = setInterval(() => {
      fetchKitchenOrders(selectedBranchId);
    }, 4000);

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
  }, [selectedBranchId, fetchKitchenOrders]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Split into PREPARING vs READY
  // Preparing includes NEW (queue) and PREPARING
  const preparingOrders = useMemo(() => {
    return orders.filter(
      (o) => o.kitchenStatus === "NEW" || o.kitchenStatus === "PREPARING" || o.status === "ORDERED" || o.status === "PENDING" || o.status === "PREPARING"
    );
  }, [orders]);

  const readyOrders = useMemo(() => {
    return orders.filter((o) => o.kitchenStatus === "READY" || o.status === "READY");
  }, [orders]);

  function getOrderBadgeLabel(order: CustomerOrder) {
    if (order.orderNumber) {
      return order.orderNumber.replace("#", "");
    }
    return order._id.slice(-4).toUpperCase();
  }

  function getOrderSubtext(order: CustomerOrder) {
    if (typeof order.tableId === "object" && order.tableId?.tableNumber) {
      return `Table ${order.tableId.tableNumber}`;
    }
    if (order.roomNumber) {
      return `Room ${order.roomNumber}`;
    }
    return order.orderType || "Dine-In";
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none font-sans overflow-hidden">
      {/* ============================================================== */}
      {/* 1. TOP STATUS BAR (OPTIMIZED FOR LARGE TV DISPLAYS)           */}
      {/* ============================================================== */}
      <header className="flex-none bg-slate-900/95 border-b border-slate-800 px-6 sm:px-8 py-3.5 shadow-2xl backdrop-blur-md z-30">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Branding & Outlet Switcher */}
          <div className="flex items-center gap-4">
            <Link
              href="/user-dashboard/kitchen"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Return to Kitchen KDS"
            >
              <FiArrowLeft size={18} />
            </Link>

            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/20">
              <FaUtensils size={20} />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>ORDER STATUS DISPLAY</span>
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                {/* Outlet selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                    className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 transition cursor-pointer bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700"
                  >
                    <FiMapPin size={11} />
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
                          localStorage.setItem("pos_tv_branch", "ALL");
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
                            localStorage.setItem("pos_tv_branch", b._id);
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
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                    isConnected
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE TV
                </span>
              </div>
            </div>
          </div>

          {/* Center: Live Date & Clock */}
          <div className="hidden md:flex flex-col items-center">
            <div className="text-3xl lg:text-4xl font-black font-mono tracking-tight text-slate-100">
              {timeFormatted}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-0.5">
              {dateFormatted}
            </div>
          </div>

          {/* Right: Sound, Voice & Fullscreen Controls */}
          <div className="flex items-center gap-3">
            {/* Voice Announcement Toggle */}
            <button
              onClick={() => setIsVoiceAnnounceEnabled((v) => !v)}
              className={`p-3 rounded-2xl border transition-all active:scale-95 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${
                isVoiceAnnounceEnabled
                  ? "bg-purple-500/15 border-purple-500/30 text-purple-300 shadow-md shadow-purple-500/10"
                  : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
              }`}
              title={isVoiceAnnounceEnabled ? "Voice Announce: ON" : "Voice Announce: OFF"}
            >
              <FaBullhorn size={16} />
              <span className="hidden sm:inline">{isVoiceAnnounceEnabled ? "Voice On" : "Voice Off"}</span>
            </button>

            {/* Sound Chime Toggle */}
            <button
              onClick={() => {
                initAudioContext();
                setIsSoundMuted((m) => !m);
              }}
              className={`p-3 rounded-2xl border transition-all active:scale-95 flex items-center justify-center ${
                isSoundMuted
                  ? "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                  : "bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-md shadow-amber-500/10"
              }`}
              title={isSoundMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isSoundMuted ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => fetchKitchenOrders()}
              className="p-3 rounded-2xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all active:scale-95 flex items-center justify-center"
              title="Refresh Orders"
            >
              <FiRefreshCw size={18} className={loading ? "animate-spin text-amber-400" : ""} />
            </button>

            {/* Switch to Chef KDS View */}
            <Link
              href="/user-dashboard/kitchen/tv"
              className="hidden lg:inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 transition cursor-pointer"
            >
              <RiFireLine size={16} className="text-rose-400" />
              <span>Chef KDS</span>
            </Link>

            {/* Fullscreen TV Mode */}
            <button
              onClick={toggleFullscreen}
              className="px-4 py-2.5 rounded-2xl border border-rose-500/30 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-rose-600/10"
            >
              {isFullscreen ? <FiMinimize size={16} /> : <FiMaximize size={16} />}
              <span>{isFullscreen ? "EXIT" : "FULLSCREEN"}</span>
            </button>
          </div>
        </div>

        {/* Global Floating Banner for Newly Called Orders */}
        <AnimatePresence>
          {activeAnnouncement && (
            <motion.div
              initial={{ opacity: 0, y: -25, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -25, scale: 0.95 }}
              className="mt-3 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white px-6 py-3 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider flex items-center justify-between shadow-2xl border border-emerald-400/40"
            >
              <div className="flex items-center gap-3.5">
                <FaBell className="animate-bounce text-amber-300 text-xl" />
                <span className="drop-shadow-md">📢 {activeAnnouncement}</span>
              </div>
              <span className="text-xs bg-black/20 px-3 py-1 rounded-full uppercase tracking-widest text-emerald-100">
                Collect at Counter
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ============================================================== */}
      {/* 2. SPLIT SCREEN: PREPARING (LEFT) vs READY FOR PICKUP (RIGHT)   */}
      {/* ============================================================== */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800/80 min-h-0 bg-slate-950">
        
        {/* ============================================================ */}
        {/* COLUMN 1: NOW PREPARING / IN THE KITCHEN                     */}
        {/* ============================================================ */}
        <section className="flex flex-col min-h-0 p-6 lg:p-8 bg-gradient-to-b from-slate-900/60 to-slate-950/80">
          {/* Column Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                <RiFireLine size={26} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-amber-400 flex items-center gap-2">
                  <span>PREPARING</span>
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Your food is being cooked with care
                </p>
              </div>
            </div>

            <span className="px-4 py-1.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 font-black text-xl lg:text-2xl">
              {preparingOrders.length.toString().padStart(2, "0")}
            </span>
          </div>

          {/* Tokens Grid */}
          <div className="flex-1 overflow-y-auto pt-6 scrollbar-none">
            {preparingOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3 py-16">
                <RiRestaurantLine size={54} className="opacity-40" />
                <p className="text-lg font-black uppercase tracking-widest text-slate-500">
                  All Kitchen Orders Clear
                </p>
                <p className="text-xs text-slate-600">New orders will show up here automatically</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                <AnimatePresence>
                  {preparingOrders.map((order) => {
                    const token = getOrderBadgeLabel(order);
                    const subtext = getOrderSubtext(order);

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        key={order._id}
                        className="rounded-3xl border border-slate-800 bg-slate-900/90 hover:border-amber-500/40 p-5 flex flex-col items-center justify-center shadow-lg transition-all"
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          TOKEN
                        </span>
                        <div className="text-4xl lg:text-5xl font-black font-mono tracking-tight text-white my-1 drop-shadow-sm">
                          {token}
                        </div>
                        <span className="text-xs font-bold text-amber-400/90 bg-amber-500/10 px-3 py-0.5 rounded-full border border-amber-500/20 truncate max-w-full">
                          {subtext}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* COLUMN 2: READY FOR PICKUP / PLEASE COLLECT                  */}
        {/* ============================================================ */}
        <section className="flex flex-col min-h-0 p-6 lg:p-8 bg-gradient-to-b from-emerald-950/20 via-slate-900/40 to-slate-950/80">
          {/* Column Header */}
          <div className="flex items-center justify-between pb-6 border-b border-emerald-900/40">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20 animate-pulse">
                <FiCheckCircle size={26} />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-emerald-400 flex items-center gap-2">
                  <span>READY FOR PICKUP</span>
                </h2>
                <p className="text-xs font-bold text-emerald-200/60 uppercase tracking-widest mt-0.5">
                  Please collect your order at the counter
                </p>
              </div>
            </div>

            <span className="px-4 py-1.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black text-xl lg:text-2xl animate-pulse">
              {readyOrders.length.toString().padStart(2, "0")}
            </span>
          </div>

          {/* Tokens Grid */}
          <div className="flex-1 overflow-y-auto pt-6 scrollbar-none">
            {readyOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3 py-16">
                <FiCheckCircle size={54} className="opacity-40 text-emerald-600" />
                <p className="text-lg font-black uppercase tracking-widest text-slate-500">
                  No Orders Currently Ready
                </p>
                <p className="text-xs text-slate-600">Freshly prepared orders will flash here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                <AnimatePresence>
                  {readyOrders.map((order) => {
                    const token = getOrderBadgeLabel(order);
                    const subtext = getOrderSubtext(order);

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.7, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        key={order._id}
                        className="relative rounded-3xl border-2 border-emerald-500/80 bg-gradient-to-b from-emerald-950/80 to-slate-900 p-5 flex flex-col items-center justify-center shadow-2xl shadow-emerald-500/20 animate-pulse hover:scale-105 transition-transform"
                      >
                        {/* Glow indicator */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        </div>

                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300/80">
                          READY NOW
                        </span>
                        
                        {/* Giant Token Number */}
                        <div className="text-5xl lg:text-6xl font-black font-mono tracking-tight text-emerald-400 my-1 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                          {token}
                        </div>

                        <span className="text-xs font-black uppercase tracking-wider text-slate-950 bg-emerald-400 px-3 py-0.5 rounded-full shadow-md truncate max-w-full">
                          {subtext}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ============================================================== */}
      {/* 3. FOOTER BANNER (INSTRUCTIONS FOR WAITING CUSTOMERS)          */}
      {/* ============================================================== */}
      <footer className="flex-none bg-slate-900 border-t border-slate-800 px-8 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-400">
          <RiFireLine />
          <span>Status updates in real-time as chefs prepare your meal</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400">
          <FiCheckCircle />
          <span>When your number appears in GREEN, kindly collect your tray at the pickup counter</span>
        </div>
      </footer>
    </div>
  );
}
