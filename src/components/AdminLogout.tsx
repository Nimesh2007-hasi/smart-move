"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Logout failed. Please try again.");
      }

      router.replace("/login");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to log out right now."
      );
      setLoading(false);
    }
  }

  return (
        <div>
<button
  type="button"
  onClick={handleLogout}
  disabled={loading}
  className="
    flex w-full items-center justify-center gap-3
    rounded-xl border border-red-200/50
    bg-white/25 px-4 py-3
    text-sm font-semibold text-red-500
    shadow-[3px_3px_7px_rgba(151,174,207,0.12),-3px_-3px_7px_rgba(255,255,255,0.45)]
    backdrop-blur-md
    transition-all duration-200
    hover:border-red-200/80
    hover:bg-red-50/50
    hover:text-red-600
    active:scale-[0.98]
    disabled:cursor-not-allowed disabled:opacity-60
  "
>
  <span className="text-lg" aria-hidden="true">
    ↪
  </span>
  <span>{loading ? "Logging out..." : "Logout"}</span>
</button>
        </div>
    );
}