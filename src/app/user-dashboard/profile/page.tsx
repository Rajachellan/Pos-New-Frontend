"use client";

import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "@/src/app/context/AuthContext";
import { AxiosError } from "axios";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiShield,
  FiBriefcase,
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiKey,
  FiSave,
  FiRefreshCw,
  FiCheck,
  FiPrinter,
  FiUploadCloud,
  FiImage,
  FiTrash2,
  FiTag,
} from "react-icons/fi";
import { generateThermalReceiptHtml } from "../../utils/receiptBranding";

interface ProfileDetails {
  name: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  organization: string;
  branch: string;
  status: string;
}

export default function ProfilePage() {
  const { user: authUser, organizationName, isAdmin, isManager, isSuperAdmin } = useAuth();

  const [profile, setProfile] = useState<ProfileDetails>({
    name: "",
    username: "",
    email: "",
    phone: "",
    role: "",
    organization: "",
    branch: "",
    status: "ACTIVE",
  });

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Update State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState("");
  const [passwordErrorMsg, setPasswordErrorMsg] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Branch & Receipt Branding State
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [branchForm, setBranchForm] = useState({
    branchName: "Andhra Spicy House",
    branchCode: "MAIN",
    logoUrl: "",
    tagline: "",
    address: "No 19, CLC Works Road, Chromepet, Chennai - 600044.",
    phone: "",
    gstin: "33EAOPS1393L2Z0",
    fssai: "",
    receiptFooter: "Thank you! Visit again...!!!!",
  });
  const [uploadingBranchLogo, setUploadingBranchLogo] = useState(false);
  const [branchLogoError, setBranchLogoError] = useState("");
  const [branchSuccessMsg, setBranchSuccessMsg] = useState("");
  const [branchErrorMsg, setBranchErrorMsg] = useState("");
  const [isSavingBranch, setIsSavingBranch] = useState(false);

  // Fetch complete profile from server
  async function fetchProfileData(silent = false) {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    setProfileErrorMsg("");

    try {
      const res = await api.get("/user/get");
      if (res?.data?.success && res.data.data) {
        const d = res.data.data;
        const roleLabel = isSuperAdmin()
          ? "Super Administrator"
          : d.organizationRole === "OWNER"
          ? "Organization Owner"
          : d.organizationRole === "ADMIN" || d.userRole === "Admin"
          ? "System Administrator"
          : d.organizationRole === "MANAGER" || d.userRole === "Manager"
          ? "Branch Manager"
          : "Operational Staff";

        const branchLabel = d.branch?.branchName || d.branchName || "All Outlets (Consolidated)";
        const orgLabel = d.organization?.name || d.organizationName || organizationName || "Organization";

        setProfile({
          name: d.name || d.username || "",
          username: d.username || d.name || "",
          email: d.email || "",
          phone: d.phone || "",
          role: roleLabel,
          organization: orgLabel,
          branch: branchLabel,
          status: d.status || "ACTIVE",
        });
      }
    } catch (err) {
      console.error("Failed to fetch user profile", err);
      // Fallback from auth context or localStorage
      const cached = localStorage.getItem("UserData") || localStorage.getItem("userData");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setProfile((prev) => ({
            ...prev,
            name: parsed.name || parsed.username || prev.name,
            username: parsed.username || parsed.name || prev.username,
            email: parsed.email || prev.email,
            phone: parsed.phone || prev.phone,
            role: parsed.organizationRole || parsed.userRole || prev.role || "Administrator",
            organization: parsed.organizationName || organizationName || prev.organization,
            branch: parsed.branchName || prev.branch,
          }));
        } catch (e) {}
      } else if (authUser) {
        setProfile((prev) => ({
          ...prev,
          name: authUser.name || authUser.username || "",
          username: authUser.username || authUser.name || "",
          email: authUser.email || "",
          role: authUser.organizationRole || authUser.systemRole || "Administrator",
          organization: authUser.organizationName || organizationName || "",
          branch: authUser.branchName || "All Outlets",
        }));
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  async function fetchBranchData() {
    try {
      let branchList: any[] = [];
      try {
        const res = await api.get("/get/branch");
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          branchList = res.data.data;
        }
      } catch (e) {}

      if (branchList.length === 0) {
        const resRole = await api.get("/get/branch/role");
        if (resRole.data?.success && Array.isArray(resRole.data.data)) {
          branchList = resRole.data.data;
        }
      }

      if (branchList.length > 0) {
        setBranches(branchList);
        const savedBId = typeof window !== "undefined" ? localStorage.getItem("pos_selected_branch") : null;
        const currentB =
          (savedBId ? branchList.find((b: any) => b._id === savedBId) : null) ||
          branchList.find((b: any) => b.logoUrl && b.logoUrl.trim()) ||
          branchList[0];

        if (currentB) {
          setSelectedBranchId(currentB._id);
          setBranchForm({
            branchName: currentB.branchName || "Andhra Spicy House",
            branchCode: currentB.branchCode || "HQ-01",
            logoUrl: currentB.logoUrl || "",
            tagline: currentB.tagline || "",
            address: currentB.address || "17, CLC Works Rd, Pallavapuram, New Colony, Chromepet, Tambaram, Tamil Nadu 600044",
            phone: currentB.phone || "",
            gstin: currentB.gstin || "33EAOPS1393L2Z0",
            fssai: currentB.fssai || "",
            receiptFooter: currentB.receiptFooter || "Thank you! Visit again...!!!!",
          });
        }
      }
    } catch (err) {
      console.warn("Could not load branches in profile", err);
    }
  }

  useEffect(() => {
    fetchProfileData();
    fetchBranchData();
  }, []);

  function handleSelectBranch(bId: string) {
    setSelectedBranchId(bId);
    const b = branches.find((item) => item._id === bId);
    if (b) {
      setBranchForm({
        branchName: b.branchName || "Andhra Spicy House",
        branchCode: b.branchCode || "MAIN",
        logoUrl: b.logoUrl || "",
        tagline: b.tagline || "",
        address: b.address || "",
        phone: b.phone || "",
        gstin: b.gstin || "",
        fssai: b.fssai || "",
        receiptFooter: b.receiptFooter || "Thank you! Visit again...!!!!",
      });
      setBranchSuccessMsg("");
      setBranchErrorMsg("");
    }
  }

  // Handle Logo Upload to Cloudflare R2
  const handleBranchLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setBranchLogoError("Please select a valid image file (PNG, JPG, WEBP, SVG)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setBranchLogoError("Image size must be less than 10MB");
      return;
    }

    setUploadingBranchLogo(true);
    setBranchLogoError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("image", file);
      formData.append("folder", "logos");

      const res = await api.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success && res.data.url) {
        setBranchForm((prev) => ({ ...prev, logoUrl: res.data.url }));
        setBranchSuccessMsg("Logo uploaded! Click 'Save Branch Details' to apply.");
      } else {
        setBranchLogoError(res.data?.message || "Failed to upload logo");
      }
    } catch (err: any) {
      setBranchLogoError(err.response?.data?.message || "Failed to upload image");
    } finally {
      setUploadingBranchLogo(false);
    }
  };

  async function handleSaveBranchBranding(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBranchId) return;
    setIsSavingBranch(true);
    setBranchSuccessMsg("");
    setBranchErrorMsg("");

    try {
      const res = await api.put(`/branch/${selectedBranchId}`, branchForm);
      if (res.data?.success) {
        setBranchSuccessMsg(`Branch "${branchForm.branchName}" receipt branding saved!`);
        // Update local terminal settings cache so all POS receipts reflect immediately
        try {
          const savedConfig = localStorage.getItem("pos_terminal_settings");
          const parsed = savedConfig ? JSON.parse(savedConfig) : {};
          localStorage.setItem(
            "pos_terminal_settings",
            JSON.stringify({
              ...parsed,
              restaurantName: branchForm.branchName,
              logoUrl: branchForm.logoUrl,
              tagline: branchForm.tagline,
              address: branchForm.address,
              phone: branchForm.phone,
              gstin: branchForm.gstin,
              fssaiLicense: branchForm.fssai,
              receiptFooter: branchForm.receiptFooter,
            })
          );
          window.dispatchEvent(new Event("pos_branch_changed"));
        } catch (e) {}

        await fetchBranchData();
      }
    } catch (err: any) {
      setBranchErrorMsg(err.response?.data?.message || "Failed to update branch details.");
    } finally {
      setIsSavingBranch(false);
    }
  }

  function handleTestPrint() {
    const receiptHtml = generateThermalReceiptHtml({
      receiptInfo: {
        branchName: branchForm.branchName || "Andhra Spicy House",
        logoUrl: branchForm.logoUrl,
        address: branchForm.address || "No 19, CLC Works Road, Chromepet, Chennai - 600044.",
        phone: branchForm.phone || "",
        gstin: branchForm.gstin || "33EAOPS1393L2Z0",
        tagline: branchForm.tagline,
        receiptFooter: branchForm.receiptFooter,
      },
      orderNumber: "73",
      tokenNumber: "65",
      orderType: "Takeaway",
      customerName: "Sample Customer",
      cashierName: profile.name || "biller",
      items: [
        { name: "Garlic Naan", quantity: 3, price: 60 },
        { name: "Paneer Butter Masala", quantity: 1, price: 200 },
        { name: "Veg Biriyani", quantity: 1, price: 190 },
        { name: "Chicken Schezwan Fried Rice", quantity: 1, price: 200 },
        { name: "Egg Schezwan Fried Rice", quantity: 1, price: 180 },
      ],
      subtotal: 950.0,
      gstAmount: 47.5,
      gstRate: 5,
      roundOff: 0.5,
      grandTotal: 998.0,
      paymentMethod: "Cash",
    });

    const w = window.open("", "_blank", "width=380,height=600");
    if (w) {
      w.document.write(receiptHtml);
      w.document.close();
    }
  }

  // Update Profile (Name & Phone)
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSuccessMsg("");
    setProfileErrorMsg("");

    if (!profile.name.trim()) {
      setProfileErrorMsg("Name cannot be empty");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await api.put("/user/profile", {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
      });

      if (res?.data?.success) {
        setProfileSuccessMsg("Profile information updated successfully!");
        setTimeout(() => setProfileSuccessMsg(""), 4000);
        // Update cached UserData
        const cached = localStorage.getItem("UserData");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            parsed.name = profile.name.trim();
            parsed.phone = profile.phone.trim();
            localStorage.setItem("UserData", JSON.stringify(parsed));
          } catch (e) {}
        }
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setProfileErrorMsg(axiosError.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  }

  // Update Password
  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordSuccessMsg("");
    setPasswordErrorMsg("");

    if (!newPassword) {
      setPasswordErrorMsg("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordErrorMsg("New password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg("New password and confirm password do not match");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await api.put("/user/change-password", {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      if (res?.data?.success) {
        setPasswordSuccessMsg("Password changed successfully! Keep your new password safe.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccessMsg(""), 5000);
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setPasswordErrorMsg(axiosError.response?.data?.message || "Failed to change password. Please check your current password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  const userInitial = profile.name ? profile.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-md shadow-red-900/20">
              <FiUser size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                My Profile & Account
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                View your credentials, security role, assigned branch, and update your password.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchProfileData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <FiRefreshCw size={14} className={isRefreshing ? "animate-spin text-red-600" : ""} />
          <span>Refresh Details</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile Card & Information (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            {/* User Identity Header */}
            <div className="flex items-center gap-4 sm:gap-5 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center text-2xl font-black shadow-md shadow-red-900/20 shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-black text-slate-900 truncate">
                  {profile.name || "Authorized User"}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200/80">
                    <FiShield size={12} /> {profile.role}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-blue-50 text-blue-700 border border-blue-200/80">
                    <FiBriefcase size={12} /> {profile.organization}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Edit Form */}
            <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FiUser className="text-slate-400" /> Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FiMail className="text-slate-400" /> Email Address
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={profile.email}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-600 cursor-not-allowed"
                    title="Email is managed by system administrator"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FiPhone className="text-slate-400" /> Phone Number
                  </label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FiBriefcase className="text-slate-400" /> Assigned Outlet
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={profile.branch}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>

              {profileSuccessMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 animate-in fade-in">
                  <FiCheckCircle size={15} className="shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {profileErrorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-800 animate-in fade-in">
                  <FiAlertCircle size={15} className="shrink-0" />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Account status: <span className="text-emerald-600 font-bold">Active Session</span>
                </span>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95 transition cursor-pointer disabled:opacity-60"
                >
                  <FiSave size={15} />
                  <span>{isSavingProfile ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Change Password Section (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
                <FiKey size={16} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Change Password</h3>
                <p className="text-xs text-slate-400">Update your account login password</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="mt-5 space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FiLock size={12} className="text-slate-400" /> Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showCurrentPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FiKey size={12} className="text-slate-400" /> New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showNewPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FiCheck size={12} className="text-slate-400" /> Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showConfirmPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              {passwordSuccessMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 animate-in fade-in">
                  <FiCheckCircle size={15} className="shrink-0" />
                  <span>{passwordSuccessMsg}</span>
                </div>
              )}

              {passwordErrorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-800 animate-in fade-in">
                  <FiAlertCircle size={15} className="shrink-0" />
                  <span>{passwordErrorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-red-950/20 active:scale-95 transition disabled:opacity-60 cursor-pointer mt-2"
              >
                <FiLock size={15} />
                <span>{isUpdatingPassword ? "Updating Password..." : "Update Password"}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Branch-Wise Identity & Receipt Customization Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold uppercase tracking-wider mb-2">
              <FiPrinter size={13} /> Branch-Wise Receipt Customization
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Branch Logo & Thermal Bill Customization
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Customize logos, GSTIN, address, and receipt details per branch (e.g. Express vs Main Outlet)
            </p>
          </div>

          {branches.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Select Branch:
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => handleSelectBranch(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-red-500 transition cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.branchName} ({b.branchCode})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sub-panel: Form Inputs (7 cols) */}
          <form onSubmit={handleSaveBranchBranding} className="lg:col-span-7 space-y-5">
            {/* Logo Upload Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <FiImage className="text-red-600" /> Branch Receipt Logo (Cloudflare R2)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Printed at the top of customer receipts for this branch
                  </p>
                </div>
                {branchForm.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setBranchForm({ ...branchForm, logoUrl: "" })}
                    className="text-xs font-bold text-red-600 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <FiTrash2 size={13} /> Remove
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  {branchForm.logoUrl ? (
                    <img
                      src={branchForm.logoUrl}
                      alt="Branch Logo"
                      className="w-full h-full object-contain p-1.5"
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-300">
                      <FiImage size={28} className="mx-auto mb-1 text-slate-300" />
                      <span className="text-[10px] font-bold">No Logo</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs active:scale-95">
                      <FiUploadCloud size={15} />
                      <span>{uploadingBranchLogo ? "Uploading..." : "Upload Logo to R2"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBranchLogoUpload}
                        disabled={uploadingBranchLogo}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-slate-400">PNG, JPG, SVG up to 10MB</span>
                  </div>

                  <input
                    type="url"
                    placeholder="Or paste direct image URL (https://...)"
                    value={branchForm.logoUrl}
                    onChange={(e) => setBranchForm({ ...branchForm, logoUrl: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:border-red-500"
                  />
                  {branchLogoError && (
                    <p className="text-[11px] font-bold text-red-600">{branchLogoError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Branch Identity & Address Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Branch Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={branchForm.branchName}
                  onChange={(e) => setBranchForm({ ...branchForm, branchName: e.target.value })}
                  placeholder="e.g. Andhra Spicy House Express"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Tagline / Outlet Type
                </label>
                <input
                  type="text"
                  value={branchForm.tagline}
                  onChange={(e) => setBranchForm({ ...branchForm, tagline: e.target.value })}
                  placeholder="e.g. Express Takeaway & Delivery"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Receipt Address (Printed On Thermal Paper) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  placeholder="e.g. No 19, CLC Works Road, Chromepet, Chennai - 600044."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  GSTIN (Tax ID)
                </label>
                <input
                  type="text"
                  value={branchForm.gstin}
                  onChange={(e) => setBranchForm({ ...branchForm, gstin: e.target.value.toUpperCase() })}
                  placeholder="33EAOPS1393L2Z0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Branch Phone Number
                </label>
                <input
                  type="text"
                  value={branchForm.phone}
                  onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  FSSAI License No.
                </label>
                <input
                  type="text"
                  value={branchForm.fssai}
                  onChange={(e) => setBranchForm({ ...branchForm, fssai: e.target.value })}
                  placeholder="12423004000123"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Receipt Footer Note
                </label>
                <input
                  type="text"
                  value={branchForm.receiptFooter}
                  onChange={(e) => setBranchForm({ ...branchForm, receiptFooter: e.target.value })}
                  placeholder="Thank you! Visit again...!!!!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                />
              </div>
            </div>

            {branchSuccessMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 animate-in fade-in">
                <FiCheckCircle size={15} className="shrink-0" />
                <span>{branchSuccessMsg}</span>
              </div>
            )}

            {branchErrorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-800 animate-in fade-in">
                <FiAlertCircle size={15} className="shrink-0" />
                <span>{branchErrorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Branch Code: <span className="font-bold text-slate-700">{branchForm.branchCode || "MAIN"}</span>
              </span>

              <button
                type="submit"
                disabled={isSavingBranch || !selectedBranchId}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95 transition cursor-pointer disabled:opacity-60"
              >
                <FiSave size={15} />
                <span>{isSavingBranch ? "Saving..." : "Save Branch Details"}</span>
              </button>
            </div>
          </form>

          {/* Right Sub-panel: Live Thermal Receipt Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <FiPrinter className="text-red-600" /> Live Receipt Preview
              </span>
              <button
                type="button"
                onClick={handleTestPrint}
                className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
              >
                <FiPrinter size={13} /> Print Test Slip
              </button>
            </div>

            {/* Paper Receipt Frame */}
            <div className="bg-[#fcfbf9] rounded-2xl border border-slate-300 shadow-md p-5 text-slate-800 font-sans text-xs space-y-2.5 max-w-[340px] mx-auto select-none">
              {/* Header with Logo */}
              <div className="text-center space-y-1">
                {branchForm.logoUrl ? (
                  <div className="flex justify-center mb-1">
                    <img
                      src={branchForm.logoUrl}
                      alt="Branch Logo"
                      className="max-h-16 max-w-[170px] object-contain mx-auto"
                    />
                  </div>
                ) : (
                  <h3 className="font-black text-lg text-red-700 uppercase tracking-tight">
                    {branchForm.branchName || "Andhra Spicy House"}
                  </h3>
                )}
                {branchForm.tagline && (
                  <p className="text-[10px] text-slate-500 font-semibold">{branchForm.tagline}</p>
                )}
                <p className="text-[10.5px] text-slate-600 leading-tight">
                  {branchForm.address || "No 19, CLC Works Road, Chromepet, Chennai - 600044."}
                </p>
                {branchForm.phone && (
                  <p className="text-[10.5px] text-slate-600">Tel: {branchForm.phone}</p>
                )}
                <p className="text-[11px] font-extrabold text-slate-900 pt-0.5">
                  GSTIN: {branchForm.gstin || "33EAOPS1393L2Z0"}
                </p>
              </div>

              {/* Red Line */}
              <div className="border-t-2 border-red-700 my-1.5" />

              {/* Customer line */}
              <div className="text-[11px] text-slate-700">
                Name: <span className="border-b border-dotted border-slate-400 inline-block w-[78%]" />
              </div>

              {/* Dotted Line */}
              <div className="border-t border-dashed border-slate-300 my-1" />

              {/* Meta row 1 */}
              <div className="flex justify-between items-center text-[10.5px]">
                <span>Date: 27/03/26 15:16</span>
                <span className="font-extrabold text-red-700">Takeaway</span>
              </div>
              {/* Meta row 2 */}
              <div className="flex justify-between items-center text-[10.5px]">
                <span>Cashier: biller</span>
                <span>Bill No.: 73</span>
              </div>
              {/* Token Number */}
              <div className="text-red-700 font-black text-sm">
                Token No.: 65
              </div>

              {/* Dotted Line */}
              <div className="border-t border-dashed border-slate-300 my-1" />

              {/* Items Table */}
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-[#fef3c7] text-[#78350f] border-t border-b border-slate-300 font-bold">
                    <th className="py-1 text-left">Item</th>
                    <th className="py-1 text-center">Qty.</th>
                    <th className="py-1 text-right">Price</th>
                    <th className="py-1 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dotted divide-slate-200">
                  <tr>
                    <td className="py-1 font-semibold">Garlic Naan</td>
                    <td className="text-center font-bold">3</td>
                    <td className="text-right">60.00</td>
                    <td className="text-right font-bold">180.00</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Paneer Butter Masala</td>
                    <td className="text-center font-bold">1</td>
                    <td className="text-right">200.00</td>
                    <td className="text-right font-bold">200.00</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Veg Biriyani</td>
                    <td className="text-center font-bold">1</td>
                    <td className="text-right">190.00</td>
                    <td className="text-right font-bold">190.00</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Chicken Schezwan Fried Rice</td>
                    <td className="text-center font-bold">1</td>
                    <td className="text-right">200.00</td>
                    <td className="text-right font-bold">200.00</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Egg Schezwan Fried Rice</td>
                    <td className="text-center font-bold">1</td>
                    <td className="text-right">180.00</td>
                    <td className="text-right font-bold">180.00</td>
                  </tr>
                </tbody>
              </table>

              {/* Dotted Line */}
              <div className="border-t border-dashed border-slate-300 my-1" />

              {/* Totals */}
              <div className="text-[11px] space-y-0.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Total Qty: 7</span>
                  <div className="flex gap-4">
                    <span className="text-slate-500">Sub Total</span>
                    <span className="font-bold">₹ 950.00</span>
                  </div>
                </div>
                <div className="flex justify-end gap-4 text-[10.5px] text-slate-500">
                  <span>CGST 2.5%</span>
                  <span className="font-bold text-slate-700">₹ 23.75</span>
                </div>
                <div className="flex justify-end gap-4 text-[10.5px] text-slate-500">
                  <span>SGST 2.5%</span>
                  <span className="font-bold text-slate-700">₹ 23.75</span>
                </div>
                <div className="flex justify-end gap-4 text-[10.5px] text-slate-500 pt-0.5 border-t border-dotted border-slate-200">
                  <span>Round off</span>
                  <span className="font-bold text-slate-700">+ ₹ 0.50</span>
                </div>
              </div>

              {/* Grand Total Bar */}
              <div className="bg-[#fef3c7] border-t-2 border-b-2 border-red-700 px-3 py-1.5 flex justify-between items-center text-red-700 font-black">
                <span className="text-xs uppercase">Grand Total</span>
                <span className="text-sm">₹ 998.00</span>
              </div>

              {/* Footer */}
              <div className="text-center pt-2">
                <p className="font-bold italic text-slate-800 text-xs">
                  {branchForm.receiptFooter || "Thank you! Visit again...!!!!"}
                </p>
                <div className="w-16 h-0.5 bg-red-700 mx-auto mt-1 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
