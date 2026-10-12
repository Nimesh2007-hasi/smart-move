
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

type Driver = {
  DRIVER_ID: number;
  NAME: string;
  LICENSE_NO: string;
  CONTACT: string | null;
  STATUS: string;
};

function formatStatus(status: string) {
  if (status === "ON_LEAVE") return "On Leave";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function badgeClass(status: string) {
  if (status === "ACTIVE") return "neu-badge neu-badge-active";
  if (status === "ON_LEAVE") return "neu-badge neu-badge-maintenance";
  return "neu-badge neu-badge-inactive";
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const labelClass = "mb-2 block text-sm font-medium text-[#44506a]";
  const inputClass = "neu-input w-full px-4 py-3";

  // Load drivers from Oracle
  const loadDrivers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/drivers", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load drivers.");
      }

      setDrivers(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load drivers."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDrivers();
  }, [loadDrivers]);

  // Reset form and exit edit mode
  function resetForm() {
    setName("");
    setPhone("");
    setLicenseNo("");
    setStatus("ACTIVE");
    setEditingId(null);
    setShowForm(false);
  }

  // Open the form with the selected driver's details
  function startEdit(driver: Driver) {
    setEditingId(driver.DRIVER_ID);
    setName(driver.NAME);
    setPhone(driver.CONTACT ?? "");
    setLicenseNo(driver.LICENSE_NO);
    setStatus(driver.STATUS);
    setError("");
    setSuccess("");
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Save a new driver or update an existing driver
  async function saveDriver(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const isEditing = editingId !== null;

      const response = await fetch("/api/drivers", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(isEditing ? { driver_id: editingId } : {}),
          name: name.trim(),
          license_no: licenseNo.trim().toUpperCase(),
          contact: phone.trim(),
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save driver.");
      }

      resetForm();

      setSuccess(
        isEditing
          ? "Driver updated successfully."
          : "Driver added successfully."
      );

      await loadDrivers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save driver."
      );
    } finally {
      setSaving(false);
    }
  }

  // Delete a driver from Oracle
  async function deleteDriver(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this driver?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(id);

    try {
      const response = await fetch(`/api/drivers?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete driver.");
      }

      setSuccess("Driver deleted successfully.");
      await loadDrivers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete driver."
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
                Drivers
              </h1>
              <p className="mt-2 text-[#7a869a]">
                Manage Smart Move drivers.
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
              + Add Driver
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

          {/* Add / Edit Driver Form */}
          {showForm && (
            <div className="neu-flat mt-8 p-6">
              <h2 className="text-xl font-semibold text-[#44506a]">
                {editingId !== null ? "Edit Driver" : "Add New Driver"}
              </h2>

              <form
                onSubmit={saveDriver}
                className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2"
              >
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                    className={inputClass}
                    placeholder="Enter driver's full name"
                  />
                </div>

                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={20}
                    className={inputClass}
                    placeholder="0771234567"
                  />
                </div>

                <div>
                  <label className={labelClass}>License Number</label>
                  <input
                    type="text"
                    value={licenseNo}
                    onChange={(e) => setLicenseNo(e.target.value)}
                    required
                    maxLength={30}
                    className={inputClass}
                    placeholder="Example: B1234567"
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
                    <option value="ON_LEAVE">On Leave</option>
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
                        ? "Update Driver"
                        : "Save Driver"}
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

          {/* Driver Table */}
          <div className="neu-flat mt-10 overflow-hidden">
            <div className="flex items-center justify-between p-6">
              <h2 className="text-xl font-semibold text-[#44506a]">
                Driver List
              </h2>

              <button
                onClick={() => void loadDrivers()}
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
                        "Name",
                        "Phone",
                        "License",
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
                          Loading drivers from Oracle...
                        </td>
                      </tr>
                    ) : drivers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-[#7a869a]"
                        >
                          No drivers found. Add your first driver.
                        </td>
                      </tr>
                    ) : (
                      drivers.map((driver) => (
                        <tr key={driver.DRIVER_ID}>
                          <td className="px-6 py-4">
                            {driver.DRIVER_ID}
                          </td>

                          <td className="px-6 py-4 font-medium">
                            {driver.NAME}
                          </td>

                          <td className="px-6 py-4">
                            {driver.CONTACT || "—"}
                          </td>

                          <td className="px-6 py-4">
                            {driver.LICENSE_NO}
                          </td>

                          <td className="px-6 py-4">
                            <span className={badgeClass(driver.STATUS)}>
                              {formatStatus(driver.STATUS)}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex gap-3">
                              <button
                                onClick={() => startEdit(driver)}
                                disabled={
                                  saving || deletingId !== null
                                }
                                className="neu-btn px-4 py-2 text-sm text-indigo-600 disabled:opacity-50"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() =>
                                  void deleteDriver(driver.DRIVER_ID)
                                }
                                disabled={
                                  deletingId !== null || saving
                                }
                                className="neu-btn px-4 py-2 text-sm text-red-500 disabled:opacity-50"
                              >
                                {deletingId === driver.DRIVER_ID
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