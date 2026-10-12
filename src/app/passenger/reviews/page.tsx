
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type EligibleTrip = {
  ticketId: number;
  tripId: number;
};

export default function PassengerReviewsPage() {
  const [trips, setTrips] = useState<EligibleTrip[]>([]);
  const [tripId, setTripId] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadTrips = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/passenger/reviews", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load your booked trips.");
      }

      const loadedTrips: EligibleTrip[] = data.trips ?? [];
      setTrips(loadedTrips);

      setTripId((current) => {
        if (loadedTrips.some((trip) => String(trip.tripId) === current)) {
          return current;
        }

        return loadedTrips.length ? String(loadedTrips[0].tripId) : "";
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load your booked trips."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (!tripId) {
        throw new Error("There are no eligible trips to review.");
      }

      const response = await fetch("/api/passenger/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: Number(tripId),
          rating: Number(rating),
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not submit your review.");
      }

      setMessage(data.message || "Review submitted successfully.");
      setComment("");
      setRating("5");

      await loadTrips();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not submit your review."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <section className="neu-flat rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-[#44506a]">
          Rate Your Trip
        </h1>

        <p className="mt-2 text-[#7a869a]">
          Share your experience with Smart Move.
        </p>

        {message && (
          <p
            role="status"
            className="mt-5 rounded-lg border border-green-300 p-3 text-green-700"
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-300 p-3 text-red-600"
          >
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-6 text-[#7a869a]">Loading your booked trips...</p>
        ) : trips.length === 0 ? (
          <div className="mt-6 rounded-xl border border-gray-200 p-4">
            <p className="font-medium text-[#44506a]">
              No trips available to review
            </p>
            <p className="mt-2 text-sm text-[#7a869a]">
              You need a non-cancelled booking that you have not reviewed yet.
              If you have a booking, refresh the list and try again.
            </p>
            <button
              type="button"
              onClick={() => void loadTrips()}
              className="neu-btn mt-4 px-4 py-2 text-indigo-600"
            >
              Refresh trips
            </button>
          </div>
        ) : (
          <form onSubmit={submitReview} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="tripId"
                className="mb-2 block text-sm font-medium text-[#44506a]"
              >
                Select a booked trip
              </label>

              <select
                id="tripId"
                required
                value={tripId}
                onChange={(event) => setTripId(event.target.value)}
                className="neu-input w-full px-4 py-3"
              >
                {trips.map((trip) => (
                  <option key={trip.tripId} value={trip.tripId}>
                    Trip {trip.tripId} (Booking #{trip.ticketId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="rating"
                className="mb-2 block text-sm font-medium text-[#44506a]"
              >
                Rating
              </label>

              <select
                id="rating"
                value={rating}
                onChange={(event) => setRating(event.target.value)}
                className="neu-input w-full px-4 py-3"
              >
                <option value="5">★★★★★ — Excellent</option>
                <option value="4">★★★★☆ — Very good</option>
                <option value="3">★★★☆☆ — Average</option>
                <option value="2">★★☆☆☆ — Poor</option>
                <option value="1">★☆☆☆☆ — Very poor</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="comment"
                className="mb-2 block text-sm font-medium text-[#44506a]"
              >
                Your feedback
              </label>

              <textarea
                id="comment"
                required
                minLength={1}
                maxLength={1000}
                rows={5}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                className="neu-input w-full px-4 py-3"
                placeholder="Tell us about your journey..."
              />

              <p className="mt-1 text-xs text-[#7a869a]">
                Maximum 1000 characters.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving || loading || !tripId}
              className="neu-btn w-full px-5 py-3 text-indigo-600 disabled:opacity-50"
            >
              {saving ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
