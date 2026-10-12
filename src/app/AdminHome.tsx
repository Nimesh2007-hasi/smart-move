
import { redirect } from "next/navigation";
import { hasRole } from "@/lib/auth-session";
import AdminDashboardClient from "@/components/AdminDashboardClient";

export default async function AdminHome() {
  const session = await hasRole("ADMIN");

  if (!session) {
    redirect("/login");
  }

  return <AdminDashboardClient />;
}
