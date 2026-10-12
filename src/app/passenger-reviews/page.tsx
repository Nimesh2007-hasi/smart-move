"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

type Review = {
  _id: string;
  passengerId: number;
  tripId: number;
  rating: number;
  comment: string;
  status: string;
  createdAt?: string;
};

const blank = {
  passengerId: "1",
  tripId: "1",
  rating: "5",
  comment: "",
  status: "PUBLISHED",
};

export default function PassengerReviewsPage() {
  const [items, setItems] = useState<Review[]>([]);
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
      const res = await fetch("/api/reviews", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load reviews.");
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load reviews.");
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

  function edit(item: Review) {
    setEditId(item._id);
    setForm({
      passengerId: String(item.passengerId),
      tripId: String(item.tripId),
      rating: String(item.rating),
      comment: item.comment,
      status: item.status || "PUBLISHED",
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
      const res = await fetch("/api/reviews", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          passengerId: Number(form.passengerId),
          tripId: Number(form.tripId),
          rating: Number(form.rating),
          id: editId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed.");
      setShowForm(false);
      setEditId(null);
      setSuccess(editId ? "Review updated." : "Review added.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this passenger review?")) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/reviews?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed.");
      setSuccess("Review deleted.");
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
              <h1 className="text-3xl font-bold text-[#44506a]">Passenger Reviews</h1>
              <p className="mt-2 text-[#7a869a]">Manage passenger feedback in MongoDB.</p>
            </div>
            <button onClick={addNew} className="neu-btn px-6 py-3">+ Add Review</button>
          </div>

          {error && <p className="mt-5 rounded-lg border border-red-300 p-4 text-red-600">{error}</p>}
          {success && <p className="mt-5 rounded-lg border border-green-300 p-4 text-green-700">{success}</p>}

          {showForm && (
            <form onSubmit={save} className="neu-flat mt-8 space-y-5 p-6">
              <h2 className="text-xl font-semibold">{editId ? "Edit Review" : "Add Review"}</h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block">Passenger ID *</label>
                  <input type="number" min="1" required value={form.passengerId}
                    onChange={e => setForm({ ...form, passengerId: e.target.value })}
                    className="neu-input w-full px-4 py-3" />
                </div>
                <div>
                  <label className="mb-2 block">Trip ID *</label>
                  <input type="number" min="1" required value={form.tripId}
                    onChange={e => setForm({ ...form, tripId: e.target.value })}
                    className="neu-input w-full px-4 py-3" />
                </div>
                <div>
                  <label className="mb-2 block">Rating *</label>
                  <select required value={form.rating}
                    onChange={e => setForm({ ...form, rating: e.target.value })}
                    className="neu-input w-full px-4 py-3">
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Very good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Poor</option>
                    <option value="1">1 - Very poor</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block">Status</label>
                  <select value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="neu-input w-full px-4 py-3">
                    <option value="PUBLISHED">Published</option>
                    <option value="HIDDEN">Hidden</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block">Comment *</label>
                <textarea required maxLength={1000} rows={4} value={form.comment}
                  onChange={e => setForm({ ...form, comment: e.target.value })}
                  className="neu-input w-full px-4 py-3" />
              </div>

              <div className="flex gap-3">
                <button disabled={saving} className="neu-btn px-6 py-3 disabled:opacity-50">
                  {saving ? "Saving..." : editId ? "Update Review" : "Save Review"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="neu-btn px-6 py-3">Cancel</button>
              </div>
            </form>
          )}

          <div className="neu-flat mt-8 overflow-x-auto p-6">
            <h2 className="text-xl font-semibold">Review Records ({items.length})</h2>
            {loading ? <p className="py-8">Loading...</p> : (
              <table className="neu-table mt-5 w-full min-w-[900px]">
                <thead><tr className="text-left text-sm text-[#7a869a]">
                  <th className="px-4 py-4">Passenger ID</th>
                  <th className="px-4 py-4">Trip ID</th>
                  <th className="px-4 py-4">Rating</th>
                  <th className="px-4 py-4">Comment</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Actions</th>
                </tr></thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item._id}>
                      <td className="px-4 py-4">{item.passengerId}</td>
                      <td className="px-4 py-4">{item.tripId}</td>
                      <td className="px-4 py-4">{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</td>
                      <td className="max-w-xs px-4 py-4">{item.comment}</td>
                      <td className="px-4 py-4">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-4">{item.status}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => edit(item)} className="neu-btn px-3 py-2">Edit</button>
                          <button onClick={() => void remove(item._id)} className="neu-btn px-3 py-2 text-red-600">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!items.length && !loading && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center">No reviews found.</td></tr>
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