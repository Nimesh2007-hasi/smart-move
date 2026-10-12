
import { NextRequest, NextResponse } from "next/server";
import * as oracledb from "oracledb";
import bcrypt from "bcrypt";
import { getOraclePool } from "@/lib/oracle";

export async function POST(request: NextRequest) {
  let connection: oracledb.Connection | undefined;

  try {
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const contact =
      typeof body.contact === "string"
        ? body.contact.trim()
        : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    // Validate required fields
    if (!name || !email || !contact || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required.",
        },
        { status: 400 }
      );
    }

    // Validate field lengths
    if (
      name.length < 2 ||
      name.length > 100 ||
      email.length > 150 ||
      contact.length > 20
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please check the length of your name, email, or contact number.",
        },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid email address.",
        },
        { status: 400 }
      );
    }

    // Validate password length for bcrypt
    if (
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must be at least 8 characters and no more than 72 UTF-8 bytes.",
        },
        { status: 400 }
      );
    }

    // Hash the password before storing it
    const passwordHash = await bcrypt.hash(password, 12);

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    // Create passenger and retrieve generated passenger_id
    const passengerResult = await connection.execute(
      `INSERT INTO passenger (name, email, contact)
       VALUES (:name, :email, :contact)
       RETURNING passenger_id INTO :passengerId`,
      {
        name,
        email,
        contact,
        passengerId: {
          dir: oracledb.BIND_OUT,
          type: oracledb.NUMBER,
        },
      },
      { autoCommit: false }
    );

    const outBinds = passengerResult.outBinds as
      | { passengerId?: number[] }
      | undefined;

    const passengerId = outBinds?.passengerId?.[0];

    if (passengerId === undefined || passengerId === null) {
      throw new Error("Oracle did not return the new passenger ID.");
    }

    // Create the passenger login account.
    // Public registration must never create an admin account.
    await connection.execute(
      `INSERT INTO app_user
         (email, password_hash, role, passenger_id, is_active)
       VALUES
         (:email, :passwordHash, 'PASSENGER', :passengerId, 1)`,
      {
        email,
        passwordHash,
        passengerId,
      },
      { autoCommit: false }
    );

    // Commit both inserts together
    await connection.commit();

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful. You can now log in.",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Registration rollback failed:", rollbackError);
      }
    }

    const dbError = error as {
      code?: string;
      errorNum?: number;
    };

    const errorCode = dbError.code;
    const errorNumber = dbError.errorNum;

    // Duplicate email or another unique constraint violation
    if (errorCode === "ORA-00001" || errorNumber === 1) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    console.error("Passenger registration failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Registration failed. Please try again.",
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error("Failed to close Oracle connection:", closeError);
      }
    }
  }
}
