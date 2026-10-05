"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/src/app/services/api";
import {
  RiBuilding4Line,
  RiAwardLine,
  RiUserFollowLine,
  RiMapPinLine,
  RiCheckDoubleLine,
  RiArrowRightLine,
  RiArrowLeftLine,
} from "react-icons/ri";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function OnboardOrganizationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Organization Info
    name: "",
    legalName: "",
    email: "",
    phno: "",
    address: "",
    gstNumber: "",

    // Step 2: License
    licenseType: "LIFETIME",
    licenseExpiresAt: "",

    // Step 3: Owner Info
    ownerName: "",
    ownerEmail: "",
    ownerUsername: "",
    ownerPassword: "",

    // Step 4: Initial Branch
    branchName: "",
    branchCode: "HQ01",
    branchAddress: "",
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Keep email and ownerEmail synchronized so the user never has to enter two different emails
      if (field === "email") {
        next.ownerEmail = value;
      } else if (field === "ownerEmail") {
        next.email = value;
      }
      return next;
    });
  };

  const nextStep = () => {
    setErrorMsg("");
    if (step === 1) {
      if (!formData.name.trim() || !formData.email.trim()) {
        setErrorMsg("Hotel Organization Name and Admin Login Email are required");
        return;
      }
    }
    if (step === 3) {
      if (!formData.ownerName.trim() || !formData.ownerPassword.trim()) {
        setErrorMsg("Owner Full Name and Initial Password are required");
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setErrorMsg("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.post("/super-admin/organizations", formData);
      if (res.data?.success) {
        setSuccessData(res.data.data);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to onboard organization");
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, title: "Organization", icon: RiBuilding4Line },
    { num: 2, title: "License", icon: RiAwardLine },
    { num: 3, title: "Owner Account", icon: RiUserFollowLine },
    { num: 4, title: "Initial Branch", icon: RiMapPinLine },
    { num: 5, title: "Confirmation", icon: RiCheckDoubleLine },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Customer Onboarding Wizard</h1>
        <p className="text-sm text-slate-400 mt-1">
          Complete the 5-step workflow to provision a hotel organization, license, owner account, and initial branch.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-5 gap-2 border-b border-slate-800 pb-6">
        {stepsList.map((s) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <div
              key={s.num}
              className={`flex flex-col items-center gap-2 text-center transition ${
                isActive
                  ? "text-amber-400 font-bold"
                  : isDone
                  ? "text-emerald-400 font-semibold"
                  : "text-slate-500"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border text-sm font-bold transition ${
                  isActive
                    ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-orange-950/40"
                    : isDone
                    ? "bg-emerald-950 text-emerald-400 border-emerald-700"
                    : "bg-slate-900 border-slate-800"
                }`}
              >
                <Icon size={18} />
              </div>
              <span className="text-[11px] uppercase tracking-wider">{s.title}</span>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Success Screen */}
      {successData ? (
        <div className="bg-slate-900 border border-emerald-800/60 rounded-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-900/60 border border-emerald-500 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto text-3xl">
            <RiCheckDoubleLine />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Customer Onboarded Successfully!</h2>
            <p className="text-slate-400 text-sm mt-1">
              Organization <span className="text-amber-400 font-semibold">{successData.organization?.name}</span> is live.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 max-w-lg mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Owner / Admin:</span>
              <span className="text-slate-200 font-semibold">{successData.owner?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Admin Login Email:</span>
              <span className="text-amber-400 font-mono font-semibold">{successData.owner?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Role:</span>
              <span className="text-emerald-400 font-bold uppercase">{successData.owner?.organizationRole}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Initial Branch:</span>
              <span className="text-slate-200">{successData.branch?.branchName} ({successData.branch?.branchCode})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">License:</span>
              <span className="text-amber-400 font-bold">{successData.organization?.license?.type}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-800 text-emerald-400 font-medium">
              <span>Onboarding Details Email:</span>
              <span>{successData.emailDispatched ? "Sent successfully ✓" : "Dispatched to " + successData.owner?.email}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => router.push("/super-admin/organizations")}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition"
            >
              View Organizations List
            </button>
            <button
              onClick={() => {
                setSuccessData(null);
                setStep(1);
                setFormData({
                  name: "",
                  legalName: "",
                  email: "",
                  phno: "",
                  address: "",
                  gstNumber: "",
                  licenseType: "LIFETIME",
                  licenseExpiresAt: "",
                  ownerName: "",
                  ownerEmail: "",
                  ownerUsername: "",
                  ownerPassword: "",
                  branchName: "",
                  branchCode: "HQ01",
                  branchAddress: "",
                });
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-6 py-2.5 rounded-xl text-sm transition"
            >
              Onboard Another
            </button>
          </div>
        </div>
      ) : (
        /* Form Card */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-xl">
          {/* STEP 1: Organization Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <RiBuilding4Line className="text-amber-400" />
                <span>Step 1: Hotel Organization Information</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hotel / Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="e.g. Grand Palace Hotel"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Legal Entity / Registered Name</label>
                  <input
                    type="text"
                    value={formData.legalName}
                    onChange={(e) => updateField("legalName", e.target.value)}
                    placeholder="e.g. Grand Palace Hospitality Pvt Ltd"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Hotel & Admin Login Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="e.g. admin@hotelname.com"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-amber-400/90 mt-1 block">
                    ✓ This email will be used for Owner Admin login & receiving login credentials.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phno}
                    onChange={(e) => updateField("phno", e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">GST / Tax Identification Number</label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => updateField("gstNumber", e.target.value.toUpperCase())}
                    placeholder="e.g. 33AAAAA0000A1Z5"
                    className="w-full text-sm font-mono px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Primary Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="City, State, Postal Code"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Commercial License */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <RiAwardLine className="text-amber-400" />
                <span>Step 2: Commercial License Plan</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["LIFETIME", "SUBSCRIPTION", "TRIAL"].map((plan) => {
                  const isSelected = formData.licenseType === plan;
                  return (
                    <div
                      key={plan}
                      onClick={() => updateField("licenseType", plan)}
                      className={`cursor-pointer rounded-2xl p-5 border text-center transition ${
                        isSelected
                          ? "bg-amber-950/40 border-amber-500 shadow-md shadow-orange-950/30 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="font-extrabold text-base mb-1">{plan}</div>
                      <p className="text-xs text-slate-400">
                        {plan === "LIFETIME" && "Permanent perpetual license with no expiry date."}
                        {plan === "SUBSCRIPTION" && "Recurring subscription billed periodically."}
                        {plan === "TRIAL" && "Evaluation trial license with automated expiry."}
                      </p>
                    </div>
                  );
                })}
              </div>

              {formData.licenseType !== "LIFETIME" && (
                <div className="pt-3 max-w-sm">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    License Expiration Date
                  </label>
                  <input
                    type="date"
                    value={formData.licenseExpiresAt}
                    onChange={(e) => updateField("licenseExpiresAt", e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Customer Owner Credentials */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <RiUserFollowLine className="text-amber-400" />
                <span>Step 3: Customer Organization Owner / Admin Credentials</span>
              </h3>
              <p className="text-xs text-slate-400">
                This account will be the primary Admin / Owner for this hotel organization. Login credentials and onboarding details will be sent automatically to this email.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Owner Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={(e) => updateField("ownerName", e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Admin Login Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.ownerEmail || formData.email}
                    onChange={(e) => updateField("ownerEmail", e.target.value)}
                    placeholder="admin@hotelname.com"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-mono focus:border-amber-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    ✓ Synced with Step 1 email. Same email is used for both hotel contact and admin login.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Admin Username (Optional)</label>
                  <input
                    type="text"
                    value={formData.ownerUsername}
                    onChange={(e) => updateField("ownerUsername", e.target.value)}
                    placeholder="e.g. Aatif or rajeshkumar"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Initial Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.ownerPassword}
                      onChange={(e) => updateField("ownerPassword", e.target.value)}
                      placeholder="Enter secure initial password"
                      className="w-full text-sm px-3.5 py-2.5 pr-10 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                    >
                      {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    This password will be securely emailed to the admin login email.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Initial Branch Setup */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <RiMapPinLine className="text-amber-400" />
                <span>Step 4: Primary / Initial Hotel Branch</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={formData.branchName}
                    onChange={(e) => updateField("branchName", e.target.value)}
                    placeholder={`${formData.name || 'Hotel'} - Main Branch`}
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Branch Code</label>
                  <input
                    type="text"
                    value={formData.branchCode}
                    onChange={(e) => updateField("branchCode", e.target.value.toUpperCase())}
                    placeholder="HQ01"
                    className="w-full text-sm font-mono px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Branch Location Address</label>
                  <input
                    type="text"
                    value={formData.branchAddress}
                    onChange={(e) => updateField("branchAddress", e.target.value)}
                    placeholder="Branch physical address"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Final Review & Confirmation */}
          {step === 5 && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <RiCheckDoubleLine className="text-amber-400" />
                <span>Step 5: Review & Confirm Onboarding</span>
              </h3>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 border-b border-slate-900 pb-2">
                  <span className="text-slate-400">Hotel Name:</span>
                  <span className="text-white font-bold">{formData.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b border-slate-900 pb-2">
                  <span className="text-slate-400">Admin Login Email:</span>
                  <span className="text-amber-400 font-mono font-semibold">{formData.ownerEmail || formData.email}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b border-slate-900 pb-2">
                  <span className="text-slate-400">License:</span>
                  <span className="text-amber-400 font-bold uppercase">{formData.licenseType}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b border-slate-900 pb-2">
                  <span className="text-slate-400">Owner / Admin Name:</span>
                  <span className="text-slate-200 font-semibold">{formData.ownerName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-slate-400">Initial Branch:</span>
                  <span className="text-slate-200">{formData.branchName || `${formData.name} - Main Branch`} ({formData.branchCode})</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs text-emerald-300">
                Notice: On submission, the organization, license, initial branch, and admin account will be provisioned. Login credentials & hotel access details will be immediately emailed to <strong className="text-amber-300">{formData.ownerEmail || formData.email}</strong>.
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                <RiArrowLeftLine />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-orange-950/40 transition"
              >
                <span>Continue</span>
                <RiArrowRightLine />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-950/50 disabled:opacity-50 transition"
              >
                {loading ? "Provisioning..." : "Confirm & Provision Customer"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
