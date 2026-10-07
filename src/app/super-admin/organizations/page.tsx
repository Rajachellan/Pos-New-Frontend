"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/src/app/services/api";
import {
  RiBuilding4Line,
  RiAddLine,
  RiSearchLine,
  RiShieldFlashLine,
  RiKeyLine,
  RiCheckLine,
  RiCloseLine,
  RiEditLine,
} from "react-icons/ri";

export default function SuperAdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals state
  const [licenseModalOrg, setLicenseModalOrg] = useState<any>(null);
  const [licenseType, setLicenseType] = useState("LIFETIME");
  const [licenseStatus, setLicenseStatus] = useState("ACTIVE");
  const [licenseExpiry, setLicenseExpiry] = useState("");

  const [resetModalOrg, setResetModalOrg] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Organization & Owner Modal State
  const [editModalOrg, setEditModalOrg] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    legalName: "",
    email: "",
    phno: "",
    address: "",
    gstNumber: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
  });

  function handleStartEdit(org: any) {
    setEditModalOrg(org);
    setEditForm({
      name: org.name || "",
      legalName: org.legalName || "",
      email: org.email || "",
      phno: org.phno || "",
      address: org.address || "",
      gstNumber: org.gstNumber || "",
      ownerName: org.owner?.name || "",
      ownerEmail: org.owner?.email || "",
      ownerPhone: org.owner?.phno || "",
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm.name.trim()) {
      alert("Organization name is required");
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.put(`/super-admin/organizations/${editModalOrg._id}`, editForm);
      if (res.data?.success) {
        alert("Organization and owner details updated successfully!");
        setEditModalOrg(null);
        fetchOrganizations();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update organization details");
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    fetchOrganizations();
  }, [statusFilter]);

  async function fetchOrganizations() {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.get("/super-admin/organizations", { params });
      if (res.data?.success) {
        setOrganizations(res.data.data.organizations || []);
      }
    } catch (err) {
      console.error("Failed to load organizations", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(org: any) {
    const newStatus = org.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    if (!confirm(`Are you sure you want to change "${org.name}" status to ${newStatus}?`)) return;

    try {
      await api.patch(`/super-admin/organizations/${org._id}/status`, { status: newStatus });
      fetchOrganizations();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  }

  async function handleUpdateLicense(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.patch(`/super-admin/organizations/${licenseModalOrg._id}/license`, {
        type: licenseType,
        status: licenseStatus,
        expiresAt: licenseType === "LIFETIME" ? null : licenseExpiry || null,
      });
      setLicenseModalOrg(null);
      fetchOrganizations();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update license");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/super-admin/organizations/${resetModalOrg._id}/reset-owner`, {
        newPassword,
      });
      alert("Owner password has been updated successfully.");
      setResetModalOrg(null);
      setNewPassword("");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to reset password");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-red-50 text-[#e02424] border border-red-100">
              <RiBuilding4Line size={24} />
            </span>
            <span>Customer Organizations</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Manage customer hotel tenants, tenant isolation status, and commercial license entitlements.
          </p>
        </div>

        <Link
          href="/super-admin/organizations/create"
          className="inline-flex items-center gap-2 bg-gradient-to-tr from-[#9b1c1c] via-[#e02424] to-[#f05252] hover:opacity-95 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/35 transition transform hover:-translate-y-0.5 shrink-0"
        >
          <RiAddLine size={18} />
          <span>Onboard New Hotel</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Search hotel name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchOrganizations()}
            className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#e02424] focus:ring-2 focus:ring-red-500/10 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["", "ACTIVE", "SUSPENDED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === st
                  ? "bg-gradient-to-r from-[#9b1c1c] via-[#e02424] to-[#f05252] text-white shadow-xs shadow-red-500/20"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
              }`}
            >
              {st === "" ? "All Status" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-red-200 border-t-[#e02424] rounded-full animate-spin"></div>
            <span>Loading organizations...</span>
          </div>
        ) : organizations.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">No organizations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Hotel Organization</th>
                  <th className="py-3.5 px-4 font-bold">Customer Owner</th>
                  <th className="py-3.5 px-4 font-bold">License</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold">Created</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {organizations.map((org) => (
                  <tr key={org._id} className="hover:bg-red-50/20 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{org.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{org.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {org.owner ? (
                        <div>
                          <div className="font-bold text-slate-800">{org.owner.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{org.owner.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No Owner Assigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200/70">
                        {org.license?.type || "LIFETIME"}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                        Status: {org.license?.status || "ACTIVE"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          org.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                            : "bg-rose-50 text-rose-700 border border-rose-200/80"
                        }`}
                      >
                        {org.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleStartEdit(org)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200/80 transition cursor-pointer"
                        title="Edit organization and owner details"
                      >
                        <RiEditLine size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => {
                          setLicenseModalOrg(org);
                          setLicenseType(org.license?.type || "LIFETIME");
                          setLicenseStatus(org.license?.status || "ACTIVE");
                          setLicenseExpiry(
                            org.license?.expiresAt
                              ? new Date(org.license.expiresAt).toISOString().split("T")[0]
                              : ""
                          );
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold border border-red-200/70 transition cursor-pointer"
                      >
                        License
                      </button>

                      {org.owner && (
                        <button
                          onClick={() => {
                            setResetModalOrg(org);
                            setNewPassword("");
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200/80 transition cursor-pointer"
                        >
                          Reset Pass
                        </button>
                      )}

                      <button
                        onClick={() => toggleStatus(org)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition border cursor-pointer ${
                          org.status === "ACTIVE"
                            ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200/80"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200/80"
                        }`}
                      >
                        {org.status === "ACTIVE" ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* License Update Modal */}
      {licenseModalOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Manage License: {licenseModalOrg.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Modify commercial entitlement and validity periods.
            </p>

            <form onSubmit={handleUpdateLicense} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">License Type</label>
                <select
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-[#e02424]"
                >
                  <option value="LIFETIME">LIFETIME (Permanent)</option>
                  <option value="SUBSCRIPTION">SUBSCRIPTION (Recurring)</option>
                  <option value="TRIAL">TRIAL (Evaluation)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">License Status</label>
                <select
                  value={licenseStatus}
                  onChange={(e) => setLicenseStatus(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-[#e02424]"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>

              {licenseType !== "LIFETIME" && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Expires On</label>
                  <input
                    type="date"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-[#e02424]"
                  />
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLicenseModalOrg(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-gradient-to-tr from-[#9b1c1c] via-[#e02424] to-[#f05252] text-white font-bold rounded-xl shadow-xs hover:shadow-md transition"
                >
                  {actionLoading ? "Updating..." : "Save License"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModalOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Reset Owner Password
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Hotel: <span className="text-[#e02424] font-semibold">{resetModalOrg.name}</span> (Owner: {resetModalOrg.owner?.name})
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">New Secure Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-[#e02424]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetModalOrg(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-gradient-to-tr from-[#9b1c1c] via-[#e02424] to-[#f05252] text-white font-bold rounded-xl shadow-xs hover:shadow-md transition"
                >
                  {actionLoading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Organization & Owner Details Modal */}
      {editModalOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="p-1 rounded bg-red-50 text-[#e02424]">
                    <RiEditLine size={18} />
                  </span>
                  <span>Edit Organization & Owner Details</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tenant ID: <span className="font-mono text-slate-700 font-semibold">{editModalOrg._id}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOrg(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-6">
              {/* Organization Info Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-700">
                  <RiBuilding4Line size={16} />
                  <span>Organization & Business Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="e.g. TANJAVOOR"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-[#e02424] focus:ring-2 focus:ring-red-500/10"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Legal Entity / Trade Name
                    </label>
                    <input
                      type="text"
                      value={editForm.legalName}
                      onChange={(e) => setEditForm({ ...editForm, legalName: e.target.value })}
                      placeholder="e.g. Tanjavoor Hospitality Pvt Ltd"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-[#e02424] focus:ring-2 focus:ring-red-500/10"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Business Email Address
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="e.g. contact@tanjavoor.com"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-[#e02424] focus:ring-2 focus:ring-red-500/10"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Business Phone Number
                    </label>
                    <input
                      type="text"
                      value={editForm.phno}
                      onChange={(e) => setEditForm({ ...editForm, phno: e.target.value })}
                      placeholder="e.g. +91 9876543210"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-[#e02424] focus:ring-2 focus:ring-red-500/10"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      GSTIN / Tax Identification
                    </label>
                    <input
                      type="text"
                      value={editForm.gstNumber}
                      onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value })}
                      placeholder="e.g. 33AAAAA0000A1Z5"
                      className="w-full text-xs uppercase px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-[#e02424] focus:ring-2 focus:ring-red-500/10"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Registered Address
                    </label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="e.g. 123 Main Road, City"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-[#e02424] focus:ring-2 focus:ring-red-500/10"
                    />
                  </div>
                </div>
              </div>

              {/* Owner / User Profile Section */}
              <div className="space-y-4 border-t border-slate-100 pt-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-700">
                  <RiKeyLine size={16} />
                  <span>Customer Owner Account</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Owner Full Name
                    </label>
                    <input
                      type="text"
                      value={editForm.ownerName}
                      onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                      placeholder="e.g. Naresh Kumar"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-[#e02424] focus:ring-2 focus:ring-red-500/10"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Owner Email (Login ID)
                    </label>
                    <input
                      type="email"
                      value={editForm.ownerEmail}
                      onChange={(e) => setEditForm({ ...editForm, ownerEmail: e.target.value })}
                      placeholder="e.g. owner@gmail.com"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-[#e02424] focus:ring-2 focus:ring-red-500/10"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Owner Contact Phone
                    </label>
                    <input
                      type="text"
                      value={editForm.ownerPhone}
                      onChange={(e) => setEditForm({ ...editForm, ownerPhone: e.target.value })}
                      placeholder="e.g. +91 9876543210"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-[#e02424] focus:ring-2 focus:ring-red-500/10"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditModalOrg(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-gradient-to-tr from-[#9b1c1c] via-[#e02424] to-[#f05252] text-white font-bold rounded-xl transition text-xs disabled:opacity-50 cursor-pointer shadow-md shadow-red-500/20"
                >
                  {actionLoading ? "Saving Changes..." : "Save Organization & Owner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
