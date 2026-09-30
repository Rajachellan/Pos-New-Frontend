"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTrendingUp,
  FiKey,
  FiClock,
  FiCoffee,
  FiStar,
  FiActivity,
  FiShield,
  FiLayers,
} from "react-icons/fi";
import { MdHotel, MdMeetingRoom, MdLocalDining, MdCleaningServices } from "react-icons/md";

// Mock live hotel notifications feed
const liveEvents = [
  { id: 1, title: "Room 304 Check-In", desc: "VIP Guest • Keycard #482", icon: <FiKey className="text-[#e02424]" />, time: "Just now" },
  { id: 2, title: "Dining Order #104", desc: "Table 8 • 2x Club Steak", icon: <FiCoffee className="text-[#9b1c1c]" />, time: "1 min ago" },
  { id: 3, title: "Room 201 Housekeeping", desc: "Status updated to Ready", icon: <MdCleaningServices className="text-emerald-500" />, time: "3 mins ago" },
];

export default function HeroAnimation() {
  const [currentEvent, setCurrentEvent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentEvent((prev) => (prev + 1) % liveEvents.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full aspect-square max-w-[550px] mx-auto flex items-center justify-center p-4">
      {/* Background Soft Glow & Radial Gradients */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[#fdf2f2] via-[#fde8e8] to-white opacity-80 blur-xl -z-10" />
      
      {/* Decorative Rotating Red Accent Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute w-[92%] h-[92%] rounded-full border border-dashed border-[#e02424]/20 pointer-events-none"
      />

      {/* Main 1:1 Aspect Container Glass Card */}
      <div className="relative w-full h-full rounded-2xl bg-white/95 backdrop-blur-md border border-[#fde8e8] shadow-2xl shadow-[#e02424]/10 p-5 flex flex-col justify-between overflow-hidden">
        
        {/* TOP BAR: Hotel Name & Live Status */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#e02424] text-white flex items-center justify-center font-bold shadow-md shadow-[#e02424]/30">
              <MdHotel className="text-xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-sm tracking-tight">Grand Royal Resort</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fde8e8] text-[#9b1c1c] font-semibold">
                  Main Branch
                </span>
              </div>
              <p className="text-[11px] text-gray-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live PMS Connected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#fdf2f2] px-3 py-1.5 rounded-lg border border-[#fde8e8]">
            <FiActivity className="text-[#e02424] text-xs animate-spin" style={{ animationDuration: "6s" }} />
            <span className="text-xs font-bold text-[#9b1c1c]">94.8% Occupancy</span>
          </div>
        </div>

        {/* MIDDLE SECTION: Grid of Hotel Management Modules & Live Room Matrix */}
        <div className="my-3 space-y-3 flex-1 flex flex-col justify-center">
          
          {/* Quick Metrics Cards Row */}
          <div className="grid grid-cols-3 gap-2.5">
            <motion.div
              whileHover={{ y: -2 }}
              className="p-2.5 rounded-xl bg-[#fdf2f2] border border-[#fde8e8] text-center"
            >
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-center gap-1">
                <MdMeetingRoom className="text-[#e02424]" /> Active Rooms
              </div>
              <div className="text-lg font-extrabold text-[#9b1c1c] mt-0.5">142/150</div>
              <div className="text-[10px] text-emerald-600 font-medium">94.6% Full</div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="p-2.5 rounded-xl bg-[#fdf2f2] border border-[#fde8e8] text-center"
            >
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-center gap-1">
                <FiTrendingUp className="text-[#e02424]" /> Today's Rev.
              </div>
              <div className="text-lg font-extrabold text-[#9b1c1c] mt-0.5">$18,450</div>
              <div className="text-[10px] text-[#e02424] font-medium">+14.2% vs avg</div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="p-2.5 rounded-xl bg-[#fdf2f2] border border-[#fde8e8] text-center"
            >
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-center gap-1">
                <MdLocalDining className="text-[#e02424]" /> Kitchen Orders
              </div>
              <div className="text-lg font-extrabold text-[#9b1c1c] mt-0.5">28 Active</div>
              <div className="text-[10px] text-emerald-600 font-medium">Avg ~12 mins</div>
            </motion.div>
          </div>

          {/* Room Live Status Grid Matrix */}
          <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <FiLayers className="text-[#e02424]" /> Floor 3 Room Allocation
              </span>
              <span className="text-[11px] text-gray-400">Automated Dispatch</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { num: "301", status: "Occupied", color: "bg-[#e02424] text-white" },
                { num: "302", status: "Cleaning", color: "bg-amber-100 text-amber-800 border border-amber-200" },
                { num: "303", status: "Available", color: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
                { num: "304", status: "Reserved", color: "bg-[#fde8e8] text-[#9b1c1c] border border-[#e02424]/30" },
              ].map((room, idx) => (
                <motion.div
                  key={room.num}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-2 rounded-lg text-center ${room.color}`}
                >
                  <div className="text-xs font-bold">Room {room.num}</div>
                  <div className="text-[9px] opacity-90 font-medium mt-0.5">{room.status}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Dynamic Live Event Toast Feed */}
        <div className="mt-auto">
          <div className="text-[11px] font-semibold text-gray-400 mb-1 flex items-center justify-between">
            <span>Live Activity Log</span>
            <span className="flex items-center gap-1 text-[#e02424]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e02424] animate-ping" /> Real-time
            </span>
          </div>

          <div className="relative h-[58px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={liveEvents[currentEvent].id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-[#fdf2f2] to-white border border-[#fde8e8] shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-xs border border-[#fde8e8] flex items-center justify-center text-base">
                    {liveEvents[currentEvent].icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{liveEvents[currentEvent].title}</h4>
                    <p className="text-[11px] text-gray-500">{liveEvents[currentEvent].desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[#9b1c1c] font-semibold bg-white px-2 py-1 rounded-md border border-[#fde8e8]">
                  <FiClock className="text-[10px]" />
                  {liveEvents[currentEvent].time}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Floating Micro Badges */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-2 -right-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-[#fde8e8] flex items-center gap-1.5"
        >
          <FiStar className="text-amber-400 fill-amber-400 text-xs" />
          <span className="text-xs font-bold text-gray-800">4.9/5 Guest Rating</span>
        </motion.div>

        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-2 -left-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-[#fde8e8] flex items-center gap-2"
        >
          <FiShield className="text-[#e02424] text-xs" />
          <span className="text-xs font-bold text-[#9b1c1c]">Multi-Branch Synced</span>
        </motion.div>

      </div>
    </div>
  );
}
