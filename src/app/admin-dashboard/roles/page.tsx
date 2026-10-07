"use client";

import React, { useState, useEffect } from "react";
import api from "@/src/app/services/api";
import { useAuth } from "@/src/app/context/AuthContext";
import { FiShield, FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiInfo } from "react-icons/fi";
import { MdSecurity } from "react-icons/md";

interface PermissionItem {
  _id: string;
  name: string;
  key: string;
  module: string;
  action: string;
  description?: string;
}

interface RoleItem {
  _id: string;
  name: string;
  key: string;
  description?: string;
  isSystemRole: boolean;
  organization?: string | null;
  permissions: PermissionItem[];
  createdAt: string;
}

export default function RolesManagementPage() {
  const { hasPermission, isOrganizationOwner, isSuperAdmin } = useAuth();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [groupedPerms, setGroupedPerms] = useState<{ [module: string]: PermissionItem[] }>({});
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleKey, setRoleKey] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canCreateRole = isSuperAdmin() || isOrganizationOwner() || hasPermission("role.create");
  const canUpdateRole = isSuperAdmin() || isOrganizationOwner() || hasPermission("role.update");
  const canDeleteRole = isSuperAdmin() || isOrganizationOwner() || hasPermission("role.delete");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get("/roles"),
        api.get("/permissions"),
      ]);

      if (rolesRes.data?.success) {
        setRoles(rolesRes.data.data);
      }
      if (permsRes.data?.success) {
        const all = permsRes.data.data.all || [];
        setPermissions(all);
        setGroupedPerms(permsRes.data.data.grouped || {});
      }
    } catch (err: any) {
      console.error("Failed to load roles/permissions", err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingRoleId(null);
    setRoleName("");
    setRoleKey("");
    setRoleDescription("");
    setSelectedPermIds([]);
    setErrorMsg("");
    setIsModalOpen(true);
  }

  function openEditModal(role: RoleItem) {
    if (role.isSystemRole) {
      alert("System default roles cannot be edited. You can create a new custom role instead.");
      return;
    }
    setEditingRoleId(role._id);
    setRoleName(role.name);
    setRoleKey(role.key);
    setRoleDescription(role.description || "");
    const permIds = (role.permissions || []).map((p: any) => (typeof p === "string" ? p : p._id));
    setSelectedPermIds(permIds);
    setErrorMsg("");
    setIsModalOpen(true);
  }

  function togglePermission(permId: string) {
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  }

  function toggleModule(mod: string) {
    const modPermIds = (groupedPerms[mod] || []).map((p) => p._id);
    const allSelected = modPermIds.every((id) => selectedPermIds.includes(id));
    if (allSelected) {
      setSelectedPermIds((prev) => prev.filter((id) => !modPermIds.includes(id)));
    } else {
      setSelectedPermIds((prev) => Array.from(new Set([...prev, ...modPermIds])));
    }
  }

  function selectAll() {
    setSelectedPermIds(permissions.map((p) => p._id));
  }

  function clearAll() {
    setSelectedPermIds([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roleName.trim() || !roleKey.trim()) {
      setErrorMsg("Role name and key are required");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      if (editingRoleId) {
        await api.put(`/roles/${editingRoleId}`, {
          name: roleName.trim(),
          description: roleDescription.trim(),
          permissions: selectedPermIds,
        });
      } else {
        await api.post("/roles", {
          name: roleName.trim(),
          key: roleKey.trim().toUpperCase(),
          description: roleDescription.trim(),
          permissions: selectedPermIds,
        });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(role: RoleItem) {
    if (role.isSystemRole) return;
    if (!confirm(`Are you sure you want to delete role "${role.name}"?`)) return;

    try {
      await api.delete(`/roles/${role._id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete role");
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-red-100 text-red-700 rounded-lg">
              <MdSecurity size={24} />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">Roles & Granular Permissions</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage customizable organization roles and configure modular access permissions.
          </p>
        </div>

        {canCreateRole && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-red-600/20 transition"
          >
            <FiPlus size={18} />
            <span>Create Custom Role</span>
          </button>
        )}
      </div>

      {/* Role Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 font-medium">Loading roles & permissions...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((role) => {
            const permCount = role.permissions ? role.permissions.length : 0;
            return (
              <div
                key={role._id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{role.name}</h3>
                      <span className="inline-block mt-1 font-mono text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {role.key}
                      </span>
                    </div>
                    {role.isSystemRole ? (
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        System Template
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Custom Role
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 mt-3 line-clamp-2">
                    {role.description || "No description provided."}
                  </p>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1 font-medium">
                      <FiShield className="text-red-500" />
                      {permCount} {permCount === 1 ? "Permission" : "Permissions"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  {!role.isSystemRole && (
                    <>
                      {canUpdateRole && (
                        <button
                          onClick={() => openEditModal(role)}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <FiEdit2 size={13} />
                          <span>Edit</span>
                        </button>
                      )}
                      {canDeleteRole && (
                        <button
                          onClick={() => handleDelete(role)}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <FiTrash2 size={13} />
                          <span>Delete</span>
                        </button>
                      )}
                    </>
                  )}
                  {role.isSystemRole && (
                    <span className="text-[11px] text-gray-400 italic">Built-in Role</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Role Creation / Editing Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="font-bold text-lg">
                  {editingRoleId ? `Edit Role: ${roleName}` : "Create New Custom Role"}
                </h3>
                <p className="text-xs text-slate-300">
                  Select granular module permissions to assign to this role.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <FiX size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Form Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Night Auditor, Front Desk Lead"
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Role Key * (Unique Identifier)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingRoleId}
                    value={roleKey}
                    onChange={(e) => setRoleKey(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                    placeholder="e.g. NIGHT_AUDITOR"
                    className="w-full text-sm font-mono px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none disabled:bg-gray-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="Briefly describe the responsibilities and scope of this role"
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Permission Matrix */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <h4 className="font-bold text-sm text-gray-900">
                    Module Permission Matrix ({selectedPermIds.length} selected)
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-xs font-semibold px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-4 max-h-96 overflow-y-auto pr-2">
                  {Object.entries(groupedPerms).map(([mod, perms]) => {
                    const modPermIds = perms.map((p) => p._id);
                    const isAllSelected = modPermIds.every((id) => selectedPermIds.includes(id));

                    return (
                      <div
                        key={mod}
                        className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/50"
                      >
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200/60">
                          <span className="font-bold uppercase tracking-wider text-xs text-slate-800">
                            {mod.replace(/_/g, " ")}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleModule(mod)}
                            className="text-[11px] font-semibold text-red-600 hover:underline"
                          >
                            {isAllSelected ? "Deselect Module" : "Select Module"}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {perms.map((p) => {
                            const isChecked = selectedPermIds.includes(p._id);
                            return (
                              <label
                                key={p._id}
                                className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition ${isChecked
                                    ? "bg-red-50/70 border-red-300 text-red-950 font-medium"
                                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermission(p._id)}
                                  className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                                />
                                <div>
                                  <div className="font-semibold text-gray-900 leading-snug">
                                    {p.name}
                                  </div>
                                  <div className="font-mono text-[10px] text-gray-400">
                                    {p.key}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md shadow-red-600/20 disabled:opacity-60 transition"
                >
                  {submitting ? "Saving..." : editingRoleId ? "Update Role" : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
