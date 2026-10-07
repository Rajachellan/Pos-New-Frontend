"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import HotelSlider from "./components/HomepageSlider";
import {
  FiArrowRight,
  FiCheck,
  FiChevronDown,
  FiMenu,
  FiX,
  FiStar,
  FiShield,
  FiLayers,
  FiTrendingUp,
  FiClock,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiGlobe,
  FiSearch,
  FiBell,
  FiPlus,
} from "react-icons/fi";
import {
  MdOutlineBed,
  MdOutlineTableRestaurant,
  MdOutlineCleaningServices,
  MdOutlineSoupKitchen,
  MdHotel,
} from "react-icons/md";
import { FaXTwitter, FaLinkedinIn, FaYoutube } from "react-icons/fa6";

const partnerLogos = [
  { name: "Taj Hotels", src: "/images/taj.webp" },
  { name: "Marriott Hotels & Resorts", src: "/images/marriott.png" },
  { name: "Radisson Hotels", src: "/images/radison.jpg" },
  { name: "Lemon Tree Premier", src: "/images/lemon-tree.png" },
  { name: "HiQ Hotel Management", src: "/images/hiq.jpg" },
  { name: "Carriage House Inn", src: "/images/hotel-6.jpg" },
  { name: "The Grand Hotel", src: "/images/logo-7.jpg" },
  { name: "Hotel Resort", src: "/images/hotel.jpg" },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track window scroll for enhanced sticky navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-serif selection:bg-red-500 selection:text-white relative">
      {/* ========================================================================= */}
      {/* 1. STICKY TOP NAVBAR                                                      */}
      {/* ========================================================================= */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200/80"
            : "bg-white/90 backdrop-blur-xs border-b border-gray-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#9b1c1c] via-[#e02424] to-[#f05252] flex items-center justify-center text-white shadow-md shadow-red-500/20"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M19 2H5C3.89543 2 3 2.89543 3 4V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V4C21 2.89543 20.1046 2 19 2ZM7 6H9V8H7V6ZM7 10H9V12H7V10ZM7 14H9V16H7V14ZM17 18H7V20H17V18ZM17 16H15V14H17V16ZM17 12H15V10H17V12ZM17 8H15V6H17V8ZM13 6H11V8H13V6ZM13 10H11V12H13V10ZM13 14H11V16H13V14Z" />
              </svg>
            </motion.div>
            <span className="text-2xl font-black tracking-tight text-gray-950">
              Hotel<span className="text-[#e02424]">Pro</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-gray-600">
            <a href="#product" className="hover:text-[#e02424] transition-colors relative py-1 group">
              Product
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#e02424] group-hover:w-full transition-all duration-200" />
            </a>
            <a href="#features" className="hover:text-[#e02424] transition-colors relative py-1 group">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#e02424] group-hover:w-full transition-all duration-200" />
            </a>
            <a href="#solutions" className="hover:text-[#e02424] transition-colors relative py-1 group">
              Solutions
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#e02424] group-hover:w-full transition-all duration-200" />
            </a>
            <a href="#pricing" className="hover:text-[#e02424] transition-colors relative py-1 group">
              Pricing
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#e02424] group-hover:w-full transition-all duration-200" />
            </a>
            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-[#e02424] transition-colors py-1">
              <span>Resources</span>
              <FiChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
            </div>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {/* Admin Port Button with Pulse */}
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/admin-dashboard"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Admin Port</span>
              </Link>
            </motion.div>

            <Link
              href="/user/login"
              className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-gray-950 transition"
            >
              Login
            </Link>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/user/login"
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#e02424] hover:bg-[#c81e1e] transition shadow-md shadow-red-500/25 block"
              >
                Get Started
              </Link>
            </motion.div>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer with AnimatePresence */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-white border-b border-gray-200 px-6 py-5 shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col gap-4 text-base font-semibold text-gray-700">
                <a href="#product" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#e02424]">
                  Product
                </a>
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#e02424]">
                  Features
                </a>
                <a href="#solutions" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#e02424]">
                  Solutions
                </a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#e02424]">
                  Pricing
                </a>
                <hr className="border-gray-100 my-1" />
                <Link
                  href="/admin-dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50 text-xs font-bold text-gray-800 border border-gray-200"
                >
                  <span>Admin Port</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </Link>
                <div className="flex items-center gap-3 pt-2">
                  <Link
                    href="/user/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2.5 text-center text-sm font-bold border border-gray-300 rounded-xl text-gray-800"
                  >
                    Login
                  </Link>
                  <Link
                    href="/user/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2.5 text-center text-sm font-bold bg-[#e02424] text-white rounded-xl shadow-md"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION WITH ENHANCED ANIMATIONS                                  */}
      {/* ========================================================================= */}
      <section id="product" className="relative pt-12 pb-20 bg-gradient-to-b from-white via-red-50/15 to-white">
      <HotelSlider/>
      </section>

      {/* ========================================================================= */}
      {/* 3. TRUSTED BY CLIENT HOTEL LOGOS (INFINITE MARQUEE)                       */}
      {/* ========================================================================= */}
      <section className="py-12 border-y border-gray-100 bg-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8">
          <p className="text-[11px] sm:text-xs font-black tracking-[0.25em] text-gray-400 uppercase">
            TRUSTED BY LEADING LUXURY HOTELS, RESORTS & RESTAURANT CHAINS
          </p>
        </div>

        {/* Marquee Container with smooth left and right gradient edge masks */}
        <div className="relative w-full overflow-hidden">
          {/* Left Gradient Edge Mask */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-36 z-10 bg-gradient-to-r from-white via-white/80 to-transparent" />
          
          {/* Right Gradient Edge Mask */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-36 z-10 bg-gradient-to-l from-white via-white/80 to-transparent" />

          {/* Infinite Marquee Track (Double duplicate to ensure seamless looping) */}
          <div className="animate-marquee flex items-center gap-6 sm:gap-10 py-2">
            {[...partnerLogos, ...partnerLogos].map((logo, index) => (
              <div
                key={`${logo.name}-${index}`}
                className="group shrink-0 h-18 sm:h-22 w-44 sm:w-56 px-5 py-3 rounded-2xl bg-gray-50/70 hover:bg-white border border-gray-150 hover:border-gray-300 shadow-2xs hover:shadow-lg transition-all duration-300 flex items-center justify-center cursor-pointer"
              >
                <img
                  src={logo.src}
                  alt={logo.name}
                  className="max-h-12 sm:max-h-14 max-w-[130px] sm:max-w-[160px] w-auto h-auto object-contain filter grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. STATS METRICS COUNTER ROW                                              */}
      {/* ========================================================================= */}
      <section className="py-14 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Stat 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6, boxShadow: "0 20px 25px -5px rgba(224, 36, 36, 0.08)" }}
              transition={{ duration: 0.4 }}
              className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-red-50 text-[#e02424] flex items-center justify-center text-2xl shrink-0">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M19 2H5C3.89543 2 3 2.89543 3 4V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V4C21 2.89543 20.1046 2 19 2ZM7 6H9V8H7V6ZM7 10H9V12H7V10ZM7 14H9V16H7V14ZM17 18H7V20H17V18ZM17 16H15V14H17V16ZM17 12H15V10H17V12ZM17 8H15V6H17V8ZM13 6H11V8H13V6ZM13 10H11V12H13V10ZM13 14H11V16H13V14Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">500+</h3>
                <p className="text-xs font-semibold text-gray-500">Hotels & Resorts</p>
              </div>
            </motion.div>

            {/* Stat 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6, boxShadow: "0 20px 25px -5px rgba(224, 36, 36, 0.08)" }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-red-50 text-[#e02424] flex items-center justify-center text-2xl shrink-0">
                <MdOutlineBed size={26} />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">50,000+</h3>
                <p className="text-xs font-semibold text-gray-500">Rooms Managed</p>
              </div>
            </motion.div>

            {/* Stat 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6, boxShadow: "0 20px 25px -5px rgba(224, 36, 36, 0.08)" }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-red-50 text-[#e02424] flex items-center justify-center text-2xl shrink-0">
                <FiTrendingUp size={24} />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">99.9%</h3>
                <p className="text-xs font-semibold text-gray-500">Uptime Guarantee</p>
              </div>
            </motion.div>

            {/* Stat 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6, boxShadow: "0 20px 25px -5px rgba(224, 36, 36, 0.08)" }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-red-50 text-[#e02424] flex items-center justify-center text-2xl shrink-0">
                <FiClock size={24} />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">24/7</h3>
                <p className="text-xs font-semibold text-gray-500">Customer Support</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. WHY CHOOSE HOTELPRO SECTION (Split with Reception Image)              */}
      {/* ========================================================================= */}
      <section id="solutions" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Left Image with Floating Check-in Badge */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full lg:w-1/2 relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
                  alt="Hotel Reception Guest Check-in"
                  className="w-full h-[400px] sm:h-[460px] object-cover hover:scale-102 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                {/* Overlaid Floating Badge with continuous floating animation */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-xs bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/80 shadow-2xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-[#e02424] flex items-center justify-center font-bold shrink-0">
                      <FiCheck size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-gray-900">Smooth Check-ins</p>
                      <p className="text-[11px] text-gray-500">Create memorable guest experiences</p>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[#e02424] text-white flex items-center justify-center text-[10px] shrink-0">
                    <FiCheck size={12} />
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Copy & Features */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full lg:w-1/2 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-[#e02424] border border-red-200">
                ✨ WHY CHOOSE HOTELPRO
              </div>

              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-950 leading-tight">
                A Complete Solution <br />
                for <span className="text-[#e02424]">Modern Hospitality</span>
              </h2>

              <p className="text-base text-gray-600 leading-relaxed">
                From single properties to multi-branch hotel chains, HotelPro gives you all the tools you need to simplify operations and delight your guests.
              </p>

              {/* 2x2 Feature Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                {/* Feature 1 */}
                <motion.div whileHover={{ y: -3 }} className="flex items-start gap-3.5 transition-transform">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-[#e02424] flex items-center justify-center shrink-0">
                    <FiLayers size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-950">All-in-One Platform</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Rooms, reservations, POS, housekeeping, billing and more.
                    </p>
                  </div>
                </motion.div>

                {/* Feature 2 */}
                <motion.div whileHover={{ y: -3 }} className="flex items-start gap-3.5 transition-transform">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-[#e02424] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M19 2H5C3.89543 2 3 2.89543 3 4V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V4C21 2.89543 20.1046 2 19 2ZM7 6H9V8H7V6ZM7 10H9V12H7V10ZM7 14H9V16H7V14ZM17 18H7V20H17V18ZM17 16H15V14H17V16ZM17 12H15V10H17V12ZM17 8H15V6H17V8ZM13 6H11V8H13V6ZM13 10H11V12H13V10ZM13 14H11V16H13V14Z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-950">Multi-Property Support</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Manage multiple branches from a single dashboard.
                    </p>
                  </div>
                </motion.div>

                {/* Feature 3 */}
                <motion.div whileHover={{ y: -3 }} className="flex items-start gap-3.5 transition-transform">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-[#e02424] flex items-center justify-center shrink-0">
                    <FiShield size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-950">Secure & Reliable</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Your data, always protected with enterprise-grade security.
                    </p>
                  </div>
                </motion.div>

                {/* Feature 4 */}
                <motion.div whileHover={{ y: -3 }} className="flex items-start gap-3.5 transition-transform">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-[#e02424] flex items-center justify-center shrink-0">
                    <MdOutlineBed size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-950">Built for All Hotels</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Ideal for hotels, resorts, serviced apartments and restaurant chains.
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. "EVERYTHING YOU NEED IN ONE PLATFORM" (8 MODULES GRID)                 */}
      {/* ========================================================================= */}
      <section id="features" className="py-20 bg-gray-50/60 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-[#e02424] border border-red-200 mb-3">
            ⚡ POWERFUL FEATURES
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-950 max-w-2xl mx-auto">
            Everything You Need in One Platform
          </h2>

          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto mt-2 mb-12">
            Powerful modules designed to streamline your operations and deliver exceptional guest experiences.
          </p>

          {/* 8 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              { title: "Front Desk & Reservations", desc: "Manage online & walk-in bookings with real-time availability.", icon: <FiCalendar size={22} /> },
              { title: "Room & Housekeeping", desc: "Room allocation, cleaning status and maintenance tracking.", icon: <MdOutlineCleaningServices size={24} /> },
              { title: "POS & Restaurant", desc: "KOT, menu management, table orders and billing.", icon: <MdOutlineTableRestaurant size={24} /> },
              { title: "Billing & Payments", desc: "Generate invoices, multi-payment methods and GST support.", icon: <FiDollarSign size={22} /> },
              { title: "Guest Management", desc: "Track guest history, preferences and feedback.", icon: <FiUsers size={22} /> },
              { title: "Reports & Analytics", desc: "Real-time insights on revenue, occupancy and performance.", icon: <FiTrendingUp size={22} /> },
              { title: "Staff Management", desc: "Role-based access, attendance and shift management.", icon: <FiShield size={22} /> },
              {
                title: "Multi-Branch Management",
                desc: "Handle multiple properties from a single platform.",
                icon: (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 2H5C3.89543 2 3 2.89543 3 4V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V4C21 2.89543 20.1046 2 19 2ZM7 6H9V8H7V6ZM7 10H9V12H7V10ZM7 14H9V16H7V14ZM17 18H7V20H17V18ZM17 16H15V14H17V16ZM17 12H15V10H17V12ZM17 8H15V6H17V8ZM13 6H11V8H13V6ZM13 10H11V12H13V10ZM13 14H11V16H13V14Z" />
                  </svg>
                ),
              },
            ].map((module, idx) => (
              <motion.div
                key={module.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                whileHover={{ y: -8, boxShadow: "0 25px 30px -5px rgba(0,0,0,0.08)" }}
                className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs transition duration-200 group flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 text-[#e02424] flex items-center justify-center text-xl group-hover:bg-[#e02424] group-hover:text-white transition duration-200">
                      {module.icon}
                    </div>
                    <span className="text-gray-300 group-hover:text-[#e02424] group-hover:translate-x-1 transition-all duration-200 text-sm">
                      ›
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-gray-950 mb-1.5">{module.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{module.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. "CREATE BETTER GUEST EXPERIENCES" SECTION                              */}
      {/* ========================================================================= */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Left Copy */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full lg:w-1/2 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-[#e02424] border border-red-200">
                ❤️ DELIGHT YOUR GUESTS
              </div>

              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-950 leading-tight">
                Create Better <br />
                <span className="text-[#e02424]">Guest Experiences</span>
              </h2>

              <p className="text-base text-gray-600 leading-relaxed">
                Deliver seamless stays with faster check-ins, personalized service and efficient operations that keep your guests coming back.
              </p>

              {/* Bullet Checklist */}
              <div className="space-y-3.5 pt-2">
                {[
                  "Faster check-in & check-out",
                  "Personalized guest profiles",
                  "Quick room service & dining orders",
                  "Seamless communication",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#e02424] text-white flex items-center justify-center text-xs shrink-0">
                      <FiCheck size={12} />
                    </div>
                    <span className="text-sm font-bold text-gray-800">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right Suite Room Photo with Floating Testimonial Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full lg:w-1/2 relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"
                  alt="Luxury Hotel Room Suite"
                  className="w-full h-[400px] sm:h-[460px] object-cover hover:scale-102 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                {/* Overlaid Testimonial Card with Continuous Float */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-md bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/80 shadow-2xl"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} size={14} className="fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[#e02424] text-xs font-bold">›</span>
                  </div>

                  <p className="text-xs font-bold text-gray-800 italic leading-relaxed mb-3">
                    &ldquo;Exceptional service and a beautiful stay. Highly recommended!&rdquo;
                  </p>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-gray-300">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                        alt="Rahul Verma"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-gray-900 leading-none">Rahul Verma</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Business Traveler</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. "POWERFUL RESTAURANT MANAGEMENT" SECTION                               */}
      {/* ========================================================================= */}
      <section className="py-20 bg-gray-50/60 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Left Restaurant Dining Hall with Live Kitchen Orders Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full lg:w-1/2 relative order-2 lg:order-1"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
                  alt="Hotel Fine Dining Restaurant"
                  className="w-full h-[400px] sm:h-[460px] object-cover hover:scale-102 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                {/* Overlaid Floating Card: Live Kitchen Orders */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-sm bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/80 shadow-2xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-[#e02424] flex items-center justify-center shrink-0">
                      <MdOutlineSoupKitchen size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-gray-900">Live Kitchen Orders</p>
                      <p className="text-[11px] text-gray-500">Orders synced directly from POS to kitchen display.</p>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-red-100 text-[#e02424] flex items-center justify-center text-xs shrink-0 font-bold">
                    ›
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Copy */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full lg:w-1/2 space-y-6 order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-[#e02424] border border-red-200">
                🍽️ RESTAURANT & POS
              </div>

              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-950 leading-tight">
                Powerful <span className="text-[#e02424]">Restaurant</span> <br />
                Management
              </h2>

              <p className="text-base text-gray-600 leading-relaxed">
                Manage your in-house restaurant with a modern POS system. From table orders to kitchen display, everything works together seamlessly.
              </p>

              {/* Checkpoints */}
              <div className="space-y-3.5 pt-2">
                {[
                  "Table management & reservations",
                  "Digital menu & KOT integration",
                  "Real-time kitchen order display",
                  "Multiple payment options",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#e02424] text-white flex items-center justify-center text-xs shrink-0">
                      <FiCheck size={12} />
                    </div>
                    <span className="text-sm font-bold text-gray-800">{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
                  <a
                    href="#pricing"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-[#e02424] bg-white border border-red-200 hover:bg-red-50 transition shadow-2xs"
                  >
                    <span>Explore Restaurant Features</span>
                    <FiPlus size={16} />
                  </a>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. PRICING SECTION ("Choose the Plan That Fits Your Hotel")                */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-[#e02424] border border-red-200 mb-3">
            💳 SIMPLE PRICING
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-950 max-w-2xl mx-auto">
            Choose the Plan That Fits Your Hotel
          </h2>

          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto mt-2 mb-12">
            Transparent pricing with no hidden charges. Scale as you grow.
          </p>

          {/* 3 Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto text-left">
            {/* Starter Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.08)" }}
              transition={{ duration: 0.5 }}
              className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between transition"
            >
              <div>
                <h3 className="text-xl font-black text-gray-950">Starter</h3>
                <p className="text-xs text-gray-500 mt-1">Perfect for small hotels</p>

                <div className="mt-6 mb-6">
                  <span className="text-4xl font-black text-gray-950">₹2,999</span>
                  <span className="text-gray-500 text-sm font-semibold ml-1">/month</span>
                </div>

                <div className="space-y-3.5 border-t border-gray-100 pt-6">
                  {[
                    "Up to 50 rooms",
                    "Core modules",
                    "Basic reporting",
                    "Email support",
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-2.5 text-xs font-semibold text-gray-700">
                      <FiCheck className="text-emerald-500 shrink-0" size={16} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/user/login"
                    className="w-full block py-3 text-center text-sm font-bold text-gray-800 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition shadow-2xs"
                  >
                    Get Started
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* Professional Plan (Highlighted) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -10, boxShadow: "0 25px 35px -5px rgba(224, 36, 36, 0.2)" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white p-8 rounded-3xl border-2 border-[#e02424] shadow-2xl relative flex flex-col justify-between md:-translate-y-2"
            >
              {/* Most Popular Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#e02424] text-white shadow-md">
                Most Popular
              </div>

              <div>
                <h3 className="text-xl font-black text-gray-950">Professional</h3>
                <p className="text-xs text-gray-500 mt-1">For growing hotels & resorts</p>

                <div className="mt-6 mb-6">
                  <span className="text-4xl font-black text-gray-950">₹5,999</span>
                  <span className="text-gray-500 text-sm font-semibold ml-1">/month</span>
                </div>

                <div className="space-y-3.5 border-t border-gray-100 pt-6">
                  {[
                    "Up to 200 rooms",
                    "All modules included",
                    "Advanced analytics",
                    "Multi-branch support",
                    "Priority support",
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-2.5 text-xs font-semibold text-gray-700">
                      <FiCheck className="text-[#e02424] shrink-0" size={16} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/user/login"
                    className="w-full block py-3.5 text-center text-sm font-bold text-white bg-[#e02424] hover:bg-[#c81e1e] rounded-xl transition shadow-lg shadow-red-500/30"
                  >
                    Get Started
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.08)" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between transition"
            >
              <div>
                <h3 className="text-xl font-black text-gray-950">Enterprise</h3>
                <p className="text-xs text-gray-500 mt-1">For large chains & custom needs</p>

                <div className="mt-6 mb-6">
                  <span className="text-3xl font-black text-gray-950">Custom Pricing</span>
                </div>

                <div className="space-y-3.5 border-t border-gray-100 pt-6">
                  {[
                    "Unlimited rooms",
                    "Custom integrations",
                    "Dedicated account manager",
                    "24/7 support",
                    "SLA & on-premise options",
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-2.5 text-xs font-semibold text-gray-700">
                      <FiCheck className="text-emerald-500 shrink-0" size={16} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/user/login"
                    className="w-full block py-3 text-center text-sm font-bold text-gray-800 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition shadow-2xs"
                  >
                    Contact Sales
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. PRE-FOOTER CALL TO ACTION BANNER                                      */}
      {/* ========================================================================= */}
      <section className="relative py-24 bg-gray-900 overflow-hidden">
        {/* Background Resort Pool Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white space-y-6"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Join Hundreds of Hotels Already Growing with HotelPro
          </h2>

          <p className="text-base sm:text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed">
            Streamline your operations, increase revenue and deliver unforgettable guest experiences.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/user/login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white bg-[#e02424] hover:bg-[#c81e1e] transition shadow-2xl shadow-red-600/40"
              >
                <span>Start Free Demo</span>
                <FiArrowRight size={18} />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/user/login"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold text-white bg-white/10 hover:bg-white hover:text-gray-900 border border-white/40 backdrop-blur-md transition"
              >
                Contact Sales
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FOOTER                                                                */}
      {/* ========================================================================= */}
      <footer className="bg-white border-t border-gray-200 pt-16 pb-12 text-sm text-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Col 1: Brand & Social */}
            <div className="col-span-2 space-y-4">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#e02424] flex items-center justify-center text-white">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 2H5C3.89543 2 3 2.89543 3 4V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V4C21 2.89543 20.1046 2 19 2ZM7 6H9V8H7V6ZM7 10H9V12H7V10ZM7 14H9V16H7V14ZM17 18H7V20H17V18ZM17 16H15V14H17V16ZM17 12H15V10H17V12ZM17 8H15V6H17V8ZM13 6H11V8H13V6ZM13 10H11V12H13V10ZM13 14H11V16H13V14Z" />
                  </svg>
                </div>
                <span className="text-xl font-black text-gray-950">
                  Hotel<span className="text-[#e02424]">Pro</span>
                </span>
              </Link>
              <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                A complete hotel management solution for modern hospitality businesses.
              </p>

              {/* Social Icons */}
              <div className="flex items-center gap-3 pt-2">
                <motion.a
                  whileHover={{ y: -2 }}
                  href="#"
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition"
                  aria-label="X (Twitter)"
                >
                  <FaXTwitter size={14} />
                </motion.a>
                <motion.a
                  whileHover={{ y: -2 }}
                  href="#"
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition"
                  aria-label="LinkedIn"
                >
                  <FaLinkedinIn size={14} />
                </motion.a>
                <motion.a
                  whileHover={{ y: -2 }}
                  href="#"
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition"
                  aria-label="YouTube"
                >
                  <FaYoutube size={14} />
                </motion.a>
              </div>
            </div>

            {/* Col 2: Product */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2.5 text-xs font-semibold text-gray-600">
                <li><a href="#features" className="hover:text-[#e02424] transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-[#e02424] transition">Pricing</a></li>
                <li><a href="#" className="hover:text-[#e02424] transition">Integrations</a></li>
                <li><a href="#" className="hover:text-[#e02424] transition">What&apos;s New</a></li>
              </ul>
            </div>

            {/* Col 3: Solutions */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-4">Solutions</h4>
              <ul className="space-y-2.5 text-xs font-semibold text-gray-600">
                <li><a href="#" className="hover:text-[#e02424] transition">Hotels</a></li>
                <li><a href="#" className="hover:text-[#e02424] transition">Resorts</a></li>
                <li><a href="#" className="hover:text-[#e02424] transition">Restaurant Chains</a></li>
                <li><a href="#" className="hover:text-[#e02424] transition">Multi-Branch</a></li>
              </ul>
            </div>

            {/* Col 4: Resources */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2.5 text-xs font-semibold text-gray-600">
                <li><a href="#" className="hover:text-[#e02424] transition">Blog</a></li>
                <li><a href="#" className="hover:text-[#e02424] transition">Help Center</a></li>
                <li><a href="#" className="hover:text-[#e02424] transition">Documentation</a></li>
                <li><a href="#" className="hover:text-[#e02424] transition">Community</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Legal */}
          <div className="border-t border-gray-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>© 2026 HotelPro. All rights reserved.</p>

            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-gray-900 transition">Privacy Policy</a>
              <a href="#" className="hover:text-gray-900 transition">Terms of Service</a>
              <a href="#" className="hover:text-gray-900 transition">Cookies</a>

              <div className="flex items-center gap-1.5 text-gray-700 font-semibold cursor-pointer">
                <FiGlobe size={14} />
                <span>English</span>
                <FiChevronDown size={12} />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}