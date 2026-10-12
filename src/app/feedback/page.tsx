"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

type Feedback = {
  FEEDBACK_ID: number;
  PASSENGER_ID: number;
  PASSENGER_NAME: string;
  TRIP_ID: number;
  ORIGIN: string;
  DESTINATION: string;
  RATING: number;
  COMMENTS: string | null;
};

type Passenger = { PASSENGER_ID: number; NAME: string };
type Trip = {
  TRIP_ID: number;
  ORIGIN: string;
  DESTINATION: string;
  DEPARTURE_TIME: string;
  STATUS: string;
};

const labelClass = "mb-2 block text-sm font-medium text-[#44506a]";
const inputClass = "neu-input w-full px-4 py-3";

async function readJson(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

function renderStars(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [passengerId, setPassengerId] = useState("");
  const [tripId, setTripId] = useState("");
  const [rating, setRating] = useState("5");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [feedbackData, passengerData, tripData] = await Promise.all([
        fetch("/api/feedback", { cache: "no-store" }).then(readJson),
        fetch("/api/passengers", { cache: "no-store" }).then(readJson),
        fetch("/api/trips", { cache: "no-store" }).then(readJson),
      ]);

      setFeedback(feedbackData);
      setPassengers(passengerData);
      setTrips(tripData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load feedback.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function resetForm() {
    setEditingId(null);
    setPassengerId("");
    setTripId("");
    setRating("5");
    setComments("");
    setShowForm(false);
  }

  function startEdit(item: Feedback) {
    setEditingId(item.FEEDBACK_ID);
    setPassengerId(String(item.PASSENGER_ID));
    setTripId(String(item.TRIP_ID));
    setRating(String(item.RATING));
    setComments(item.COMMENTS ?? "");
    setShowForm(true);
    setError("");
  }

  async function saveFeedback(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await readJson(
        await fetch("/api/feedback", {
          method: editingId === null ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(editingId !== null && { feedback_id: editingId }),
            passenger_id: Number(passengerId),
            trip_id: Number(tripId),
            rating: Number(rating),
            comments,
          }),
        })
      );

      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save feedback.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteFeedback(id: number) {
    if (!window.confirm("Delete this feedback record?")) return;

    try {
      await readJson(
        await fetch(`/api/feedback?id=${id}`, { method: "DELETE" })
      );
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete feedback.");
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
              <h1 className="text-3xl font-bold text-[#44506a]">Feedback</h1>
              <p className="mt-2 text-[#7a869a]">
                Manage passenger ratings and comments.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => void loadData()} className="neu-btn px-5 py-3">
                Refresh
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="neu-btn px-5 py-3 text-indigo-600"
              >
                + Add Feedback
              </button>
            </div>
          </div>

          {error && (
            <div className="neu-flat mt-6 p-4 text-red-600">{error}</div>
          )}

          {showForm && (
            <section className="neu-flat mt-8 p-6">
              <h2 className="text-xl font-semibold text-[#44506a]">
                {editingId === null ? "Add Passenger Feedback" : `Edit Feedback #${editingId}`}
              </h2>

              <form onSubmit={saveFeedback} className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Passenger</label>
                  <select
                    value={passengerId}
                    onChange={(e) => setPassengerId(e.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="">Select passenger</option>
                    {passengers.map((p) => (
                      <option key={p.PASSENGER_ID} value={p.PASSENGER_ID}>
                        {p.NAME}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Trip</label>
                  <select
                    value={tripId}
                    onChange={(e) => setTripId(e.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="">Select trip</option>
                    {trips.map((t) => (
                      <option key={t.TRIP_ID} value={t.TRIP_ID}>
                        #{t.TRIP_ID} — {t.ORIGIN} to {t.DESTINATION} ({t.DEPARTURE_TIME})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Rating</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className={inputClass}
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Poor</option>
                    <option value="1">1 - Very Poor</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Comment</label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    maxLength={1000}
                    rows={4}
                    className={inputClass}
                    placeholder="Enter passenger feedback..."
                  />
                </div>

                <div className="flex items-end gap-3">
                  <button
                    type="submit"
                    disabled={saving || passengers.length === 0 || trips.length === 0}
                    className="neu-btn px-5 py-3 text-indigo-600 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Feedback"}
                  </button>
                  <button type="button" onClick={resetForm} className="neu-btn px-5 py-3">
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="neu-flat mt-10 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-[#44506a]">Passenger Feedback</h2>
            </div>

            <div className="overflow-x-auto px-6 pb-6">
              <div className="neu-pressed overflow-hidden">
                <table className="neu-table w-full">
                  <thead>
                    <tr className="text-left text-sm text-[#7a869a]">
                      {["ID", "Passenger", "Trip", "Rating", "Comment", "Action"].map((heading) => (
                        <th key={heading} className="px-6 py-4 font-semibold">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr><td colSpan={6} className="px-6 py-8 text-center">Loading feedback...</td></tr>
                    )}
                    {!loading && feedback.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-[#7a869a]">No feedback records found.</td></tr>
                    )}
                    {feedback.map((item) => (
                      <tr key={item.FEEDBACK_ID}>
                        <td className="px-6 py-4">{item.FEEDBACK_ID}</td>
                        <td className="px-6 py-4 font-medium">{item.PASSENGER_NAME}</td>
                        <td className="px-6 py-4">{item.ORIGIN} - {item.DESTINATION}</td>
                        <td className="px-6 py-4 font-medium text-amber-600">{renderStars(Number(item.RATING))}</td>
                        <td className="max-w-xs whitespace-normal px-6 py-4">{item.COMMENTS || "—"}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(item)} className="neu-btn px-3 py-2 text-sm text-indigo-600">Edit</button>
                            <button onClick={() => void deleteFeedback(item.FEEDBACK_ID)} className="neu-btn px-3 py-2 text-sm text-red-500">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}