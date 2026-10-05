"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../services/api";
import { AxiosError } from "axios";
import { useAuth } from "@/src/app/context/AuthContext";
import {
  FiMenu,
  FiSearch,
  FiBell,
  FiChevronDown,
  FiMapPin,
  FiCheck,
  FiLock,
  FiLayers,
} from "react-icons/fi";
import { RiShieldCheckLine } from "react-icons/ri";

interface BranchData {
  _id: string;
  branchName: string;
  branchCode: string;
  address?: string;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  role?: any;
  systemRole?: string;
  organizationRole?: string;
  branch?: any;
  isBranchLocked?: boolean;
  isAdmin?: boolean;
  isManager?: boolean;
  canViewFinances?: boolean;
}

export default function Navbar() {
  const { user: authUser, isAdmin: checkIsAdmin, isManager: checkIsManager, organizationName } = useAuth();
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [activeBranch, setActiveBranch] = useState<BranchData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [branchOpen, setBranchOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const isAdmin =
    checkIsAdmin() ||
    userData?.isAdmin ||
    userData?.systemRole === "SUPER_ADMIN" ||
    userData?.organizationRole === "OWNER" ||
    userData?.organizationRole === "ADMIN" ||
    userData?.role === "Admin" ||
    userData?.role?.name === "Admin";

  const isManager =
    checkIsManager() ||
    userData?.isManager ||
    userData?.organizationRole === "MANAGER" ||
    userData?.role === "Manager" ||
    userData?.role?.name === "Manager";

  // Both Admin and Manager have multi-branch access; Staff is strictly locked to their assigned branch
  const canSwitchBranches = isAdmin || isManager;
  const isStaffLocked = !canSwitchBranches && (userData?.isBranchLocked || !!userData?.branch);

  // Live real-time clock matching "Oct 3, 2026 / 02:51 PM"
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };
      // Format: "Oct 3, 2026 / 02:51 PM"
      const datePart = now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const timePart = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setCurrentTime(`${datePart}\n${timePart}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchBranches(currentUser?: UserData | null) {
    try {
      const userObj = currentUser || userData;
      const adminCheck =
        userObj?.isAdmin ||
        userObj?.systemRole === "SUPER_ADMIN" ||
        userObj?.organizationRole === "OWNER" ||
        userObj?.organizationRole === "ADMIN" ||
        userObj?.role === "Admin" ||
        userObj?.role?.name === "Admin";

      const res = await api.get("/get/branch/role");
      const list: BranchData[] = res.data.data || [];
      setBranches(list);

      const savedBranchId = typeof window !== "undefined" ? localStorage.getItem("pos_selected_branch") : null;

      if (!adminCheck && list.length > 0) {
        // Non-admin staff is strictly locked to their single assigned branch
        const assigned = list[0];
        setActiveBranch(assigned);
        localStorage.setItem("pos_selected_branch", assigned._id);
        window.dispatchEvent(new CustomEvent("pos_branch_changed", { detail: assigned }));
      } else {
        // Admin user can pick "ALL" or any individual branch
        let chosen: BranchData | null = null;
        if (savedBranchId === "ALL") {
          chosen = { _id: "ALL", branchName: "All Outlets (Consolidated)", branchCode: "ALL" };
        } else if (savedBranchId) {
          chosen = list.find((b: BranchData) => b._id === savedBranchId) || null;
        }

        if (!chosen && list.length > 0) {
          chosen = list[0];
        }

        if (chosen) {
          setActiveBranch(chosen);
          localStorage.setItem("pos_selected_branch", chosen._id);
          window.dispatchEvent(new CustomEvent("pos_branch_changed", { detail: chosen }));
        }
      }
    } catch (err) {
      // Fallback display
      setBranches([
        {
          _id: "b1",
          branchName: "Tanjavoor Hotel",
          branchCode: "TNJ-01",
        },
      ]);
      setActiveBranch({
        _id: "b1",
        branchName: "Tanjavoor Hotel",
        branchCode: "TNJ-01",
      });
    }
  }

  async function fetchUser() {
    try {
      const res = await api.get("/user/get");
      const u = res.data.data;
      setUserData(u);
      fetchBranches(u);
    } catch (err) {
      try {
        const stored = localStorage.getItem("UserData") || localStorage.getItem("userData");
        if (stored) {
          const parsed = JSON.parse(stored);
          setUserData(parsed);
          fetchBranches(parsed);
        }
      } catch (e) {
        fetchBranches();
      }
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  const displayName = authUser?.name || userData?.name || "Staff";
  const userInitial = displayName.charAt(0).toUpperCase();
  const displayRole = isAdmin ? "Admin" : isManager ? "Manager" : "Staff";

  return (
    <header className="w-full bg-white border-b border-gray-200/80 px-6 py-3 flex items-center justify-between shadow-2xs z-30 select-none">
      {/* Left: Hamburger + Active Outlet */}
      <div className="flex items-center gap-6">
        <button
          className="text-gray-600 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          title="Toggle Navigation"
        >
          <FiMenu size={20} />
        </button>

        <div className="relative">
          <div
            onClick={() => {
              if (canSwitchBranches && branches.length > 0) {
                setBranchOpen(!branchOpen);
              }
            }}
            className={`flex items-center gap-3 group ${canSwitchBranches && branches.length > 0 ? "cursor-pointer" : "cursor-default"}`}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-none mb-1">
                {isAdmin ? "Active Outlet (Admin)" : isManager ? "Active Outlet (Manager)" : "Assigned Outlet"}
              </p>
              <div className="flex items-center gap-1.5">
                <h3 className={`text-sm font-extrabold text-gray-900 transition ${canSwitchBranches && branches.length > 0 ? "group-hover:text-[#e02424]" : ""}`}>
                  {activeBranch?.branchName || "Main Outlet"}
                </h3>
                {canSwitchBranches && (
                  <FiChevronDown
                    size={14}
                    className={`text-gray-500 transition-transform ${
                      branchOpen ? "rotate-180" : ""
                    }`}
                  />
                )}
                {isStaffLocked && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <FiLock size={10} /> Assigned
                  </span>
                )}
              </div>
            </div>

            {/* Online Status Pill */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 ml-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Online
            </span>
          </div>

          {/* Branch Dropdown for Admins and Managers */}
          {branchOpen && canSwitchBranches && (
            <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl border border-gray-200 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-2 py-1 mb-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Switch Outlet / Branch
                </p>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${isAdmin ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                  {isAdmin ? "Admin Access" : "Manager Access"}
                </span>
              </div>
              
              <div className="space-y-1">
                {/* All Outlets Option for Admin */}
                <button
                  type="button"
                  onClick={() => {
                    const allOption = {
                      _id: "ALL",
                      branchName: "All Outlets (Consolidated)",
                      branchCode: "ALL",
                    };
                    setActiveBranch(allOption);
                    setBranchOpen(false);
                    localStorage.setItem("pos_selected_branch", "ALL");
                    window.dispatchEvent(new CustomEvent("pos_branch_changed", { detail: allOption }));
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-bold transition ${
                    activeBranch?._id === "ALL"
                      ? "bg-red-50 text-[#e02424]"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FiLayers className="text-gray-500 shrink-0" size={14} />
                    <div>
                      <p className="font-extrabold">All Outlets</p>
                      <p className="text-[10px] font-medium text-gray-400">
                        Consolidated data across all branches
                      </p>
                    </div>
                  </div>
                  {activeBranch?._id === "ALL" && <FiCheck className="text-[#e02424] shrink-0" />}
                </button>

                <div className="border-t border-gray-100 my-1" />

                {branches.map((b) => {
                  const isCurrent = activeBranch?._id === b._id;
                  return (
                    <button
                      key={b._id}
                      type="button"
                      onClick={() => {
                        setActiveBranch(b);
                        setBranchOpen(false);
                        localStorage.setItem("pos_selected_branch", b._id);
                        window.dispatchEvent(new CustomEvent("pos_branch_changed", { detail: b }));
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-bold transition ${
                        isCurrent
                          ? "bg-red-50 text-[#e02424]"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate">{b.branchName}</p>
                        <p className="text-[10px] font-medium text-gray-400">
                          {b.branchCode}
                        </p>
                      </div>
                      {isCurrent && <FiCheck className="text-[#e02424] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Admin Console Switch + Search + Bell + Date/Time + Avatar */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Admin Console Switcher - Visible only to Admin users */}
        {isAdmin && (
          <Link
            href="/admin-dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition shadow-xs border border-slate-700 active:scale-95"
            title="Open Admin Management Console"
          >
            <RiShieldCheckLine className="text-red-400" size={15} />
            <span>Admin Console</span>
          </Link>
        )}

        {/* Search Input */}
        <div className="relative hidden md:block">
          <FiSearch
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={14}
          />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-52 pl-9 pr-4 py-1.5 bg-gray-100/80 hover:bg-gray-100 focus:bg-white text-xs text-gray-800 placeholder-gray-400 rounded-xl border border-transparent focus:border-gray-300 focus:outline-hidden transition"
          />
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer">
          <FiBell size={18} />
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#e02424] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
            3
          </span>
        </button>

        {/* Date & Time */}
        <div className="hidden lg:block text-right border-l border-gray-200 pl-4 py-0.5">
          <div className="text-[11px] font-bold text-gray-800 leading-tight">
            {currentTime.split("\n")[0] || "Oct 3, 2026"}
          </div>
          <div className="text-[10px] font-semibold text-gray-400 leading-tight">
            {currentTime.split("\n")[1] || "02:51 PM"}
          </div>
        </div>

        {/* User Avatar Circle with Role Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {userInitial}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[120px]">{displayName}</p>
            <p className={`text-[10px] font-extrabold uppercase tracking-wider ${isAdmin ? "text-red-600" : isManager ? "text-amber-600" : "text-slate-500"}`}>
              {displayRole}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}