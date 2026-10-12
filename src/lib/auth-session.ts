
import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  verifySessionToken,
  type UserRole,
} from "@/lib/passenger-auth";

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function hasRole(role: UserRole) {
  const session = await getCurrentSession();

  return session?.role === role ? session : null;
}
