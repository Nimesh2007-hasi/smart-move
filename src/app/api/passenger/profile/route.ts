import { NextResponse } from "next/server";
import oracledb from "oracledb";
import { getCurrentSession } from "@/lib/auth-session";
import { getOraclePool } from "@/lib/oracle";

async function getPassengerId() {
  const session = await getCurrentSession();

  if (session?.role !== "PASSENGER") {
    return null;
  }

  const id = Number(session.id);

  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET() {
  let connection: oracledb.Connection | undefined;

  try {
    const passengerId = await getPassengerId();

    if (!passengerId) {
      return NextResponse.json(
        { message: "Please log in as a passenger." },
        { status: 401 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `SELECT passenger_id, name, email, contact
       FROM passenger
       WHERE passenger_id = :id`,
      { id: passengerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const rows = result.rows as
      | Array<{
          PASSENGER_ID: number;
          NAME: string;
          EMAIL: string;
          CONTACT: string | null;
        }>
      | undefined;

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { message: "Passenger profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile: rows[0] });
  } catch (error) {
    console.error("Passenger profile GET error:", error);

    return NextResponse.json(
      { message: "Unable to load your profile." },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.close();
  }
}

export async function PUT(request: Request) {
  let connection: oracledb.Connection | undefined;

  try {
    const passengerId = await getPassengerId();

    if (!passengerId) {
      return NextResponse.json(
        { message: "Please log in as a passenger." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const contact =
      typeof body.contact === "string" ? body.contact.trim() : "";

    if (!name || name.length > 100) {
      return NextResponse.json(
        { message: "Name is required and must be under 100 characters." },
        { status: 400 }
      );
    }

    if (
      !email ||
      email.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (contact.length > 30) {
      return NextResponse.json(
        { message: "Contact number must be under 30 characters." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    await connection.execute(
      `UPDATE passenger
       SET name = :name,
           email = :email,
           contact = :contact
       WHERE passenger_id = :id`,
      {
        name,
        email,
        contact: contact || null,
        id: passengerId,
      },
      { autoCommit: true }
    );

    const result = await connection.execute(
      `SELECT passenger_id, name, email, contact
       FROM passenger
       WHERE passenger_id = :id`,
      { id: passengerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const rows = result.rows as
      | Array<{
          PASSENGER_ID: number;
          NAME: string;
          EMAIL: string;
          CONTACT: string | null;
        }>
      | undefined;

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { message: "Passenger profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully.",
      profile: rows[0],
    });
  } catch (error) {
    const oracleError = error as { code?: string };

    if (oracleError.code === "ORA-00001") {
      return NextResponse.json(
        { message: "This email address is already registered." },
        { status: 409 }
      );
    }

    console.error("Passenger profile PUT error:", error);

    return NextResponse.json(
      { message: "Unable to update your profile." },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.close();
  }
}
