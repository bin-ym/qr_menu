"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Category = { id: string; name: string };
type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  is_available: boolean;
};

export default function ItemsPage() {
  const [venueId, setVenueId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editModelFile, setEditModelFile] = useState<File | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  async function loadData(vid: string) {
    setLoading(true);
    const [{ data: catData }, { data: itemData }] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name")
        .eq("venue_id", vid)
        .order("sort_order"),
      supabase
        .from("items")
        .select("*")
        .eq("venue_id", vid)
        .order("sort_order"),
    ]);
    setCategories(catData ?? []);
    setItems(itemData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    async function init() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("venue_id")
        .eq("id", userId)
        .single();

      if (profile?.venue_id) {
        setVenueId(profile.venue_id);
        loadData(profile.venue_id);
      }
    }
    init();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId) return;
    setError("");
    setSaving(true);
    setUploading(true);

    let photoUrl: string | null = null;
    let modelUrl: string | null = null;

    try {
      // Upload photo if provided
      if (photoFile) {
        const photoPath = `${venueId}/${Date.now()}_${photoFile.name}`;
        const { error: photoError } = await supabase.storage
          .from("item-photos")
          .upload(photoPath, photoFile);

        if (photoError)
          throw new Error(`Photo upload failed: ${photoError.message}`);

        const { data: photoPublic } = supabase.storage
          .from("item-photos")
          .getPublicUrl(photoPath);
        photoUrl = photoPublic.publicUrl;
      }

      // Upload 3D model if provided
      if (modelFile) {
        const modelPath = `${venueId}/${Date.now()}_${modelFile.name}`;
        const { error: modelError } = await supabase.storage
          .from("item-models")
          .upload(modelPath, modelFile);

        if (modelError)
          throw new Error(`Model upload failed: ${modelError.message}`);

        const { data: modelPublic } = supabase.storage
          .from("item-models")
          .getPublicUrl(modelPath);
        modelUrl = modelPublic.publicUrl;
      }
    } catch (uploadErr) {
      setError(
        uploadErr instanceof Error ? uploadErr.message : "Upload failed.",
      );
      setSaving(false);
      setUploading(false);
      return;
    }

    setUploading(false);

    // Insert the item with the uploaded file URLs
    const { error: insertError } = await supabase.from("items").insert({
      venue_id: venueId,
      name,
      description,
      price: parseFloat(price) || 0,
      category_id: categoryId || null,
      photo_url: photoUrl,
      model_url: modelUrl,
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setName("");
    setDescription("");
    setPrice("");
    setCategoryId("");
    setPhotoFile(null);
    setModelFile(null);
    setShowForm(false);
    loadData(venueId);
  }

  async function toggleAvailable(item: Item) {
    if (!venueId) return;
    await supabase
      .from("items")
      .update({ is_available: !item.is_available })
      .eq("id", item.id);
    loadData(venueId);
  }

  async function handleDelete(id: string) {
    if (!venueId) return;
    if (!confirm("Delete this item?")) return;
    await supabase.from("items").delete().eq("id", id);
    loadData(venueId);
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditDescription(item.description ?? "");
    setEditPrice(item.price.toString());
    setEditCategoryId(item.category_id ?? "");
    setEditPhotoFile(null);
    setEditModelFile(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(itemId: string) {
    if (!venueId) return;
    setEditSaving(true);
    setError("");

    let photoUrl: string | undefined;
    let modelUrl: string | undefined;

    try {
      if (editPhotoFile) {
        const photoPath = `${venueId}/${Date.now()}_${editPhotoFile.name}`;
        const { error: photoError } = await supabase.storage
          .from("item-photos")
          .upload(photoPath, editPhotoFile);
        if (photoError)
          throw new Error(`Photo upload failed: ${photoError.message}`);
        const { data: photoPublic } = supabase.storage
          .from("item-photos")
          .getPublicUrl(photoPath);
        photoUrl = photoPublic.publicUrl;
      }

      if (editModelFile) {
        const modelPath = `${venueId}/${Date.now()}_${editModelFile.name}`;
        const { error: modelError } = await supabase.storage
          .from("item-models")
          .upload(modelPath, editModelFile);
        if (modelError)
          throw new Error(`Model upload failed: ${modelError.message}`);
        const { data: modelPublic } = supabase.storage
          .from("item-models")
          .getPublicUrl(modelPath);
        modelUrl = modelPublic.publicUrl;
      }
    } catch (uploadErr) {
      setError(
        uploadErr instanceof Error ? uploadErr.message : "Upload failed.",
      );
      setEditSaving(false);
      return;
    }

    const updates: Record<string, unknown> = {
      name: editName,
      description: editDescription,
      price: parseFloat(editPrice) || 0,
      category_id: editCategoryId || null,
    };
    if (photoUrl) updates.photo_url = photoUrl;
    if (modelUrl) updates.model_url = modelUrl;

    const { error: updateError } = await supabase
      .from("items")
      .update(updates)
      .eq("id", itemId);

    setEditSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setEditingId(null);
    loadData(venueId);
  }

  function categoryName(id: string | null) {
    return categories.find((c) => c.id === id)?.name ?? "Uncategorized";
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Items</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={categories.length === 0}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {showForm ? "Cancel" : "+ New Item"}
        </button>
      </div>

      {categories.length === 0 && (
        <p className="mb-4 text-sm text-amber-600">
          Create at least one category first before adding items.
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-8 max-w-md rounded-lg border border-zinc-200 bg-white p-6"
        >
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mb-3 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />

          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="mb-3 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mb-3 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />

          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Price
          </label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="mb-4 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />

          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Photo (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            className="mb-3 w-full text-sm"
          />

          <label className="mb-1 block text-sm font-medium text-zinc-700">
            3D Model — .glb file (optional)
          </label>
          <input
            type="file"
            accept=".glb"
            onChange={(e) => setModelFile(e.target.files?.[0] ?? null)}
            className="mb-4 w-full text-sm"
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {uploading
              ? "Uploading files..."
              : saving
                ? "Saving..."
                : "Add Item"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-zinc-500">No items yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Available</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) =>
                editingId === item.id ? (
                  <tr
                    key={item.id}
                    className="border-b border-zinc-100 last:border-0 bg-zinc-50"
                  >
                    <td colSpan={5} className="px-4 py-4">
                      <div className="grid max-w-lg gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-zinc-700">
                            Name
                          </label>
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-zinc-700">
                            Category
                          </label>
                          <select
                            value={editCategoryId}
                            onChange={(e) => setEditCategoryId(e.target.value)}
                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                          >
                            <option value="">Uncategorized</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-zinc-700">
                            Description
                          </label>
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={2}
                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-zinc-700">
                            Price
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-zinc-700">
                            Replace Photo (optional)
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              setEditPhotoFile(e.target.files?.[0] ?? null)
                            }
                            className="w-full text-sm"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-zinc-700">
                            Replace 3D Model — .glb (optional)
                          </label>
                          <input
                            type="file"
                            accept=".glb"
                            onChange={(e) =>
                              setEditModelFile(e.target.files?.[0] ?? null)
                            }
                            className="w-full text-sm"
                          />
                        </div>

                        {error && (
                          <p className="text-sm text-red-600">{error}</p>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(item.id)}
                            disabled={editSaving}
                            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                          >
                            {editSaving ? "Saving..." : "Save Changes"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={item.id}
                    className="border-b border-zinc-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {categoryName(item.category_id)}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAvailable(item)}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.is_available
                            ? "bg-green-100 text-green-700"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {item.is_available ? "Available" : "Hidden"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => startEdit(item)}
                          className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-xs font-medium text-red-600 underline hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
