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
  FiUploadCloud,
  FiTrash2,
  FiImage,
  FiAlertCircle,
} from "react-icons/fi";
import { BiRestaurant } from "react-icons/bi";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Settings State
  const [restaurantName, setRestaurantName] = useState("TANJAVOOR RESTAURANT");
  const [tagline, setTagline] = useState("Authentic Chettinad & South Indian Cuisine");
  const [logoUrl, setLogoUrl] = useState("");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [address, setAddress] = useState("12/4 Gandhi Road, Tanjavoor, Tamil Nadu - 613001");
  const [fssaiLicense, setFssaiLicense] = useState("12423004000123");
  const [gstin, setGstin] = useState("33AAAAA0000A1Z5");

  // Logo upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState("");

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
    // 1. Load existing local settings if available
    const savedConfig = localStorage.getItem("pos_terminal_settings");
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.restaurantName) setRestaurantName(parsed.restaurantName);
        if (parsed.tagline) setTagline(parsed.tagline);
        if (parsed.logoUrl) setLogoUrl(parsed.logoUrl);
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

    // 2. Fetch organization profile to sync backend logo & hotel details
    const fetchOrgProfile = async () => {
      try {
        const res = await api.get("/organizations/profile");
        if (res.data?.success && res.data.data?.organization) {
          const org = res.data.data.organization;
          if (org.logoUrl) setLogoUrl(org.logoUrl);
          if (org.name && !savedConfig) setRestaurantName(org.name);
          if (org.phno && !savedConfig) setPhone(org.phno);
          if (org.address && !savedConfig) setAddress(org.address);
          if (org.gstNumber && !savedConfig) setGstin(org.gstNumber);
        }
      } catch (err) {
        // Non-blocking if endpoint is permission-gated or offline
        console.log("Organization profile fetch:", err);
      }
    };

    fetchOrgProfile();
  }, []);

  // Handle Logo Upload to Cloudflare R2
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setLogoError("Please select a valid image file (PNG, JPG, WEBP, SVG)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setLogoError("Image size must be less than 10MB");
      return;
    }

    setUploadingLogo(true);
    setLogoError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "logos");

      const res = await api.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success && res.data.url) {
        const uploadedUrl = res.data.url;
        setLogoUrl(uploadedUrl);

        // Update local storage immediately
        const savedConfig = localStorage.getItem("pos_terminal_settings");
        const parsed = savedConfig ? JSON.parse(savedConfig) : {};
        localStorage.setItem(
          "pos_terminal_settings",
          JSON.stringify({ ...parsed, logoUrl: uploadedUrl })
        );

        // Persist to Organization profile
        try {
          await api.put("/organizations/settings", { logoUrl: uploadedUrl });
        } catch (syncErr) {
          console.warn("Could not sync logo to organization:", syncErr);
        }
      } else {
        setLogoError(res.data?.message || "Failed to upload image");
      }
    } catch (err: any) {
      console.error("Logo upload error:", err);
      setLogoError(
        err.response?.data?.message ||
          err.message ||
          "Failed to upload logo to Cloudflare R2"
      );
    } finally {
      setUploadingLogo(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    setLogoUrl("");
    const savedConfig = localStorage.getItem("pos_terminal_settings");
    const parsed = savedConfig ? JSON.parse(savedConfig) : {};
    localStorage.setItem(
      "pos_terminal_settings",
      JSON.stringify({ ...parsed, logoUrl: "" })
    );

    try {
      await api.put("/organizations/settings", { logoUrl: "" });
    } catch (err) {
      console.warn("Error removing org logo:", err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const config = {
      restaurantName,
      tagline,
      logoUrl,
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

    // Also persist organization updates to backend
    try {
      await api.put("/organizations/settings", {
        name: restaurantName,
        phno: phone,
        address,
        gstNumber: gstin,
        logoUrl,
        settings: {
          currency: currencySymbol,
          taxPercentage: gstRate,
        },
      });
    } catch (err) {
      console.log("Organization sync notice:", err);
    }

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
            Configure restaurant identity, Cloudflare R2 logo, GST tax calculations, receipt templates, and operational preferences.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#e02424] text-white rounded-xl text-sm font-semibold hover:bg-[#c81e1e] transition shadow-xs w-fit cursor-pointer disabled:opacity-50"
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
        {/* Left Column: Business & Branch Details & Logo */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Hotel / Restaurant Logo Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FiImage className="text-[#e02424] text-xl" /> Hotel & Restaurant Logo
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center gap-1">
                <FiUploadCloud size={13} /> Cloudflare R2 Storage
              </span>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Upload your official restaurant/hotel logo. It will automatically be printed on all customer POS receipts, KOT bills, and transaction invoices.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-gray-50/80 rounded-2xl border border-gray-200">
              {/* Preview Box */}
              <div className="relative w-32 h-32 rounded-2xl bg-white border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Hotel Logo Preview"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="text-center p-2 text-gray-400">
                    <BiRestaurant size={36} className="mx-auto text-gray-300 mb-1" />
                    <span className="text-[10px] font-bold block">No Logo</span>
                  </div>
                )}

                {uploadingLogo && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-1 text-[#e02424]">
                    <div className="w-5 h-5 border-2 border-[#e02424] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-bold">Uploading...</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 w-full space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-[#e02424] hover:bg-[#c81e1e] text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs">
                    <FiUploadCloud size={16} />
                    <span>{logoUrl ? "Replace Logo" : "Upload Logo to R2"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      <FiTrash2 size={14} /> Remove
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Or Enter Public Logo URL directly:
                  </label>
                  <input
                    type="url"
                    placeholder="https://pub-xxxxxx.r2.dev/logos/logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424]"
                  />
                </div>

                {logoError && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-semibold">
                    <FiAlertCircle size={14} /> {logoError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 2. Restaurant & Branch Information */}
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

          {/* 3. Tax & GST Setup */}
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

        {/* Right Column: Live Receipt Preview & Operational Preferences */}
        <div className="space-y-6">
          
          {/* Live Receipt Preview with Hotel Logo */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
              <FiPrinter className="text-[#e02424] text-lg" /> Live Receipt Preview
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Real-time preview of how your logo and restaurant header print on thermal paper:
            </p>

            {/* Thermal Slip Mockup */}
            <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200/70 font-mono text-xs text-slate-800 space-y-2 shadow-inner">
              <div className="text-center pb-2 border-b border-dashed border-slate-400/60">
                {logoUrl ? (
                  <div className="flex justify-center mb-1.5">
                    <img
                      src={logoUrl}
                      alt="Receipt Logo"
                      className="max-h-12 max-w-[120px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="inline-block p-1 bg-gray-200 rounded text-[10px] text-gray-600 mb-1">
                    [No Logo Uploaded]
                  </div>
                )}
                <p className="font-black text-sm uppercase tracking-wide">{restaurantName || "RESTAURANT NAME"}</p>
                <p className="text-[10px] text-slate-500">{tagline}</p>
                <p className="text-[10px] text-slate-500">{phone}</p>
                <p className="text-[9px] text-slate-400 truncate">{address}</p>
                {gstin && <p className="text-[9px] font-bold text-slate-600">GSTIN: {gstin}</p>}
                {fssaiLicense && <p className="text-[9px] text-slate-500">FSSAI: {fssaiLicense}</p>}
              </div>

              <div className="flex justify-between text-[10px] text-slate-500 py-1">
                <span>Date: {new Date().toLocaleDateString()}</span>
                <span>Table: T1</span>
              </div>

              <div className="border-t border-b border-dashed border-slate-400/60 py-1.5 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Sample Item x2</span>
                  <span className="font-bold">{currencySymbol}240.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Beverage x1</span>
                  <span className="font-bold">{currencySymbol}60.00</span>
                </div>
              </div>

              <div className="space-y-0.5 text-right text-[11px] pt-1">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{currencySymbol}300.00</span>
                </div>
                {enableGst && (
                  <div className="flex justify-between text-slate-500">
                    <span>GST ({gstRate}%):</span>
                    <span>{currencySymbol}{(300 * (gstRate / 100)).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xs text-[#e02424] pt-1 border-t border-slate-300">
                  <span>Total Amount:</span>
                  <span>{currencySymbol}{(300 + (enableGst ? 300 * (gstRate / 100) : 0)).toFixed(2)}</span>
                </div>
              </div>

              <p className="text-center text-[9px] text-slate-400 pt-2 border-t border-dashed border-slate-400/60">
                Thank You! Please Visit Again.
              </p>
            </div>
          </div>

          {/* Operational Settings */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <FiSettings className="text-[#e02424] text-lg" /> Printing Preferences
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
              <FiShield className="text-[#e02424] text-lg" /> POS & Storage Security
            </h2>

            <div className="space-y-3">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                <p className="text-xs font-medium text-amber-900">
                  <strong>Cloudflare R2 Object Storage:</strong>
                </p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Fast CDN delivery without egress fees. All uploaded hotel logos and menu photos are stored securely with zero bandwidth charges.
                </p>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                <p className="text-xs font-medium text-blue-900">
                  <strong>Multi-Tenant Data Isolation:</strong>
                </p>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  Organization branding and tokens are automatically scoped to your branch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
