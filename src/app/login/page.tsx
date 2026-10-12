
"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Unable to log in.");
        return;
      }

          if (result.role === "ADMIN") {
      router.replace("/");
    } else if (result.role === "PASSENGER") {
      router.replace("/passenger/dashboard");
    } else {
      setError("Unsupported account role.");
      return;
    }

router.refresh();
    } catch {
      setError("Unable to contact the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9"
      >
        <div>
          <p className="text-sm font-semibold text-blue-700">SMART MOVE</p>
          <h1 className="mt-3 text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">
            Log in to manage your passenger account.
          </p>
        </div>

        {searchParams.get("registered") === "1" && (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            Account created successfully. You can now log in.
          </p>
        )}

        <label className="block space-y-2">
          <span className="text-sm font-medium">Email address</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
            placeholder="you@example.com"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
            placeholder="Enter your password"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link href="/register" className="font-semibold text-blue-700 hover:underline">
            Register
            </Link>
        </p>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          Loading...
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
