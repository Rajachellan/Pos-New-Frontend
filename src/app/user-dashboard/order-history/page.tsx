"use client";

import React, { useState, useEffect, Suspense } from "react";
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
} from "react-icons/fi";
import { MdTableRestaurant } from "react-icons/md";
import { useAuth } from "@/src/app/context/AuthContext";

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
}

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
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>(tabParam ? tabParam.toUpperCase() : "ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (tabParam) {
      setSelectedStatus(tabParam.toUpperCase());
    }
  }, [tabParam]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const savedBranchId = typeof window !== "undefined" ? localStorage.getItem("pos_selected_branch") : null;
      const branchQuery = savedBranchId && savedBranchId !== "ALL" ? `?branchId=${savedBranchId}` : "";
      const res = await api.get(`/orders/history${branchQuery}`);
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

  const handleSettleOrder = async (order: Order) => {
    try {
      await api.post("/pay/order", {
        orderId: order._id,
        tableId: order.tableId?._id,
        paymentMethod: "CASH",
      });
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
  const filteredOrders = orders.filter((order) => {
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

  const handlePrintReceipt = (order: Order) => {
    const printWindow = window.open("", "_blank", "width=600,height=700");
    if (!printWindow) return;

    let settings = {
      restaurantName: "TANJAVOOR RESTAURANT",
      tagline: "Tax Invoice / Bill",
      logoUrl: "",
      phone: "",
      address: "",
      gstin: "",
    };
    try {
      const saved = localStorage.getItem("pos_terminal_settings");
      if (saved) settings = { ...settings, ...JSON.parse(saved) };
    } catch (e) {}

    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 6px 0;">${item.name} x${item.quantity}</td>
          <td style="padding: 6px 0; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    const orderNum = order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Order Receipt ${orderNum}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; width: 300px; margin: auto; }
            h2, h3 { text-align: center; margin: 4px 0; }
            .logo-wrap { text-align: center; margin-bottom: 8px; }
            .logo-wrap img { max-height: 55px; max-width: 130px; object-fit: contain; }
            .sub-info { font-size: 11px; text-align: center; color: #555; margin: 2px 0; }
            .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            .total { font-weight: bold; font-size: 15px; margin-top: 10px; text-align: right; }
          </style>
        </head>
        <body>
          ${settings.logoUrl ? `<div class="logo-wrap"><img src="${settings.logoUrl}" alt="Logo" /></div>` : ''}
          <h2>${settings.restaurantName || 'TANJAVOOR RESTAURANT'}</h2>
          <h3>Tax Invoice / Bill</h3>
          ${settings.address ? `<p class="sub-info">${settings.address}</p>` : ''}
          ${settings.phone ? `<p class="sub-info">Tel: ${settings.phone}</p>` : ''}
          ${settings.gstin ? `<p class="sub-info">GSTIN: ${settings.gstin}</p>` : ''}
          <p style="font-size: 11px; text-align: center; margin-top: 6px;">Order: ${orderNum} | Table: #${order.tableId?.tableNumber || 'N/A'}<br/>Date: ${new Date(order.createdAt).toLocaleString()}</p>
          <div class="divider"></div>
          <table>
            <thead>
              <tr style="border-bottom: 1px solid #000;">
                <th style="text-align: left;">Item</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="total">Total: ₹${(order.totalAmount || 0).toFixed(2)}</div>
          ${order.paymentMethod ? `<p style="text-align: right; font-size: 12px; font-weight: bold;">Payment: ${order.paymentMethod} (PAID)</p>` : ''}
          <p style="text-align: center; margin-top: 20px; font-size: 11px;">Thank you for dining with us!</p>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shadow-xs w-fit"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh Feed
        </button>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {canViewFinances() && summary.totalRevenue !== null ? (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales Revenue</p>
              <h3 className="text-2xl font-extrabold text-gray-900 mt-1">₹{(summary.totalRevenue || 0).toFixed(2)}</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#fdf2f2] text-[#e02424] flex items-center justify-center text-xl font-bold">
              <FiDollarSign />
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Orders</p>
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
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</p>
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
            <p className="text-sm font-semibold text-gray-600">No orders found matching your filter.</p>
            <p className="text-xs text-gray-400 mt-1">Try clearing your search query or switching tabs.</p>
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
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

