
import { Suspense } from "react";
import AdminHome from "./AdminHome";

export default function Home() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: "24px" }}>
          Checking your session...
        </main>
      }
    >
      <AdminHome />
    </Suspense> 
  );
}
