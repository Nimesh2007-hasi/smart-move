
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const COOKIE_NAME = "sm_passenger_session";
export const SESSION_DURATION = 60 * 60 * 24 * 7;

export type UserRole = "ADMIN" | "PASSENGER";

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be configured with a strong secret.");
  }

  return new TextEncoder().encode(secret);
}

export async function createPassengerToken(
  subjectId: string,
  email: string,
  role: UserRole = "PASSENGER"
) {
  return new SignJWT({ email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subjectId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      (payload.role !== "ADMIN" && payload.role !== "PASSENGER")
    ) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

export async function verifyPassengerToken(token: string) {
  const session = await verifySessionToken(token);

  if (!session || session.role !== "PASSENGER") {
    return null;
  }

  return {
    id: session.id,
    email: session.email,
  };
}
