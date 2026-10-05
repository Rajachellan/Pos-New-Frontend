"use client";

import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { FiUser, FiMail, FiPhone, FiShield, FiBriefcase, FiLock, FiCheckCircle } from "react-icons/fi";

export default function ProfilePage() {
  const [userData, setUserData] = useState<any>({
    username: "",
    email: "",
    role: "",
    organization: "",
    branch: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Try reading stored user session or fetch profile
    const stored = localStorage.getItem("userData") || localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUserData({
          username: parsed.username || parsed.name || "Manager",
          email: parsed.email || "manager@restaurant.com",
          role: parsed.role || "Branch Manager / Cashier",
          organization: parsed.organization?.name || "TANJAVOOR",
          branch: parsed.branch?.name || "Tanjavoor hotel -1",
          phone: parsed.phone || "+91 98765 00000",
        });
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FiUser className="text-[#e02424]" /> My Profile & Account
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          View your assigned credentials, operational roles, and branch assignment.
        </p>
      </div>

      <div className="max-w-3xl bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
        <div className="flex items-center gap-5 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-[#fdf2f2] text-[#e02424] flex items-center justify-center text-3xl font-extrabold border border-red-100">
            {userData.username ? userData.username.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{userData.username || "Authorized User"}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-[#e02424] border border-red-200">
                <FiShield className="text-xs" /> {userData.role}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                <FiBriefcase className="text-xs" /> {userData.organization}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <FiUser /> Full Name / Username
            </label>
            <input
              type="text"
              readOnly
              value={userData.username}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <FiMail /> Email Address
            </label>
            <input
              type="email"
              readOnly
              value={userData.email}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <FiBriefcase /> Assigned Branch
            </label>
            <input
              type="text"
              readOnly
              value={userData.branch}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <FiShield /> Security Role
            </label>
            <input
              type="text"
              readOnly
              value={userData.role}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800"
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <p>Role and credentials managed by Organization Administrator.</p>
          <div className="flex items-center gap-1 text-emerald-600 font-semibold">
            <FiCheckCircle /> Active Session
          </div>
        </div>
      </div>
    </div>
  );
}
