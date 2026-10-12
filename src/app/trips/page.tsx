
"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

type Trip = {
  TRIP_ID: number;
  VEHICLE_ID: number;
  REG_NUMBER: string;
  DRIVER_ID: number;
  DRIVER_NAME: string;
  ROUTE_ID: number;
  ORIGIN: string;
  DESTINATION: string;
  FARE: number;
  DEPARTURE_TIME: string;
  ARRIVAL_TIME: string | null;
  STATUS: string;
  AVAILABLE_SEATS: number;
};

type Vehicle = {
  VEHICLE_ID: number;
  REG_NUMBER: string;
  STATUS: string;
  CAPACITY: number;
};

type Driver = {
  DRIVER_ID: number;
  NAME: string;
  STATUS: string;
};

type RouteRecord = {
  ROUTE_ID: number;
  ORIGIN: string;
  DESTINATION: string;
  DISTANCE_KM: number;
};

const statuses = ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"];

function badgeClass(status: string) {
  if (status === "SCHEDULED") return "neu-badge neu-badge-active";
  if (status === "COMPLETED") return "neu-badge neu-badge-inactive";
  if (status === "CANCELLED") return "neu-badge neu-badge-maintenance";
  return "neu-badge";
}

function displayStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatLKR(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);

  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<RouteRecord[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [status, setStatus] = useState("SCHEDULED");
  const [fare, setFare] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const labelClass = "mb-2 block text-sm font-medium text-[#44506a]";
  const inputClass = "neu-input w-full px-4 py-3";

  const readJson = async (response: Response) => {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    return data;
  };

  const loadTrips = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [tripResponse, vehicleResponse, driverResponse, routeResponse] =
        await Promise.all([
          fetch("/api/trips?view=admin", { cache: "no-store" }),
          fetch("/api/vehicles", { cache: "no-store" }),
          fetch("/api/drivers", { cache: "no-store" }),
          fetch("/api/routes", { cache: "no-store" }),
        ]);

      const [tripData, vehicleData, driverData, routeData] =
        await Promise.all([
          readJson(tripResponse),
          readJson(vehicleResponse),
          readJson(driverResponse),
          readJson(routeResponse),
        ]);

      setTrips(tripData);
      setVehicles(vehicleData);
      setDrivers(driverData);
      setRoutes(routeData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load trip data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  function resetForm() {
    setVehicleId("");
    setDriverId("");
    setRouteId("");
    setDepartureTime("");
    setArrivalTime("");
    setStatus("SCHEDULED");
    setFare("");
    setEditingId(null);
    setShowForm(false);
  }

  function startAdd() {
    resetForm();
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function startEdit(trip: Trip) {
    setEditingId(trip.TRIP_ID);
    setVehicleId(String(trip.VEHICLE_ID));
    setDriverId(String(trip.DRIVER_ID));
    setRouteId(String(trip.ROUTE_ID));
    setDepartureTime(trip.DEPARTURE_TIME ?? "");
    setArrivalTime(trip.ARRIVAL_TIME ?? "");
    setStatus(trip.STATUS);
    setFare(String(trip.FARE ?? ""));
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  async function saveTrip(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const fareValue = Number(fare);

    if (!Number.isFinite(fareValue) || fareValue <= 0) {
      setError("Please enter a fare greater than zero.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const isEditing = editingId !== null;

      const response = await fetch("/api/trips", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? { trip_id: editingId } : {}),
          vehicle_id: Number(vehicleId),
          driver_id: Number(driverId),
          route_id: Number(routeId),
          departure_time: departureTime,
          arrival_time: arrivalTime || null,
          status,
          fare: fareValue,
        }),
      });

      await readJson(response);

      resetForm();

      setSuccess(
        isEditing
          ? "Trip updated successfully."
          : "Trip created successfully."
      );

      await loadTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save trip.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTrip(id: number) {
    if (!window.confirm("Are you sure you want to delete this trip?")) {
      return;
    }

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/trips?id=${id}`, {
        method: "DELETE",
      });

      await readJson(response);

      setSuccess("Trip deleted successfully.");
      await loadTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete trip.");
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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#44506a]">Trips</h1>
              <p className="mt-2 text-[#7a869a]">
                Schedule and manage Smart Move trips.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => void loadTrips()}
                disabled={loading}
                className="neu-btn px-5 py-3 disabled:opacity-50"
              >
                {loading ? "Loading..." : "↻ Refresh"}
              </button>

              <button
                onClick={startAdd}
                className="neu-btn px-5 py-3 text-indigo-600"
              >
                + Add Trip
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="neu-flat mt-6 p-4 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="neu-flat mt-6 p-4 text-sm text-green-700"
            >
              {success}
            </div>
          )}

          {showForm && (
            <section className="neu-flat mt-8 p-6">
              <h2 className="text-xl font-semibold text-[#44506a]">
                {editingId !== null ? "Edit Trip" : "Schedule New Trip"}
              </h2>

              <form
                onSubmit={saveTrip}
                className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2"
              >
                <div>
                  <label className={labelClass} htmlFor="tripVehicle">
                    Vehicle *
                  </label>

                  <select
                    id="tripVehicle"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="">Select vehicle</option>

                    {vehicles
                      .filter(
                        (v) =>
                          v.STATUS === "ACTIVE" ||
                          String(v.VEHICLE_ID) === vehicleId
                      )
                      .map((v) => (
                        <option key={v.VEHICLE_ID} value={v.VEHICLE_ID}>
                          {v.REG_NUMBER} (capacity {v.CAPACITY})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="tripDriver">
                    Driver *
                  </label>

                  <select
                    id="tripDriver"
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="">Select driver</option>

                    {drivers
                      .filter(
                        (d) =>
                          d.STATUS === "ACTIVE" ||
                          String(d.DRIVER_ID) === driverId
                      )
                      .map((d) => (
                        <option key={d.DRIVER_ID} value={d.DRIVER_ID}>
                          {d.NAME}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="tripRoute">
                    Route *
                  </label>

                  <select
                    id="tripRoute"
                    value={routeId}
                    onChange={(e) => setRouteId(e.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="">Select route</option>

                    {routes.map((r) => (
                      <option key={r.ROUTE_ID} value={r.ROUTE_ID}>
                        {r.ORIGIN} - {r.DESTINATION}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="tripFare">
                    Fare per Passenger (LKR) *
                  </label>

                  <input
                    id="tripFare"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={fare}
                    onChange={(e) => setFare(e.target.value)}
                    placeholder="Enter fare, e.g. 850.00"
                    required
                    className={inputClass}
                  />

                  <p className="mt-2 text-xs text-[#7a869a]">
                    This fare is used as the ticket amount for this trip.
                  </p>
                </div>

                <div>
                  <label className={labelClass} htmlFor="tripDeparture">
                    Departure date and time *
                  </label>

                  <input
                    id="tripDeparture"
                    type="datetime-local"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="tripArrival">
                    Arrival date and time
                  </label>

                  <input
                    id="tripArrival"
                    type="datetime-local"
                    value={arrivalTime}
                    min={departureTime || undefined}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className={inputClass}
                  />

                  <p className="mt-2 text-xs text-[#7a869a]">
                    Optional; if entered, it must be later than departure.
                  </p>
                </div>

                <div>
                  <label className={labelClass} htmlFor="tripStatus">
                    Status *
                  </label>

                  <select
                    id="tripStatus"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    required
                    className={inputClass}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {displayStatus(s)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end gap-4 md:col-span-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="neu-btn px-5 py-3 text-indigo-600 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingId !== null
                        ? "Update Trip"
                        : "Save Trip"}
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className="neu-btn px-5 py-3 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="neu-flat mt-10 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-[#44506a]">
                Trip Schedule
              </h2>

              <p className="mt-1 text-sm text-[#7a869a]">
                Available seats are calculated from vehicle capacity and
                non-cancelled tickets.
              </p>
            </div>

            <div className="overflow-x-auto px-6 pb-6">
              <div className="neu-pressed overflow-hidden">
                <table className="neu-table w-full min-w-[1250px]">
                  <thead>
                    <tr className="text-left text-sm text-[#7a869a]">
                      {[
                        "ID",
                        "Vehicle",
                        "Driver",
                        "Route",
                        "Departure",
                        "Arrival",
                        "Fare (LKR)",
                        "Seats",
                        "Status",
                        "Actions",
                      ].map((h) => (
                        <th key={h} className="px-5 py-4 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {!loading && trips.length === 0 && (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-6 py-10 text-center text-[#7a869a]"
                        >
                          No trips found.
                        </td>
                      </tr>
                    )}

                    {trips.map((trip) => (
                      <tr key={trip.TRIP_ID}>
                        <td className="px-5 py-4">{trip.TRIP_ID}</td>

                        <td className="px-5 py-4 font-medium">
                          {trip.REG_NUMBER}
                        </td>

                        <td className="px-5 py-4">{trip.DRIVER_NAME}</td>

                        <td className="px-5 py-4">
                          {trip.ORIGIN} - {trip.DESTINATION}
                        </td>

                        <td className="px-5 py-4">
                          {trip.DEPARTURE_TIME?.replace("T", " ")}
                        </td>

                        <td className="px-5 py-4">
                          {trip.ARRIVAL_TIME?.replace("T", " ") || "—"}
                        </td>

                        <td className="px-5 py-4 font-medium">
                          {formatLKR(trip.FARE)}
                        </td>

                        <td className="px-5 py-4">
                          {trip.AVAILABLE_SEATS}
                        </td>

                        <td className="px-5 py-4">
                          <span className={badgeClass(trip.STATUS)}>
                            {displayStatus(trip.STATUS)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(trip)}
                              className="neu-btn px-3 py-2 text-sm text-indigo-600"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => void deleteTrip(trip.TRIP_ID)}
                              disabled={deletingId === trip.TRIP_ID}
                              className="neu-btn px-3 py-2 text-sm text-red-500 disabled:opacity-50"
                            >
                              {deletingId === trip.TRIP_ID
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {loading && (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-6 py-10 text-center text-[#7a869a]"
                        >
                          Loading trips from Oracle...
                        </td>
                      </tr>
                    )}
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
