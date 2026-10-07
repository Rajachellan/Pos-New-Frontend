"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FiChevronLeft, FiChevronRight, FiArrowRight } from "react-icons/fi";

const slides = [
  {
    image: "/images/hotel-1.jpg",
    badge: "01 • HOTEL MANAGEMENT",
    title: "Complete Hotel Management",
    tagline: "Front Desk & Operations",
    description:
      "Manage hotel operations, rooms, bookings, staff and guest experiences from one unified, lightning-fast platform.",
    cta: "Explore Operations",
    href: "#features",
  },
  {
    image: "/images/hotel-2.jpg",
    badge: "02 • RESTAURANT POS",
    title: "Smart Restaurant POS",
    tagline: "Dining & Bar Billing",
    description:
      "Take orders faster with visual table maps, split bills effortlessly, and keep your dining room synchronized with the kitchen.",
    cta: "Explore Restaurant POS",
    href: "#features",
  },
  {
    image: "/images/hotel-3.jpg",
    badge: "03 • KITCHEN DISPLAY SYSTEM",
    title: "Powerful Kitchen Management",
    tagline: "Live Food Prep Workflow",
    description:
      "Send live orders instantly to digital kitchen display screens (KDS) and keep your culinary preparation perfectly organized.",
    cta: "Explore Kitchen KDS",
    href: "#features",
  },
  {
    image: "/images/hotel-4.jpg",
    badge: "04 • RESERVATIONS & ROOMS",
    title: "Room & Booking Management",
    tagline: "Occupancy & Housekeeping",
    description:
      "Manage real-time room availability, online check-ins, guest folios, and housekeeping schedules with zero double bookings.",
    cta: "Explore Room Bookings",
    href: "#features",
  },
  {
    image: "/images/hotel-5.jpg",
    badge: "05 • BUSINESS INTELLIGENCE",
    title: "Real-Time Business Analytics",
    tagline: "Revenue & Growth Insights",
    description:
      "Gain deep visibility into daily revenue, RevPAR, table occupancy, staff performance, and growth forecasts in one click.",
    cta: "Explore Analytics",
    href: "#features",
  },
];

