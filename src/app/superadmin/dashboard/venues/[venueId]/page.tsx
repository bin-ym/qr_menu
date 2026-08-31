"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const VENUE_TYPES = ["restaurant", "hotel", "cafe", "bar", "other"];

type Venue = {
  id: string;
  name: string;
  address: string | null;
  type: string;
  is_active: boolean;
  created_at: string;
};

type AdminProfile = {
  id: string;
  email: string;
};

export default function VenueDetailsPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const router = useRouter();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [stats, setStats] = useState({ items: 0, categories: 0, tables: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // editable fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState("restaurant");

  async function loadData() {
    setLoading(true);

    const { data: venueData } = await supabase
      .from("venues")
      .select("*")
      .eq("id", venueId)
      .single();

    if (venueData) {
      setVenue(venueData);
      setName(venueData.name);
      setAddress(venueData.address ?? "");
      setType(venueData.type);
    }

    const { data: adminData } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("venue_id", venueId)
      .eq("role", "admin")
      .maybeSingle();
    setAdmin(adminData);

    const [
      { count: itemCount },
      { count: categoryCount },
      { count: tableCount },
    ] = await Promise.all([
      supabase
        .from("items")
        .select("*", { count: "exact", head: true })
        .eq("venue_id", venueId),
      supabase
        .from("categories")
        .select("*", { count: "exact", head: true })
        .eq("venue_id", venueId),
      supabase
        .from("venue_tables")
        .select("*", { count: "exact", head: true })
        .eq("venue_id", venueId),
    ]);

    setStats({
      items: itemCount ?? 0,
      categories: categoryCount ?? 0,
      tables: tableCount ?? 0,
    });

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [venueId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("venues")
      .update({ name, address, type })
      .eq("id", venueId);

    setSaving(false);
    setMessage(error ? error.message : "Saved.");
    if (!error) loadData();
  }

  async function toggleActive() {
    if (!venue) return;
    await supabase
      .from("venues")
      .update({ is_active: !venue.is_active })
      .eq("id", venueId);
    loadData();
  }

  async function sendPasswordReset() {
    if (!admin) return;
    const { error } = await supabase.auth.resetPasswordForEmail(admin.email);
    setMessage(
      error ? error.message : `Password reset email sent to ${admin.email}.`,
    );
  }
  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setCreatingAdmin(true);
    setMessage("");

    const res = await fetch("/api/admin/create-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: newAdminEmail,
        password: newAdminPassword,
        venueId,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      setMessage(result.error ?? "Failed to create admin.");
      setCreatingAdmin(false);
      return;
    }

    setNewAdminEmail("");
    setNewAdminPassword("");
    setCreatingAdmin(false);
    loadData();
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading...</p>;
  if (!venue) return <p className="text-sm text-red-600">Venue not found.</p>;

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.push("/superadmin/dashboard/venues")}
        className="mb-4 text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← Back to Venues
      </button>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">{venue.name}</h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            venue.is_active
              ? "bg-green-100 text-green-700"
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {venue.is_active ? "Active" : "Suspended"}
        </span>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 text-center">
          <p className="text-2xl font-semibold text-zinc-900">{stats.items}</p>
          <p className="text-xs text-zinc-500">Items</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 text-center">
          <p className="text-2xl font-semibold text-zinc-900">
            {stats.categories}
          </p>
          <p className="text-xs text-zinc-500">Categories</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 text-center">
          <p className="text-2xl font-semibold text-zinc-900">{stats.tables}</p>
          <p className="text-xs text-zinc-500">Tables</p>
        </div>
      </div>

      {/* Edit venue info */}
      <form
        onSubmit={handleSave}
        className="mb-6 rounded-lg border border-zinc-200 bg-white p-6"
      >
        <h2 className="mb-4 text-sm font-semibold text-zinc-900">Venue Info</h2>

        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-3 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="mb-3 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm capitalize"
        >
          {VENUE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Address
        </label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="mb-4 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={toggleActive}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            {venue.is_active ? "Suspend Venue" : "Reactivate Venue"}
          </button>
        </div>
      </form>

      {/* Admin account */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900">
          Admin Account
        </h2>
        {admin ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-700">{admin.email}</p>
            <button
              onClick={sendPasswordReset}
              className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
            >
              Send password reset
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-sm text-zinc-500">
              No admin account linked to this venue.
            </p>
            <form onSubmit={handleCreateAdmin} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  required
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={creatingAdmin}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {creatingAdmin ? "Creating..." : "Create Admin"}
              </button>
            </form>
          </div>
        )}
      </div>

      {message && <p className="mt-4 text-sm text-zinc-600">{message}</p>}
    </div>
  );
}
