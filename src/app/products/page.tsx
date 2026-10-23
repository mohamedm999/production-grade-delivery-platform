"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { DatabaseProduct } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Tag,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<DatabaseProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DatabaseProduct | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Bakery");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("10");
  const [formDescription, setFormDescription] = useState("");
  const [formAvailable, setFormAvailable] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setStatusNotice({ type: "error", message: `Supabase Error: ${error.message}` });
      } else {
        setProducts(data || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load products from Supabase.";
      setStatusNotice({ type: "error", message: msg });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormCategory("Bakery");
    setFormPrice("");
    setFormStock("20");
    setFormDescription("");
    setFormAvailable(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: DatabaseProduct) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategory(product.category || "General");
    setFormPrice(product.price.toString());
    setFormStock(product.stock.toString());
    setFormDescription(product.description || "");
    setFormAvailable(product.is_available);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Product name is required.");
      return;
    }
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError("Please enter a valid price greater than or equal to $0.00.");
      return;
    }
    const stockNum = parseInt(formStock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setFormError("Stock count must be a non-negative integer.");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const supabase = createClient();

      if (editingProduct) {
        // Real Supabase UPDATE
        const { error } = await supabase
          .from("products")
          .update({
            name: formName.trim(),
            category: formCategory.trim() || "General",
            price: priceNum,
            stock: stockNum,
            description: formDescription.trim() || null,
            is_available: formAvailable,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingProduct.id);

        if (error) throw error;
        setStatusNotice({ type: "success", message: `Updated "${formName}" in Supabase!` });
      } else {
        // Real Supabase INSERT
        const { error } = await supabase.from("products").insert({
          name: formName.trim(),
          category: formCategory.trim() || "General",
          price: priceNum,
          stock: stockNum,
          description: formDescription.trim() || null,
          is_available: formAvailable,
        });

        if (error) throw error;
        setStatusNotice({ type: "success", message: `Created "${formName}" in Supabase!` });
      }

      setIsModalOpen(false);
      await fetchProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Database write failed.";
      setFormError(msg);
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusNotice(null), 4000);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}" from Supabase?`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;

      setStatusNotice({ type: "success", message: `Deleted "${name}" from database.` });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete product.";
      setStatusNotice({ type: "error", message: msg });
    } finally {
      setTimeout(() => setStatusNotice(null), 4000);
    }
  };

  const handleToggleAvailability = async (product: DatabaseProduct) => {
    try {
      const supabase = createClient();
      const updatedStatus = !product.is_available;
      const { error } = await supabase
        .from("products")
        .update({ is_available: updatedStatus })
        .eq("id", product.id);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_available: updatedStatus } : p))
      );
      setStatusNotice({
        type: "success",
        message: `Marked "${product.name}" as ${updatedStatus ? "Available" : "Unavailable"}.`,
      });
      setTimeout(() => setStatusNotice(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update availability.";
      setStatusNotice({ type: "error", message: msg });
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Product Catalog"
        description="Live database records from Supabase PostgreSQL."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Supabase Live
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Button onClick={fetchProducts} variant="outline" size="sm" title="Refresh from database">
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button onClick={handleOpenAddModal} variant="primary" size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Product
            </Button>
          </div>
        }
      />

      {statusNotice && (
        <div
          className={`mb-4 rounded-lg p-3 text-xs font-medium flex items-center gap-2 border ${
            statusNotice.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {statusNotice.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{statusNotice.message}</span>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by title, category, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
          {isLoading ? "Querying Supabase..." : `Showing ${filteredProducts.length} of ${products.length} products`}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs text-slate-500">Loading products from Supabase database...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title={products.length === 0 ? "No products in Supabase database" : "No products matched your search"}
          description={
            products.length === 0
              ? "Your products table in Supabase is currently empty. Click below to add your first product."
              : `No products found matching "${searchTerm}". Try adjusting your keywords.`
          }
          action={
            products.length === 0 ? (
              <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add First Product
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Mobile Product Cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredProducts.map((product) => (
              <Card key={product.id} compact className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block text-[10px] font-semibold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-sm mb-1">
                      {product.category || "General"}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{product.name}</h4>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(product.price)}</span>
                </div>

                {product.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{product.description}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleToggleAvailability(product)}
                    className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${
                      product.is_available ? "text-emerald-700" : "text-slate-400"
                    }`}
                  >
                    {product.is_available ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    <span>{product.is_available ? "In Stock" : "Unavailable"}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditModal(product)}
                      aria-label={`Edit ${product.name}`}
                    >
                      <Edit2 className="h-3.5 w-3.5 text-slate-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      aria-label={`Delete ${product.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{product.name}</div>
                      {product.description && (
                        <div className="text-xs text-slate-400 line-clamp-1 max-w-md">{product.description}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        <Tag className="h-3 w-3 text-slate-400" />
                        {product.category || "General"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {product.stock} units
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleAvailability(product)}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          product.is_available ? "text-emerald-700" : "text-slate-400"
                        }`}
                        title="Click to toggle availability"
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            product.is_available ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                        />
                        {product.is_available ? "Available" : "Disabled"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                          title="Edit product"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Create / Edit Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Edit Product (Supabase)" : "Add Product to Supabase"}
        description={
          editingProduct
            ? "Updates will be saved directly into PostgreSQL database."
            : "New item will be inserted directly into your Supabase products table."
        }
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
              {formError}
            </div>
          )}

          <Input
            label="Product Name"
            placeholder="e.g. Organic Cold Brew Bottle"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            disabled={isSaving}
            required
          />

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                disabled={isSaving}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              >
                <option value="Bakery">Bakery</option>
                <option value="Beverages">Beverages</option>
                <option value="Produce">Produce</option>
                <option value="Pantry">Pantry</option>
                <option value="Prepared">Prepared Meals</option>
              </select>
            </div>

            <Input
              label="Price ($ USD)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              disabled={isSaving}
              required
            />

            <Input
              label="Stock"
              type="number"
              min="0"
              placeholder="10"
              value={formStock}
              onChange={(e) => setFormStock(e.target.value)}
              disabled={isSaving}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Description</label>
            <textarea
              rows={3}
              placeholder="Brief description of the product, ingredients or weight..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              disabled={isSaving}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is-available-check"
              checked={formAvailable}
              onChange={(e) => setFormAvailable(e.target.checked)}
              disabled={isSaving}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="is-available-check" className="text-xs font-medium text-slate-700 cursor-pointer">
              Available for immediate dispatch orders
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              {editingProduct ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
