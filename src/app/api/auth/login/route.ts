import { NextRequest, NextResponse } from "next/server";
import * as oracledb from "oracledb";
import bcrypt from "bcrypt";
import { getOraclePool } from "@/lib/oracle";
import {
  createPassengerToken,
  COOKIE_NAME,
  SESSION_DURATION,
} from "@/lib/passenger-auth";

type LoginRow = {
  USER_ID: number;
  EMAIL: string;
  PASSWORD_HASH: string;
  ROLE: "ADMIN" | "PASSENGER";
  PASSENGER_ID: number | null;
  NAME: string | null;
};

export async function POST(request: NextRequest) {
  let connection: oracledb.Connection | undefined;

  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    if (
      !email ||
      email.length > 254 ||
      !password ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return NextResponse.json(
        { error: "Enter a valid email and password." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `SELECT
         u.user_id,
         u.email,
         u.password_hash,
         u.role,
         u.passenger_id,
         p.name
       FROM app_user u
       LEFT JOIN passenger p
         ON p.passenger_id = u.passenger_id
       WHERE LOWER(TRIM(u.email)) = :email
         AND u.is_active = 1`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const user = result.rows?.[0] as LoginRow | undefined;

    // Temporary diagnostics: never log the password or password hash.
    const passwordMatches =
      Boolean(user) &&
      typeof user?.PASSWORD_HASH === "string" &&
      (await bcrypt.compare(password, user.PASSWORD_HASH));

    console.log("Login diagnostic:", {
      email,
      accountFound: Boolean(user),
      role: user?.ROLE,
      passwordHashAvailable:
        typeof user?.PASSWORD_HASH === "string",
      passwordMatches,
    });

    if (!user || !passwordMatches) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.ROLE !== "ADMIN" && user.ROLE !== "PASSENGER") {
      return NextResponse.json(
        { error: "This account has an unsupported role." },
        { status: 403 }
      );
    }

    if (
      user.ROLE === "PASSENGER" &&
      (user.PASSENGER_ID == null ||
        typeof user.NAME !== "string")
    ) {
      return NextResponse.json(
        {
          error:
            "This passenger account is not configured correctly.",
        },
        { status: 403 }
      );
    }

    // Passenger pages use passenger_id; admin pages use user_id.
    const subjectId =
      user.ROLE === "PASSENGER"
        ? String(user.PASSENGER_ID)
        : String(user.USER_ID);

    const token = await createPassengerToken(
      subjectId,
      user.EMAIL,
      user.ROLE
    );

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      role: user.ROLE,
      user: {
        id: user.ROLE === "PASSENGER"
          ? user.PASSENGER_ID
          : user.USER_ID,
        name: user.NAME ?? "Administrator",
        email: user.EMAIL,
        role: user.ROLE,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION,
    });

    return response;
  } catch (error) {
    console.error("Login failed:", error);

    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error(
          "Failed to close Oracle connection:",
          error
        );
      }
    }
  }
}