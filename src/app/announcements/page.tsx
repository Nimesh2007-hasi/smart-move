"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

type Announcement = {
  _id: string;
  title: string;
  message: string;
  audience: string;
  type: string;
  published: boolean;
  createdAt?: string;
  expiresAt?: string | null;
};

const blank = {
  title: "",
  message: "",
  audience: "ALL",
  type: "GENERAL",
  published: true,
  expiresAt: "",
};

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/announcements", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load announcements.");
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load announcements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function addNew() {
    setEditId(null);
    setForm({ ...blank });
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function edit(item: Announcement) {
    setEditId(item._id);
    setForm({
      title: item.title,
      message: item.message,
      audience: item.audience || "ALL",
      type: item.type || "GENERAL",
      published: item.published,
      expiresAt: item.expiresAt ? item.expiresAt.slice(0, 10) : "",
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/announcements", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editId, expiresAt: form.expiresAt || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed.");

      setShowForm(false);
      setEditId(null);
      setSuccess(editId ? "Announcement updated." : "Announcement added.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this announcement?")) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/announcements?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed.");
      setSuccess("Announcement deleted.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#44506a]">Announcements</h1>
              <p className="mt-2 text-[#7a869a]">Manage notices stored in MongoDB.</p>
            </div>
            <button onClick={addNew} className="neu-btn px-6 py-3">+ Add Announcement</button>
          </div>

          {error && <p className="mt-5 rounded-lg border border-red-300 p-4 text-red-600">{error}</p>}
          {success && <p className="mt-5 rounded-lg border border-green-300 p-4 text-green-700">{success}</p>}

          {showForm && (
            <form onSubmit={save} className="neu-flat mt-8 space-y-5 p-6">
              <h2 className="text-xl font-semibold">{editId ? "Edit Announcement" : "Add Announcement"}</h2>

              <div>
                <label className="mb-2 block">Title *</label>
                <input required maxLength={150} value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="neu-input w-full px-4 py-3" />
              </div>

              <div>
                <label className="mb-2 block">Message *</label>
                <textarea required maxLength={5000} rows={4} value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="neu-input w-full px-4 py-3" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block">Audience</label>
                  <select value={form.audience}
                    onChange={e => setForm({ ...form, audience: e.target.value })}
                    className="neu-input w-full px-4 py-3">
                    <option value="ALL">Everyone</option>
                    <option value="PASSENGERS">Passengers</option>
                    <option value="DRIVERS">Drivers</option>
                    <option value="STAFF">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block">Type</label>
                  <select value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="neu-input w-full px-4 py-3">
                    <option value="GENERAL">General</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="PROMOTION">Promotion</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block">Expiry Date (optional)</label>
                  <input type="date" value={form.expiresAt}
                    onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                    className="neu-input w-full px-4 py-3" />
                </div>
              </div>

              <label className="flex items-center gap-3">
                <input type="checkbox" checked={form.published}
                  onChange={e => setForm({ ...form, published: e.target.checked })} />
                Publish announcement
              </label>

              <div className="flex gap-3">
                <button disabled={saving} className="neu-btn px-6 py-3 disabled:opacity-50">
                  {saving ? "Saving..." : editId ? "Update" : "Save"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="neu-btn px-6 py-3">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="neu-flat mt-8 overflow-x-auto p-6">
            <h2 className="text-xl font-semibold">Announcement Records ({items.length})</h2>
            {loading ? <p className="py-8">Loading...</p> : (
              <table className="neu-table mt-5 w-full min-w-[950px]">
                <thead><tr className="text-left text-sm text-[#7a869a]">
                  <th className="px-4 py-4">Title</th>
                  <th className="px-4 py-4">Audience</th>
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4">Published</th>
                  <th className="px-4 py-4">Created</th>
                  <th className="px-4 py-4">Expires</th>
                  <th className="px-4 py-4">Actions</th>
                </tr></thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item._id}>
                      <td className="px-4 py-4">
                        <div className="font-medium">{item.title}</div>
                        <p className="max-w-xs truncate text-sm text-[#7a869a]">{item.message}</p>
                      </td>
                      <td className="px-4 py-4">{item.audience}</td>
                      <td className="px-4 py-4">{item.type}</td>
                      <td className="px-4 py-4">{item.published ? "Yes" : "No"}</td>
                      <td className="px-4 py-4">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-4">{item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : "Never"}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => edit(item)} className="neu-btn px-3 py-2">Edit</button>
                          <button onClick={() => void remove(item._id)} className="neu-btn px-3 py-2 text-red-600">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!items.length && !loading && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center">No announcements found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}