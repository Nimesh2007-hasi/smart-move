"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

type Maintenance = {
  MAINTENANCE_ID: number;
  VEHICLE_ID: number;
  REG_NUMBER: string;
  SERVICE_DATE: string;
  COST: number;
  DESCRIPTION: string | null;
};

type Vehicle = {
  VEHICLE_ID: number;
  REG_NUMBER: string;
  STATUS: string;
};

const labelClass = "mb-2 block text-sm font-medium text-[#44506a]";
const inputClass = "neu-input w-full px-4 py-3";

async function readJson(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export default function MaintenancePage() {
  const [records, setRecords] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [cost, setCost] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [maintenanceData, vehicleData] = await Promise.all([
        fetch("/api/maintenance", { cache: "no-store" }).then(readJson),
        fetch("/api/vehicles", { cache: "no-store" }).then(readJson),
      ]);

      setRecords(maintenanceData);
      setVehicles(vehicleData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load maintenance data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function resetForm() {
    setEditingId(null);
    setVehicleId("");
    setServiceDate(new Date().toISOString().slice(0, 10));
    setCost("");
    setDescription("");
    setShowForm(false);
  }

  function startAdd() {
    resetForm();
    setShowForm(true);
  }

  function startEdit(item: Maintenance) {
    setEditingId(item.MAINTENANCE_ID);
    setVehicleId(String(item.VEHICLE_ID));
    setServiceDate(item.SERVICE_DATE?.slice(0, 10) || "");
    setCost(String(item.COST));
    setDescription(item.DESCRIPTION ?? "");
    setShowForm(true);
    setError("");
  }

  async function saveMaintenance(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/maintenance", {
        method: editingId === null ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingId !== null && { maintenance_id: editingId }),
          vehicle_id: Number(vehicleId),
          service_date: serviceDate,
          cost: Number(cost),
          description,
        }),
      });

      await readJson(response);
      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save maintenance record.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMaintenance(id: number) {
    if (!window.confirm("Delete this maintenance record?")) return;

    setError("");
    try {
      await readJson(
        await fetch(`/api/maintenance?id=${id}`, { method: "DELETE" })
      );
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete record.");
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
              <h1 className="text-3xl font-bold text-[#44506a]">Maintenance</h1>
              <p className="mt-2 text-[#7a869a]">
                Manage vehicle maintenance records.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => void loadData()} className="neu-btn px-5 py-3">
                Refresh
              </button>
              <button onClick={startAdd} className="neu-btn px-5 py-3 text-indigo-600">
                + Add Maintenance
              </button>
            </div>
          </div>

          {error && (
            <div className="neu-flat mt-6 p-4 text-red-600">{error}</div>
          )}

          {showForm && (
            <section className="neu-flat mt-8 p-6">
              <h2 className="text-xl font-semibold text-[#44506a]">
                {editingId === null ? "Add Maintenance Record" : `Edit Maintenance #${editingId}`}
              </h2>

              <form onSubmit={saveMaintenance} className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Vehicle</label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="">Select vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.VEHICLE_ID} value={vehicle.VEHICLE_ID}>
                        {vehicle.REG_NUMBER} ({vehicle.STATUS})
                      </option>
                    ))}
                  </select>
                  {vehicles.length === 0 && (
                    <p className="mt-2 text-sm text-[#7a869a]">
                      Add a vehicle before recording maintenance.
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Maintenance Date</label>
                  <input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Cost (LKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    required
                    className={inputClass}
                    placeholder="Example: 25000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                    rows={4}
                    className={inputClass}
                    placeholder="Describe the maintenance work..."
                  />
                  <p className="mt-1 text-sm text-[#7a869a]">
                    Optional, up to 500 characters.
                  </p>
                </div>

                <div className="flex items-end gap-3">
                  <button
                    disabled={saving || vehicles.length === 0}
                    type="submit"
                    className="neu-btn px-5 py-3 text-indigo-600 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Record"}
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
              <h2 className="text-xl font-semibold text-[#44506a]">
                Maintenance Records
              </h2>
            </div>

            <div className="overflow-x-auto px-6 pb-6">
              <div className="neu-pressed overflow-hidden">
                <table className="neu-table w-full">
                  <thead>
                    <tr className="text-left text-sm text-[#7a869a]">
                      {["ID", "Vehicle", "Date", "Description", "Cost", "Action"].map((heading) => (
                        <th key={heading} className="px-6 py-4 font-semibold">{heading}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {!loading && records.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-[#7a869a]">
                          No maintenance records found.
                        </td>
                      </tr>
                    )}

                    {records.map((item) => (
                      <tr key={item.MAINTENANCE_ID}>
                        <td className="px-6 py-4">{item.MAINTENANCE_ID}</td>
                        <td className="px-6 py-4 font-medium">{item.REG_NUMBER}</td>
                        <td className="px-6 py-4">{item.SERVICE_DATE}</td>
                        <td className="max-w-sm whitespace-normal px-6 py-4">
                          {item.DESCRIPTION || "—"}
                        </td>
                        <td className="px-6 py-4">
                          LKR {Number(item.COST).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(item)} className="neu-btn px-3 py-2 text-sm text-indigo-600">
                              Edit
                            </button>
                            <button onClick={() => void deleteMaintenance(item.MAINTENANCE_ID)} className="neu-btn px-3 py-2 text-sm text-red-500">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {loading && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-[#7a869a]">
                          Loading maintenance records...
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