export default function HotelSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slideDuration = 5000; // 5 seconds per slide

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-advance timer (pauses on hover)
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, slideDuration);

    return () => clearInterval(timer);
  }, [isPaused, nextSlide, currentSlide]);

  const activeSlide = slides[currentSlide];

  return (
    <section className="w-full bg-white py-6 sm:py-12">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* MAIN SLIDER STAGE                                                         */}
        {/* ========================================================================= */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="group relative overflow-hidden rounded-2xl sm:rounded-[36px] bg-gray-950 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] min-h-[480px] sm:min-h-[560px] lg:min-h-[640px] flex items-center"
        >
          {/* BACKGROUND IMAGE WITH CINEMATIC CROSS-FADE & KEN BURNS ZOOM */}
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full overflow-hidden"
            >
              {/* Gentle Ken Burns scale animation */}
              <motion.img
                src={activeSlide.image}
                alt={activeSlide.title}
                initial={{ scale: 1.08 }}
                animate={{ scale: 1.0 }}
                transition={{ duration: 5.5, ease: "easeOut" }}
                className="absolute inset-0 h-full w-full object-cover object-center filter brightness-95"
              />

              {/* Rich cinematic vignette gradient: Dark on left for text legibility, transparent on right for photography beauty */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* SLIDE CONTENT (ANIMATED STAGGERED ENTRANCE) */}
          <div className="relative z-10 w-full px-5 py-8 sm:px-12 lg:px-20 xl:px-24">
            <div className="max-w-2xl text-white">
              {/* Badge & Number */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`badge-${currentSlide}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="mb-3 sm:mb-5 flex items-center gap-2.5 sm:gap-3"
                >
                  <span className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-[11px] sm:text-xs font-bold backdrop-blur-md text-white shadow-xs">
                    {String(currentSlide + 1).padStart(2, "0")}
                  </span>
                  <div className="h-px w-8 sm:w-10 bg-white/40" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-red-300">
                    {activeSlide.badge}
                  </span>
                </motion.div>
              </AnimatePresence>

              {/* Slide Title */}
              <AnimatePresence mode="wait">
                <motion.h2
                  key={`title-${currentSlide}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.5, delay: 0.05 }}
                  className="text-2xl sm:text-4xl lg:text-[52px] font-black leading-[1.15] tracking-tight text-white drop-shadow-sm"
                >
                  {activeSlide.title}
                </motion.h2>
              </AnimatePresence>

              {/* Tagline / Subtitle */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={`tagline-${currentSlide}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="mt-2 sm:mt-3 text-xs sm:text-base font-bold text-amber-200/90 tracking-wide uppercase"
                >
                  {activeSlide.tagline}
                </motion.p>
              </AnimatePresence>

              {/* Slide Description */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={`desc-${currentSlide}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="mt-3 sm:mt-4 max-w-xl text-xs sm:text-base lg:text-lg leading-relaxed text-gray-200 font-normal drop-shadow"
                >
                  {activeSlide.description}
                </motion.p>
              </AnimatePresence>

              {/* Action CTA Button */}
              <motion.div
                key={`btn-${currentSlide}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4"
              >
                <Link
                  href="/user/login"
                  className="inline-flex items-center gap-2 sm:gap-3 rounded-full bg-[#e02424] hover:bg-[#c81e1e] px-5 sm:px-7 py-2.5 sm:py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-red-600/30 transition-all duration-300 hover:scale-105"
                >
                  <span>{activeSlide.cta}</span>
                  <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-white/20">
                    <FiArrowRight size={13} />
                  </span>
                </Link>

                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-full text-xs sm:text-sm font-bold text-white/90 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition duration-300"
                >
                  View Pricing
                </a>
              </motion.div>
            </div>
          </div>

          {/* LEFT & RIGHT NAVIGATION ARROW BUTTONS */}
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-2 sm:left-6 top-1/2 z-20 flex h-10 w-10 sm:h-14 sm:w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white hover:text-gray-950 cursor-pointer"
          >
            <FiChevronLeft size={20} />
          </button>

          <button
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-2 sm:right-6 top-1/2 z-20 flex h-10 w-10 sm:h-14 sm:w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white hover:text-gray-950 cursor-pointer"
          >
            <FiChevronRight size={20} />
          </button>

          {/* PAGINATION DOTS */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 sm:gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-2 sm:px-4 sm:py-2.5 backdrop-blur-md">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-400 cursor-pointer ${
                  currentSlide === index
                    ? "w-6 sm:w-8 bg-[#e02424]"
                    : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>

          {/* PROGRESS BAR ACROSS BOTTOM */}
          <div className="absolute bottom-0 left-0 z-20 h-1 w-full bg-white/15">
            <motion.div
              key={`${currentSlide}-${isPaused}`}
              initial={{ width: "0%" }}
              animate={{ width: isPaused ? undefined : "100%" }}
              transition={{
                duration: slideDuration / 1000,
                ease: "linear",
              }}
              className="h-full bg-[#e02424]"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE FEATURE CARD TABS (Scrollable on mobile, grid on desktop)     */}
        {/* ========================================================================= */}
        <div className="mt-4 sm:mt-6 flex gap-2.5 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible scrollbar-none">
          {slides.map((slide, index) => {
            const isActive = currentSlide === index;
            return (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`group relative shrink-0 w-[200px] sm:w-auto rounded-xl sm:rounded-2xl border p-3 sm:p-4 text-left transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "border-[#e02424]/40 bg-red-50/60 shadow-md ring-1 ring-[#e02424]/30 -translate-y-0.5"
                    : "border-gray-200/80 bg-white hover:-translate-y-1 hover:border-gray-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-black tracking-wider ${
                      isActive ? "text-[#e02424]" : "text-gray-400"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span
                    className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? "bg-[#e02424] scale-110 shadow-xs shadow-red-500/50"
                        : "bg-gray-200 group-hover:bg-gray-400"
                    }`}
                  />
                </div>

                <p
                  className={`mt-2 sm:mt-2.5 line-clamp-1 sm:line-clamp-2 text-xs sm:text-sm font-bold leading-snug ${
                    isActive ? "text-gray-950 font-black" : "text-gray-700"
                  }`}
                >
                  {slide.title}
                </p>

                {/* Subtitle tag */}
                <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] font-semibold text-gray-500 truncate">
                  {slide.tagline}
                </p>

                {/* Active bottom accent bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabAccent"
                    className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#e02424] rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}