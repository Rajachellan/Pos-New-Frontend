"use client";

import React, { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import { AxiosError } from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiLayers,
  FiDollarSign,
  FiRefreshCw,
  FiAlertCircle,
  FiTag,
  FiUploadCloud,
  FiImage,
} from "react-icons/fi";
import { MdRestaurantMenu, MdFastfood } from "react-icons/md";

interface MenuItem {
  _id: string;
  category: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  isAvailable: boolean;
  createdAt?: string;
}

export default function MenuManagementPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states for Add/Edit
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [itemPrice, setItemPrice] = useState<number | string>("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemImageUrl, setItemImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [itemAvailable, setItemAvailable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3500);
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const res = await api.get("/get/menus");
      if (res.data.success && Array.isArray(res.data.data)) {
        setMenuItems(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load menu items", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Compute unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    menuItems.forEach((i) => {
      if (i.category) cats.add(i.category.toUpperCase().trim());
    });
    // Default categories if empty
    if (cats.size === 0) {
      ["BIRIYANI", "DESSERT", "DRINKS", "ICE CREAM", "ROTIS", "BBQ"].forEach(
        (c) => cats.add(c)
      );
    }
    return Array.from(cats);
  }, [menuItems]);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === "ALL" ||
        item.category.toUpperCase().trim() === selectedCategory;

      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Image Upload to Cloudflare R2
  const handleItemImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file (PNG, JPG, WEBP, SVG)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFormError("Image size must be less than 10MB");
      return;
    }

    setUploadingImage(true);
    setFormError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "menus");

      const res = await api.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success && res.data.url) {
        setItemImageUrl(res.data.url);
      } else {
        setFormError(res.data?.message || "Failed to upload image");
      }
    } catch (err: any) {
      console.error("Image upload failed", err);
      setFormError(
        err.response?.data?.message || err.message || "Failed to upload image to Cloudflare R2"
      );
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  // Open Add Modal
  const openAddModal = (presetCategory?: string) => {
    setItemName("");
    const defaultCat =
      presetCategory && presetCategory !== "ALL"
        ? presetCategory.toUpperCase().trim()
        : categories[0] ?? "BIRIYANI";
    setItemCategory(defaultCat);
    setIsNewCategoryMode(false);
    setItemPrice("");
    setItemDescription("");
    setItemImageUrl("");
    setItemAvailable(true);
    setFormError("");
    setShowAddModal(true);
  };

  // Open Edit Modal
  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemCategory(item.category.toUpperCase().trim());
    setIsNewCategoryMode(false);
    setItemPrice(item.price);
    setItemDescription(item.description || "");
    setItemImageUrl(item.imageUrl || "");
    setItemAvailable(item.isAvailable);
    setFormError("");
    setShowEditModal(true);
  };

  // Create Menu Item
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || itemPrice === "" || !itemCategory.trim()) {
      setFormError("Item name, category, and price are required");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    try {
      const res = await api.post("/add/menu", {
        name: itemName.trim(),
        category: itemCategory.trim().toUpperCase(),
        price: Number(itemPrice),
        description: itemDescription.trim(),
        imageUrl: itemImageUrl ? itemImageUrl.trim() : "",
        isAvailable: itemAvailable,
      });

      if (res.data.success) {
        setShowAddModal(false);
        showToast(`"${itemName.trim()}" added to menu successfully!`);
        await fetchMenuItems();
      }
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setFormError(error.response?.data?.message || "Failed to create menu item");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Menu Item
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSubmitting(true);
    setFormError("");
    try {
      const res = await api.put(`/menu/${editingItem._id}`, {
        name: itemName.trim(),
        category: itemCategory.trim().toUpperCase(),
        price: Number(itemPrice),
        description: itemDescription.trim(),
        imageUrl: itemImageUrl ? itemImageUrl.trim() : "",
        isAvailable: itemAvailable,
      });

      if (res.data.success) {
        setShowEditModal(false);
        showToast(`"${itemName.trim()}" updated successfully!`);
        await fetchMenuItems();
      }
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setFormError(error.response?.data?.message || "Failed to update menu item");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Availability directly
  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const newStatus = !item.isAvailable;
      // Optimistic update
      setMenuItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, isAvailable: newStatus } : i))
      );

      await api.put(`/menu/${item._id}`, {
        isAvailable: newStatus,
      });

      showToast(
        `"${item.name}" marked as ${newStatus ? "Available" : "Out of Stock"}`
      );
    } catch (err) {
      console.error("Failed to toggle availability", err);
      await fetchMenuItems();
    }
  };

  // Delete Menu Item
  const handleDeleteItem = async (id: string) => {
    try {
      const res = await api.delete(`/menu/${id}`);
      if (res.data.success) {
        setDeleteConfirmId(null);
        showToast("Dish removed from menu.");
        await fetchMenuItems();
      }
    } catch (err) {
      console.error("Failed to delete menu item", err);
    }
  };

  // Add Category Helper
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const cat = newCategoryName.trim().toUpperCase();
    openAddModal(cat);
    setShowCategoryModal(false);
    setNewCategoryName("");
  };

  return (
    <div className="p-6 md:p-8 bg-[#f8fafc] min-h-screen text-slate-800">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold"
          >
            <FiCheckCircle size={18} /> {successToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <MdRestaurantMenu className="text-[#e02424]" /> Menu Management
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Create categories, manage dishes, adjust prices, and toggle in-stock availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 hover:bg-gray-50 transition shadow-2xs cursor-pointer"
          >
            <FiPlus size={15} /> New Category
          </button>

          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#e02424] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
          >
            <FiPlus size={15} /> Add Food Item
          </button>
        </div>
      </div>

      {/* Main Layout: Left Categories + Right Items Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <FiLayers /> Categories ({categories.length})
              </h3>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="text-[#e02424] hover:bg-red-50 p-1.5 rounded-lg transition"
                title="Add New Category"
              >
                <FiPlus size={16} />
              </button>
            </div>

            <div className="space-y-1.5 mt-3 max-h-[600px] overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  selectedCategory === "ALL"
                    ? "bg-[#e02424] text-white shadow-xs"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>ALL ITEMS</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    selectedCategory === "ALL"
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {menuItems.length}
                </span>
              </button>

              {categories.map((cat) => {
                const count = menuItems.filter(
                  (i) => i.category.toUpperCase().trim() === cat
                ).length;
                const isSelected = selectedCategory === cat;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                      isSelected
                        ? "bg-[#e02424] text-white shadow-xs"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Items Table & Controls */}
        <div className="lg:col-span-3 space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <FiSearch
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search food items by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424]"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchMenuItems}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                <FiRefreshCw className={loading ? "animate-spin" : ""} size={13} />
                Refresh
              </button>
              <span className="text-xs font-bold text-gray-500">
                {filteredItems.length} {filteredItems.length === 1 ? "Item" : "Items"}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
            {loading ? (
              <div className="p-12 text-center text-gray-400 space-y-3">
                <FiRefreshCw className="animate-spin mx-auto text-2xl text-[#e02424]" />
                <p className="text-xs font-bold">Loading Menu Dishes...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-14 h-14 bg-red-50 text-[#e02424] rounded-full flex items-center justify-center mx-auto text-2xl">
                  <MdFastfood />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    No Food Items Found
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {searchQuery
                      ? "No dishes matched your search."
                      : `No items in ${selectedCategory}. Click "+ Add Food Item" to add one!`}
                  </p>
                </div>
                <button
                  onClick={() => openAddModal(selectedCategory !== "ALL" ? selectedCategory : undefined)}
                  className="px-5 py-2.5 bg-[#e02424] text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
                >
                  + Add First Dish
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Item Name</th>
                      <th className="px-6 py-3.5">Category</th>
                      <th className="px-6 py-3.5">Price</th>
                      <th className="px-6 py-3.5">Availability</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredItems.map((item) => (
                      <tr
                        key={item._id}
                        className="hover:bg-gray-50/70 transition"
                      >
                        {/* Name & Description with Image */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                <MdFastfood size={18} />
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900 text-sm">
                                {item.name}
                              </span>
                              {item.description && (
                                <span className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                                  {item.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 uppercase tracking-wider border border-gray-200">
                            <FiTag size={10} /> {item.category}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4">
                          <span className="font-extrabold text-sm text-gray-900">
                            ₹{item.price.toFixed(2)}
                          </span>
                        </td>

                        {/* Availability Toggle */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleAvailability(item)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition cursor-pointer border ${
                              item.isAvailable
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                item.isAvailable ? "bg-emerald-500" : "bg-red-500"
                              }`}
                            />
                            {item.isAvailable ? "Available" : "Out of Stock"}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                              title="Edit Item"
                            >
                              <FiEdit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(item._id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete Item"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD ITEM MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100 space-y-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    Add Food Item
                  </h3>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                    Menu Expansion
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <FiX size={18} />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Item Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chicken Biryani, Butter Naan"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Category
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewCategoryMode(!isNewCategoryMode);
                          if (!isNewCategoryMode) {
                            setItemCategory("");
                          } else {
                            setItemCategory(categories[0] || "BIRIYANI");
                          }
                        }}
                        className="text-[11px] font-bold text-[#e02424] hover:underline cursor-pointer"
                      >
                        {isNewCategoryMode ? "← Choose Existing" : "+ New Category"}
                      </button>
                    </div>

                    {isNewCategoryMode ? (
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="Type new category..."
                        value={itemCategory}
                        onChange={(e) => setItemCategory(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424]"
                      />
                    ) : (
                      <select
                        required
                        value={itemCategory}
                        onChange={(e) => {
                          if (e.target.value === "__NEW__") {
                            setIsNewCategoryMode(true);
                            setItemCategory("");
                          } else {
                            setItemCategory(e.target.value);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424] cursor-pointer"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="__NEW__">+ Add New Category...</option>
                      </select>
                    )}

                    {/* Quick Category Chips */}
                    {!isNewCategoryMode && categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {categories.slice(0, 6).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setItemCategory(cat)}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                              itemCategory === cat
                                ? "bg-[#e02424] text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 199.00"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of dish, spices, or allergens"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424]"
                  />
                </div>

                {/* Dish Photo / Image (Cloudflare R2) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Dish Photo (Cloudflare R2)
                    </label>
                    {itemImageUrl && (
                      <button
                        type="button"
                        onClick={() => setItemImageUrl("")}
                        className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                      {itemImageUrl ? (
                        <img
                          src={itemImageUrl}
                          alt="Dish Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <MdFastfood size={24} className="text-gray-300" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e02424] hover:bg-[#c81e1e] text-white rounded-lg text-xs font-bold cursor-pointer transition">
                          <FiUploadCloud size={14} />
                          <span>{uploadingImage ? "Uploading..." : itemImageUrl ? "Change Photo" : "Upload to R2"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleItemImageUpload}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[10px] text-gray-400">Max 10MB</span>
                      </div>
                      <input
                        type="url"
                        placeholder="Or paste image URL directly..."
                        value={itemImageUrl}
                        onChange={(e) => setItemImageUrl(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-xs font-bold text-gray-800">
                    Immediately Available (In Stock)
                  </span>
                  <input
                    type="checkbox"
                    checked={itemAvailable}
                    onChange={(e) => setItemAvailable(e.target.checked)}
                    className="w-4 h-4 accent-[#e02424] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-[#e02424] text-white rounded-xl text-xs font-bold hover:bg-red-700 transition shadow-xs"
                  >
                    {isSubmitting ? "Adding..." : "Add to Menu"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT ITEM MODAL */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100 space-y-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    Edit Food Item
                  </h3>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                    Update Details
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <FiX size={18} />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleUpdateItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Item Name
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Category
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewCategoryMode(!isNewCategoryMode);
                          if (!isNewCategoryMode) {
                            setItemCategory("");
                          } else {
                            setItemCategory(editingItem?.category || categories[0] || "BIRIYANI");
                          }
                        }}
                        className="text-[11px] font-bold text-[#e02424] hover:underline cursor-pointer"
                      >
                        {isNewCategoryMode ? "← Choose Existing" : "+ New Category"}
                      </button>
                    </div>

                    {isNewCategoryMode ? (
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="Type new category..."
                        value={itemCategory}
                        onChange={(e) => setItemCategory(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424]"
                      />
                    ) : (
                      <select
                        required
                        value={itemCategory}
                        onChange={(e) => {
                          if (e.target.value === "__NEW__") {
                            setIsNewCategoryMode(true);
                            setItemCategory("");
                          } else {
                            setItemCategory(e.target.value);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424] cursor-pointer"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="__NEW__">+ Add New Category...</option>
                      </select>
                    )}

                    {/* Quick Category Chips */}
                    {!isNewCategoryMode && categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {categories.slice(0, 6).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setItemCategory(cat)}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                              itemCategory === cat
                                ? "bg-[#e02424] text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424]"
                  />
                </div>

                {/* Dish Photo / Image (Cloudflare R2) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Dish Photo (Cloudflare R2)
                    </label>
                    {itemImageUrl && (
                      <button
                        type="button"
                        onClick={() => setItemImageUrl("")}
                        className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                      {itemImageUrl ? (
                        <img
                          src={itemImageUrl}
                          alt="Dish Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <MdFastfood size={24} className="text-gray-300" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e02424] hover:bg-[#c81e1e] text-white rounded-lg text-xs font-bold cursor-pointer transition">
                          <FiUploadCloud size={14} />
                          <span>{uploadingImage ? "Uploading..." : itemImageUrl ? "Change Photo" : "Upload to R2"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleItemImageUpload}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[10px] text-gray-400">Max 10MB</span>
                      </div>
                      <input
                        type="url"
                        placeholder="Or paste image URL directly..."
                        value={itemImageUrl}
                        onChange={(e) => setItemImageUrl(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-xs font-bold text-gray-800">
                    Available (In Stock)
                  </span>
                  <input
                    type="checkbox"
                    checked={itemAvailable}
                    onChange={(e) => setItemAvailable(e.target.checked)}
                    className="w-4 h-4 accent-[#e02424] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-[#e02424] text-white rounded-xl text-xs font-bold hover:bg-red-700 transition shadow-xs"
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEW CATEGORY MODAL */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    New Category
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                    Classification
                  </p>
                </div>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STARTERS, SOUPS, SEAFOOD"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#e02424]/20 focus:border-[#e02424]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#e02424] text-white rounded-xl text-xs font-bold hover:bg-red-700 transition shadow-xs"
                  >
                    Continue to Add Dish
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 text-[#e02424] flex items-center justify-center mx-auto text-xl">
                <FiTrash2 />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">
                  Delete Dish?
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Are you sure you want to delete this menu item? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(deleteConfirmId)}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
