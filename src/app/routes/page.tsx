
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

type RouteRecord = {
  ROUTE_ID: number;
  ORIGIN: string;
  DESTINATION: string;
  DISTANCE_KM: number;
};

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [distanceKm, setDistanceKm] = useState("");

  const labelClass = "mb-2 block text-sm font-medium text-[#44506a]";
  const inputClass = "neu-input w-full px-4 py-3";

  // Fetch routes from Oracle
  const loadRoutes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/routes", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load routes.");
      }

      setRoutes(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load routes."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoutes();
  }, [loadRoutes]);

  // Reset the form
  function resetForm() {
    setStartLocation("");
    setEndLocation("");
    setDistanceKm("");
    setEditingId(null);
    setShowForm(false);
  }

  // Open the form with the selected route
  function startEdit(route: RouteRecord) {
    setEditingId(route.ROUTE_ID);
    setStartLocation(route.ORIGIN);
    setEndLocation(route.DESTINATION);
    setDistanceKm(String(route.DISTANCE_KM));
    setError("");
    setSuccess("");
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Add or update a route
  async function saveRoute(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const isEditing = editingId !== null;

      const response = await fetch("/api/routes", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(isEditing ? { route_id: editingId } : {}),
          origin: startLocation.trim(),
          destination: endLocation.trim(),
          distance_km: Number(distanceKm),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save route.");
      }

      resetForm();

      setSuccess(
        isEditing
          ? "Route updated successfully."
          : "Route added successfully."
      );

      await loadRoutes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save route."
      );
    } finally {
      setSaving(false);
    }
  }

  // Delete a route from Oracle
  async function deleteRoute(id: number) {
    if (!window.confirm("Are you sure you want to delete this route?")) {
      return;
    }

    setError("");
    setSuccess("");
    setDeletingId(id);

    try {
      const response = await fetch(`/api/routes?id=${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete route.");
      }

      setSuccess("Route deleted successfully.");
      await loadRoutes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete route."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen">
      <Sidebar />

      <div className="ml-64">
        <Header />

        <main className="p-8">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#44506a]">
                Routes
              </h1>
              <p className="mt-2 text-[#7a869a]">
                Manage Smart Move transportation routes.
              </p>
            </div>

            <button
              onClick={() => {
                resetForm();
                setError("");
                setSuccess("");
                setShowForm(true);
              }}
              className="neu-btn px-5 py-3 text-indigo-600"
            >
              + Add Route
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div
              role="alert"
              className="neu-flat-sm mt-6 p-4 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="neu-flat-sm mt-6 p-4 text-sm text-green-700"
            >
              {success}
            </div>
          )}

          {/* Add / Edit Form */}
          {showForm && (
            <div className="neu-flat mt-8 p-6">
              <h2 className="text-xl font-semibold text-[#44506a]">
                {editingId !== null ? "Edit Route" : "Add New Route"}
              </h2>

              <form
                onSubmit={saveRoute}
                className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2"
              >
                <div>
                  <label className={labelClass}>Start Location</label>
                  <input
                    type="text"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    required
                    maxLength={100}
                    className={inputClass}
                    placeholder="Example: Colombo"
                  />
                </div>

                <div>
                  <label className={labelClass}>End Location</label>
                  <input
                    type="text"
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                    required
                    maxLength={100}
                    className={inputClass}
                    placeholder="Example: Kandy"
                  />
                </div>

                <div>
                  <label className={labelClass}>Distance (km)</label>
                  <input
                    type="number"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    required
                    min="0.01"
                    max="999999.99"
                    step="0.01"
                    className={inputClass}
                    placeholder="Example: 115"
                  />
                </div>

                <div className="flex items-end gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="neu-btn px-5 py-3 text-indigo-600 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingId !== null
                        ? "Update Route"
                        : "Save Route"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setError("");
                    }}
                    disabled={saving}
                    className="neu-btn px-5 py-3 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Route Table */}
          <div className="neu-flat mt-10 overflow-hidden">
            <div className="flex items-center justify-between p-6">
              <h2 className="text-xl font-semibold text-[#44506a]">
                Route List
              </h2>

              <button
                onClick={() => void loadRoutes()}
                disabled={loading}
                className="neu-btn px-4 py-2 text-sm text-indigo-600 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            <div className="overflow-x-auto px-6 pb-6">
              <div className="neu-pressed overflow-hidden">
                <table className="neu-table w-full">
                  <thead>
                    <tr className="text-left text-sm text-[#7a869a]">
                      {[
                        "ID",
                        "Start",
                        "Destination",
                        "Distance",
                        "Action",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-6 py-4 font-semibold"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-[#7a869a]"
                        >
                          Loading routes from Oracle...
                        </td>
                      </tr>
                    ) : routes.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-[#7a869a]"
                        >
                          No routes found. Add your first route.
                        </td>
                      </tr>
                    ) : (
                      routes.map((route) => (
                        <tr key={route.ROUTE_ID}>
                          <td className="px-6 py-4">
                            {route.ROUTE_ID}
                          </td>

                          <td className="px-6 py-4 font-medium">
                            {route.ORIGIN}
                          </td>

                          <td className="px-6 py-4">
                            {route.DESTINATION}
                          </td>

                          <td className="px-6 py-4">
                            {Number(route.DISTANCE_KM).toLocaleString()} km
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex gap-3">
                              <button
                                onClick={() => startEdit(route)}
                                disabled={
                                  saving || deletingId !== null
                                }
                                className="neu-btn px-4 py-2 text-sm text-indigo-600 disabled:opacity-50"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() =>
                                  void deleteRoute(route.ROUTE_ID)
                                }
                                disabled={
                                  deletingId !== null || saving
                                }
                                className="neu-btn px-4 py-2 text-sm text-red-500 disabled:opacity-50"
                              >
                                {deletingId === route.ROUTE_ID
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}