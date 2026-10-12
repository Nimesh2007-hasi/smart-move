
import { NextResponse } from "next/server";
import oracledb from "oracledb";
import { getOraclePool } from "@/lib/oracle";
import { getCurrentSession } from "@/lib/auth-session";

export async function GET() {
  let connection: oracledb.Connection | undefined;

  try {
    // Verify that the user is logged in as an admin.
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { message: "Please log in." },
        { status: 401 }
      );
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Access denied. Admin access is required." },
        { status: 403 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const statsResult = await connection.execute(
      `SELECT
         (SELECT COUNT(*) FROM vehicle) AS total_vehicles,
         (SELECT COUNT(*) FROM driver) AS total_drivers,
         (SELECT COUNT(*) FROM passenger) AS total_passengers,
         (SELECT COUNT(*) FROM trip
          WHERE departure_time >= TRUNC(SYSDATE)
            AND departure_time < TRUNC(SYSDATE) + 1
         ) AS todays_trips
       FROM dual`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const tripsResult = await connection.execute(
      `SELECT
         t.trip_id,
         v.reg_number,
         d.name AS driver_name,
         r.origin,
         r.destination,
         TO_CHAR(
           t.departure_time,
           'YYYY-MM-DD HH24:MI'
         ) AS departure_time,
         t.status
       FROM trip t
       JOIN vehicle v ON v.vehicle_id = t.vehicle_id
       JOIN driver d ON d.driver_id = t.driver_id
       JOIN route r ON r.route_id = t.route_id
       ORDER BY t.departure_time DESC
       FETCH FIRST 5 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return NextResponse.json({
      stats: statsResult.rows?.[0] ?? {},
      recentTrips: tripsResult.rows ?? [],
    });
  } catch (error) {
    console.error("Dashboard API error:", error);

    return NextResponse.json(
      { message: "Failed to load dashboard data from Oracle" },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
