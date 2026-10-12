"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PassengerProfile = {
  PASSENGER_ID: number;
  NAME: string;
  EMAIL: string;
  CONTACT: string | null;
};

export default function PassengerProfilePage() {
  const [profile, setProfile] = useState<PassengerProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/passenger/profile", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load profile.");
      }

      const passenger = data.profile as PassengerProfile;

      setProfile(passenger);
      setName(passenger.NAME ?? "");
      setEmail(passenger.EMAIL ?? "");
      setContact(passenger.CONTACT ?? "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/passenger/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, contact }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile.");
      }

      setProfile(data.profile);
      setName(data.profile.NAME ?? "");
      setEmail(data.profile.EMAIL ?? "");
      setContact(data.profile.CONTACT ?? "");
      setMessage(data.message || "Profile updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading your profile...</p>
      </main>
    );
  }

  if (!profile && error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">
            Unable to load profile
          </h1>
          <p className="mt-3 text-sm text-red-600">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => void loadProfile()}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try Again
            </button>
            <Link
              href="/passenger/dashboard"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Smart Move Transport Solutions
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              My Profile
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              View and manage your passenger account information.
            </p>
          </div>

          <Link
            href="/passenger/dashboard"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            ← Dashboard
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-bold text-blue-700">
              {name.trim().charAt(0).toUpperCase() || "P"}
            </div>

            <h2 className="mt-4 break-words text-lg font-bold text-slate-900">
              {name || "Passenger"}
            </h2>

            <p className="mt-1 break-all text-sm text-slate-500">
              {email}
            </p>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Passenger ID
              </p>
              <p className="mt-1 font-semibold text-slate-700">
                #{profile?.PASSENGER_ID}
              </p>
            </div>

            <div className="mt-4">
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Passenger Account
              </span>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Personal Information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Update the details associated with your account.
              </p>
            </div>

            {message && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                {message}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="text-sm font-semibold text-slate-700"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  maxLength={100}
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  maxLength={150}
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label
                  htmlFor="contact"
                  className="text-sm font-semibold text-slate-700"
                >
                  Contact Number
                </label>
                <input
                  id="contact"
                  type="tel"
                  maxLength={30}
                  autoComplete="tel"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  className={inputClass}
                  placeholder="Enter your contact number"
                />
              </div>

              <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setName(profile?.NAME ?? "");
                    setEmail(profile?.EMAIL ?? "");
                    setContact(profile?.CONTACT ?? "");
                    setMessage("");
                    setError("");
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Reset
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}