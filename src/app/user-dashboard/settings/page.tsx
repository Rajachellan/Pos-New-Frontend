"use client";

import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { motion } from "framer-motion";
import {
  FiSettings,
  FiSave,
  FiCheckCircle,
  FiPercent,
  FiPrinter,
  FiShield,
  FiClock,
  FiDollarSign,
  FiLayers,
} from "react-icons/fi";
import { BiRestaurant } from "react-icons/bi";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Settings State
  const [restaurantName, setRestaurantName] = useState("TANJAVOOR RESTAURANT");
  const [tagline, setTagline] = useState("Authentic Chettinad & South Indian Cuisine");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [address, setAddress] = useState("12/4 Gandhi Road, Tanjavoor, Tamil Nadu - 613001");
  const [fssaiLicense, setFssaiLicense] = useState("12423004000123");
  const [gstin, setGstin] = useState("33AAAAA0000A1Z5");
  
  // Tax & Charges
  const [enableGst, setEnableGst] = useState(true);
  const [gstRate, setGstRate] = useState<number>(5.0);
  const [enableServiceCharge, setEnableServiceCharge] = useState(false);
  const [serviceChargeRate, setServiceChargeRate] = useState<number>(5.0);
  const [currencySymbol, setCurrencySymbol] = useState("₹");

  // Operational Settings
  const [autoPrintKOT, setAutoPrintKOT] = useState(true);
  const [autoPrintBill, setAutoPrintBill] = useState(false);
  const [tableLockTimeout, setTableLockTimeout] = useState<number>(45);

  useEffect(() => {
    // Load existing settings if available in localStorage
    const savedConfig = localStorage.getItem("pos_terminal_settings");
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.restaurantName) setRestaurantName(parsed.restaurantName);
        if (parsed.tagline) setTagline(parsed.tagline);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.gstin) setGstin(parsed.gstin);
        if (parsed.fssaiLicense) setFssaiLicense(parsed.fssaiLicense);
        if (typeof parsed.enableGst === "boolean") setEnableGst(parsed.enableGst);
        if (parsed.gstRate) setGstRate(parsed.gstRate);
        if (typeof parsed.enableServiceCharge === "boolean") setEnableServiceCharge(parsed.enableServiceCharge);
        if (parsed.serviceChargeRate) setServiceChargeRate(parsed.serviceChargeRate);
        if (typeof parsed.autoPrintKOT === "boolean") setAutoPrintKOT(parsed.autoPrintKOT);
        if (typeof parsed.autoPrintBill === "boolean") setAutoPrintBill(parsed.autoPrintBill);
      } catch (err) {
        console.error("Error reading saved config:", err);
      }
    }
  }, []);

  const handleSave = () => {
    setLoading(true);
    const config = {
      restaurantName,
      tagline,
      phone,
      address,
      fssaiLicense,
      gstin,
      enableGst,
      gstRate,
      enableServiceCharge,
      serviceChargeRate,
      currencySymbol,
      autoPrintKOT,
      autoPrintBill,
      tableLockTimeout,
    };

    localStorage.setItem("pos_terminal_settings", JSON.stringify(config));

    setTimeout(() => {
      setLoading(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 400);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiSettings className="text-[#e02424]" /> POS & Branch Settings
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure restaurant identity, GST tax calculations, receipt templates, and operational preferences.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#e02424] text-white rounded-xl text-sm font-semibold hover:bg-[#c81e1e] transition shadow-xs w-fit"
        >
          {loading ? (
            <span>Saving...</span>
          ) : savedSuccess ? (
            <>
              <FiCheckCircle className="text-lg" /> Saved Successfully!
            </>
          ) : (
            <>
              <FiSave className="text-lg" /> Save Changes
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Business & Branch Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <BiRestaurant className="text-[#e02424] text-xl" /> Restaurant & Branch Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Outlet / Brand Name
                </label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Tagline / Header Line
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  FSSAI License No.
                </label>
                <input
                  type="text"
                  value={fssaiLicense}
                  onChange={(e) => setFssaiLicense(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Store Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424]"
                />
              </div>
            </div>
          </div>

          {/* Tax & GST Setup */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <FiPercent className="text-[#e02424] text-lg" /> GST & Tax Settings
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Apply GST (Goods & Services Tax)</h4>
                  <p className="text-xs text-gray-500">Enable 2.5% CGST + 2.5% SGST automatically on dining & room bills.</p>
                </div>
                <input
                  type="checkbox"
                  checked={enableGst}
                  onChange={(e) => setEnableGst(e.target.checked)}
                  className="w-5 h-5 accent-[#e02424] cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    GST Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={gstRate}
                    disabled={!enableGst}
                    onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    GSTIN Number
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Optional Service Charge</h4>
                  <p className="text-xs text-gray-500">Apply restaurant service fee to dining orders.</p>
                </div>
                <input
                  type="checkbox"
                  checked={enableServiceCharge}
                  onChange={(e) => setEnableServiceCharge(e.target.checked)}
                  className="w-5 h-5 accent-[#e02424] cursor-pointer"
                />
              </div>

              {enableServiceCharge && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Service Charge Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={serviceChargeRate}
                    onChange={(e) => setServiceChargeRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Print & Operational Preferences */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <FiPrinter className="text-[#e02424] text-lg" /> Receipt & KOT Printing
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-800">Auto-Print Kitchen Order (KOT)</h4>
                  <p className="text-xs text-gray-500">Print slip automatically when order is sent to KDS</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoPrintKOT}
                  onChange={(e) => setAutoPrintKOT(e.target.checked)}
                  className="w-4 h-4 accent-[#e02424] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-800">Auto-Print Customer Receipt</h4>
                  <p className="text-xs text-gray-500">Open print dialog immediately after payment</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoPrintBill}
                  onChange={(e) => setAutoPrintBill(e.target.checked)}
                  className="w-4 h-4 accent-[#e02424] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold text-center"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <FiShield className="text-[#e02424] text-lg" /> POS Security & Workflow
            </h2>

            <div className="space-y-3">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                <p className="text-xs font-medium text-blue-900">
                  <strong>Strict POS Lifecycle Enforced:</strong>
                </p>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  Tables automatically synchronize status from <code>AVAILABLE</code> to <code>OCCUPIED</code> on cart order, transition to <code>KITCHEN/KDS</code>, and release back to <code>AVAILABLE</code> upon full payment settlement.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <p className="text-xs font-medium text-emerald-900">
                  <strong>Multi-Tenant Data Isolation:</strong>
                </p>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                  Branch and organization tokens are scoped in all backend API requests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
