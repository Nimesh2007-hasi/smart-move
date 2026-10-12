
"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

type Passenger = {
  PASSENGER_ID: number;
  NAME: string;
  EMAIL: string | null;
  CONTACT: string | null;
};

export default function PassengersPage() {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const labelClass = "mb-2 block text-sm font-medium text-[#44506a]";
  const inputClass = "neu-input w-full px-4 py-3";

  const loadPassengers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/passengers", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load passengers.");
      }

      setPassengers(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the passenger API."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPassengers();
  }, [loadPassengers]);

  function resetForm() {
    setName("");
    setEmail("");
    setContact("");
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(passenger: Passenger) {
    setEditingId(passenger.PASSENGER_ID);
    setName(passenger.NAME);
    setEmail(passenger.EMAIL ?? "");
    setContact(passenger.CONTACT ?? "");
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function startAdd() {
    resetForm();
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  async function savePassenger(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const isEditing = editingId !== null;

      const response = await fetch("/api/passengers", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(isEditing ? { passenger_id: editingId } : {}),
          name: name.trim(),
          email: email.trim(),
          contact: contact.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save passenger.");
      }

      resetForm();
      setSuccess(
        isEditing
          ? "Passenger updated successfully."
          : "Passenger added successfully."
      );

      await loadPassengers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save passenger."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deletePassenger(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this passenger?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/passengers?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete passenger.");
      }

      setSuccess("Passenger deleted successfully.");
      await loadPassengers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete passenger."
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
          {/* Page heading */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#44506a]">
                Passengers
              </h1>
              <p className="mt-2 text-[#7a869a]">
                Manage Smart Move passengers.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => void loadPassengers()}
                disabled={loading}
                className="neu-btn px-5 py-3 disabled:opacity-50"
              >
                {loading ? "Loading..." : "↻ Refresh"}
              </button>

              <button
                onClick={startAdd}
                className="neu-btn px-5 py-3 text-indigo-600"
              >
                + Add Passenger
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="neu-flat mt-6 p-4 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div
              role="status"
              className="neu-flat mt-6 p-4 text-sm text-green-700"
            >
              {success}
            </div>
          )}

          {/* Add/Edit form */}
          {showForm && (
            <section className="neu-flat mt-8 p-6">
              <h2 className="text-xl font-semibold text-[#44506a]">
                {editingId !== null ? "Edit Passenger" : "Add New Passenger"}
              </h2>

              <form
                onSubmit={savePassenger}
                className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2"
              >
                <div className="md:col-span-2">
                  <label className={labelClass} htmlFor="passengerName">
                    Full Name *
                  </label>
                  <input
                    id="passengerName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                    className={inputClass}
                    placeholder="Enter passenger's full name"
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="passengerEmail">
                    Email Address
                  </label>
                  <input
                    id="passengerEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={150}
                    className={inputClass}
                    placeholder="example@gmail.com"
                  />
                  <p className="mt-2 text-xs text-[#7a869a]">
                    Optional. Email addresses must be unique.
                  </p>
                </div>

                <div>
                  <label className={labelClass} htmlFor="passengerContact">
                    Contact Number
                  </label>
                  <input
                    id="passengerContact"
                    type="tel"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    maxLength={20}
                    className={inputClass}
                    placeholder="0771234567"
                  />
                </div>

                <div className="flex flex-wrap items-end gap-4 md:col-span-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="neu-btn px-5 py-3 text-indigo-600 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingId !== null
                        ? "Update Passenger"
                        : "Save Passenger"}
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

          {/* Passenger table */}
          <section className="neu-flat mt-10 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 p-6">
              <div>
                <h2 className="text-xl font-semibold text-[#44506a]">
                  Passenger List
                </h2>
                <p className="mt-1 text-sm text-[#7a869a]">
                  {passengers.length} passenger
                  {passengers.length === 1 ? "" : "s"} registered
                </p>
              </div>
            </div>

            <div className="overflow-x-auto px-6 pb-6">
              <div className="neu-pressed overflow-hidden">
                <table className="neu-table w-full min-w-[750px]">
                  <thead>
                    <tr className="text-left text-sm text-[#7a869a]">
                      {[
                        "ID",
                        "Full Name",
                        "Email",
                        "Contact Number",
                        "Actions",
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
                    {!loading && passengers.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-10 text-center text-[#7a869a]"
                        >
                          No passengers found. Click Add Passenger to create
                          the first record.
                        </td>
                      </tr>
                    )}

                    {passengers.map((passenger) => (
                      <tr key={passenger.PASSENGER_ID}>
                        <td className="px-6 py-4">
                          {passenger.PASSENGER_ID}
                        </td>

                        <td className="px-6 py-4 font-medium">
                          {passenger.NAME}
                        </td>

                        <td className="px-6 py-4">
                          {passenger.EMAIL || "—"}
                        </td>

                        <td className="px-6 py-4">
                          {passenger.CONTACT || "—"}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex gap-3">
                            <button
                              onClick={() => startEdit(passenger)}
                              className="neu-btn px-4 py-2 text-sm text-indigo-600"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                void deletePassenger(passenger.PASSENGER_ID)
                              }
                              disabled={deletingId === passenger.PASSENGER_ID}
                              className="neu-btn px-4 py-2 text-sm text-red-500 disabled:opacity-50"
                            >
                              {deletingId === passenger.PASSENGER_ID
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
                          colSpan={5}
                          className="px-6 py-10 text-center text-[#7a869a]"
                        >
                          Loading passengers from Oracle...
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