
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

type Vehicle = {
  VEHICLE_ID: number;
  REG_NUMBER: string;
  TYPE: string;
  CAPACITY: number;
  STATUS: string;
};

function formatStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatType(type: string) {
  return type
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function badgeClass(status: string) {
  if (status === "ACTIVE") return "neu-badge neu-badge-active";
  if (status === "MAINTENANCE") return "neu-badge neu-badge-maintenance";
  return "neu-badge neu-badge-inactive";
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [registrationNo, setRegistrationNo] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [capacity, setCapacity] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const labelClass = "mb-2 block text-sm font-medium text-[#44506a]";
  const inputClass = "neu-input w-full px-4 py-3";

  // Load vehicles from Oracle through the API
  const loadVehicles = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/vehicles", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load vehicles.");
      }

      setVehicles(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load vehicles."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  // Reset the form
  function resetForm() {
    setRegistrationNo("");
    setVehicleType("");
    setCapacity("");
    setStatus("ACTIVE");
    setEditingId(null);
    setShowForm(false);
  }

  // Open the form with existing vehicle details
  function startEdit(vehicle: Vehicle) {
    setEditingId(vehicle.VEHICLE_ID);
    setRegistrationNo(vehicle.REG_NUMBER);
    setVehicleType(vehicle.TYPE);
    setCapacity(String(vehicle.CAPACITY));
    setStatus(vehicle.STATUS);
    setError("");
    setSuccess("");
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Add a new vehicle or update an existing vehicle
  async function saveVehicle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const isEditing = editingId !== null;

      const response = await fetch("/api/vehicles", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(isEditing ? { vehicle_id: editingId } : {}),
          reg_number: registrationNo.trim().toUpperCase(),
          type: vehicleType,
          capacity: Number(capacity),
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save vehicle.");
      }

      resetForm();

      setSuccess(
        isEditing
          ? "Vehicle updated successfully."
          : "Vehicle added successfully."
      );

      await loadVehicles();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save vehicle."
      );
    } finally {
      setSaving(false);
    }
  }

  // Delete a vehicle from Oracle
  async function deleteVehicle(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this vehicle?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(id);

    try {
      const response = await fetch(`/api/vehicles?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete vehicle.");
      }

      setSuccess("Vehicle deleted successfully.");
      await loadVehicles();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete vehicle."
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
                Vehicles
              </h1>
              <p className="mt-2 text-[#7a869a]">
                Manage Smart Move vehicles.
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
              + Add Vehicle
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="neu-flat-sm mt-6 p-4 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div
              role="status"
              className="neu-flat-sm mt-6 p-4 text-sm text-green-700"
            >
              {success}
            </div>
          )}

          {/* Add / Edit Vehicle Form */}
          {showForm && (
            <div className="neu-flat mt-8 p-6">
              <h2 className="text-xl font-semibold text-[#44506a]">
                {editingId !== null ? "Edit Vehicle" : "Add New Vehicle"}
              </h2>

              <form
                onSubmit={saveVehicle}
                className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2"
              >
                <div>
                  <label className={labelClass}>
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={registrationNo}
                    onChange={(e) => setRegistrationNo(e.target.value)}
                    required
                    maxLength={20}
                    className={inputClass}
                    placeholder="Example: NB-1234"
                  />
                </div>

                <div>
                  <label className={labelClass}>Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="">Select Type</option>
                    <option value="BUS">Bus</option>
                    <option value="VAN">Van</option>
                    <option value="CAR">Car</option>
                    <option value="MINI_BUS">Mini Bus</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Capacity</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    required
                    min="1"
                    max="999"
                    step="1"
                    className={inputClass}
                    placeholder="Number of seats"
                  />
                </div>

                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={inputClass}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
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
                        ? "Update Vehicle"
                        : "Save Vehicle"}
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

          {/* Vehicle Table */}
          <div className="neu-flat mt-10 overflow-hidden">
            <div className="flex items-center justify-between p-6">
              <h2 className="text-xl font-semibold text-[#44506a]">
                Vehicle List
              </h2>

              <button
                onClick={() => void loadVehicles()}
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
                        "Registration No",
                        "Type",
                        "Capacity",
                        "Status",
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
                          colSpan={6}
                          className="px-6 py-8 text-center text-[#7a869a]"
                        >
                          Loading vehicles from Oracle...
                        </td>
                      </tr>
                    ) : vehicles.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-[#7a869a]"
                        >
                          No vehicles found. Add your first vehicle.
                        </td>
                      </tr>
                    ) : (
                      vehicles.map((vehicle) => (
                        <tr key={vehicle.VEHICLE_ID}>
                          <td className="px-6 py-4">
                            {vehicle.VEHICLE_ID}
                          </td>

                          <td className="px-6 py-4 font-medium">
                            {vehicle.REG_NUMBER}
                          </td>

                          <td className="px-6 py-4">
                            {formatType(vehicle.TYPE)}
                          </td>

                          <td className="px-6 py-4">
                            {vehicle.CAPACITY}
                          </td>

                          <td className="px-6 py-4">
                            <span className={badgeClass(vehicle.STATUS)}>
                              {formatStatus(vehicle.STATUS)}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex gap-3">
                              <button
                                onClick={() => startEdit(vehicle)}
                                disabled={
                                  saving || deletingId !== null
                                }
                                className="neu-btn px-4 py-2 text-sm text-indigo-600 disabled:opacity-50"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() =>
                                  void deleteVehicle(vehicle.VEHICLE_ID)
                                }
                                disabled={
                                  deletingId === vehicle.VEHICLE_ID ||
                                  deletingId !== null ||
                                  saving
                                }
                                className="neu-btn px-4 py-2 text-sm text-red-500 disabled:opacity-50"
                              >
                                {deletingId === vehicle.VEHICLE_ID
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