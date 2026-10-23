"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { MOCK_PRODUCTS, Product } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
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
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAvailable, setFormAvailable] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormCategory("Bakery");
    setFormPrice("");
    setFormDescription("");
    setFormAvailable(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormPrice(product.price.toString());
    setFormDescription(product.description);
    setFormAvailable(product.isAvailable);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Product name is required.");
      return;
    }
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError("Please enter a valid price greater than $0.00.");
      return;
    }

    if (editingProduct) {
      // Local state update for demonstration
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: formName.trim(),
                category: formCategory.trim() || "General",
                price: priceNum,
                description: formDescription.trim(),
                isAvailable: formAvailable,
              }
            : p
        )
      );
      setSuccessNotice(`Updated "${formName}" in local session.`);
    } else {
      const newProduct: Product = {
        id: `prod-local-${Date.now()}`,
        name: formName.trim(),
        category: formCategory.trim() || "General",
        price: priceNum,
        description: formDescription.trim(),
        isAvailable: formAvailable,
        createdAt: new Date().toISOString(),
      };
      setProducts((prev) => [newProduct, ...prev]);
      setSuccessNotice(`Added "${formName}" to local session.`);
    }

    setIsModalOpen(false);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Remove "${name}" from this session? (Note: Database persistence connects in Phase 2)`)) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSuccessNotice(`Removed "${name}" from local session.`);
      setTimeout(() => setSuccessNotice(null), 3000);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Product Catalog"
        description="Manage merchandise, pricing, and fulfillment availability."
        action={
          <Button onClick={handleOpenAddModal} variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add New Product
          </Button>
        }
      />

      {/* Advisory Notice */}
      <div className="mb-6 rounded-xl bg-slate-100/80 p-3.5 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <AlertCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700">Phase 1 Frontend State: </span>
          Forms and search provide local interactive testing. Changes will reset on page reload until Supabase CRUD is wired in Phase 2.
        </div>
      </div>

      {successNotice && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
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
          Showing {filteredProducts.length} of {products.length} items
        </div>
      </div>

      {/* Products Display (Responsive Table on Desktop, Cards on Mobile) */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products matched your search"
          description={`No products found matching "${searchTerm}". Try adjusting your keywords or add a new item.`}
          action={
            <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>
              Clear Search
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Mobile Product Cards (hidden on md+) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredProducts.map((product) => (
              <Card key={product.id} compact className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block text-[10px] font-semibold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-sm mb-1">
                      {product.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{product.name}</h4>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(product.price)}</span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">{product.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                      product.isAvailable ? "text-emerald-700" : "text-slate-400"
                    }`}
                  >
                    {product.isAvailable ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    {product.isAvailable ? "In Stock" : "Unavailable"}
                  </span>

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

          {/* Desktop Table (hidden on mobile) */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{product.name}</div>
                      <div className="text-xs text-slate-400 line-clamp-1 max-w-md">{product.description}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        <Tag className="h-3 w-3 text-slate-400" />
                        {product.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          product.isAvailable ? "text-emerald-700" : "text-slate-400"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            product.isAvailable ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                        />
                        {product.isAvailable ? "Available" : "Disabled"}
                      </span>
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
        title={editingProduct ? "Edit Product" : "Add New Product"}
        description={
          editingProduct
            ? "Update merchandise details and pricing for this session."
            : "Fill in the product information to add it to the inventory catalog."
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
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
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
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is-available-check"
              checked={formAvailable}
              onChange={(e) => setFormAvailable(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="is-available-check" className="text-xs font-medium text-slate-700 cursor-pointer">
              Available for immediate dispatch orders
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingProduct ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
