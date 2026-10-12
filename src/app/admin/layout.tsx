import { redirect } from "next/navigation";
import { Suspense } from "react";
import { hasRole } from "@/lib/auth-session";

async function AdminContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await hasRole("ADMIN");

  if (!session) {
    redirect("/login");
  }

  return <>{children}</>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminContent>{children}</AdminContent>
    </Suspense>
  );
}