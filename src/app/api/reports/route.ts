import { NextResponse } from "next/server";
import oracledb from "oracledb";
import { getOraclePool } from "@/lib/oracle";

export async function GET() {
  let connection: oracledb.Connection | undefined;

  try {
    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const query = async (sql: string) => {
      const result = await connection!.execute(sql, [], {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      return result.rows ?? [];
    };

    const [
      summary,
      routeReport,
      revenueReport,
      driverReport,
      maintenanceReport,
    ] = await Promise.all([
      query(`
        SELECT
          (SELECT COUNT(*) FROM trip) AS total_trips,
          (SELECT COUNT(*) FROM passenger) AS total_passengers,
          (SELECT COUNT(*) FROM ticket
             WHERE booking_status <> 'CANCELLED') AS total_bookings,
          (SELECT NVL(SUM(amount), 0) FROM payment
             WHERE payment_status = 'PAID') AS total_revenue,
          (SELECT NVL(SUM(cost), 0) FROM maintenance) AS maintenance_cost
        FROM dual
      `),

      query(`
        SELECT
          r.origin,
          r.destination,
          COUNT(DISTINCT t.trip_id) AS trip_count,
          COUNT(CASE
            WHEN tk.booking_status <> 'CANCELLED' THEN tk.ticket_id
          END) AS passenger_count
        FROM route r
        LEFT JOIN trip t ON t.route_id = r.route_id
        LEFT JOIN ticket tk ON tk.trip_id = t.trip_id
        GROUP BY r.route_id, r.origin, r.destination
        ORDER BY trip_count DESC, r.origin
      `),

      query(`
        SELECT
          TO_CHAR(p.payment_date, 'YYYY-MM-DD') AS payment_date,
          COUNT(*) AS payment_count,
          NVL(SUM(CASE
            WHEN p.payment_status = 'PAID' THEN p.amount
            ELSE 0
          END), 0) AS revenue
        FROM payment p
        GROUP BY TO_CHAR(p.payment_date, 'YYYY-MM-DD')
        ORDER BY TO_CHAR(p.payment_date, 'YYYY-MM-DD') DESC
        FETCH FIRST 30 ROWS ONLY
      `),

      query(`
        SELECT
          d.driver_id,
          d.name AS driver_name,
          d.status,
          COUNT(DISTINCT t.trip_id) AS trip_count,
          COUNT(CASE
            WHEN tk.booking_status <> 'CANCELLED' THEN tk.ticket_id
          END) AS passenger_count
        FROM driver d
        LEFT JOIN trip t ON t.driver_id = d.driver_id
        LEFT JOIN ticket tk ON tk.trip_id = t.trip_id
        GROUP BY d.driver_id, d.name, d.status
        ORDER BY trip_count DESC, d.name
      `),

      query(`
        SELECT
          m.maintenance_id,
          v.reg_number,
          m.service_date,
          m.description,
          m.cost
        FROM maintenance m
        JOIN vehicle v ON v.vehicle_id = m.vehicle_id
        ORDER BY m.service_date DESC, m.maintenance_id DESC
      `),
    ]);

    return NextResponse.json({
      summary: summary[0] ?? {},
      routes: routeReport,
      revenue: revenueReport,
      drivers: driverReport,
      maintenance: maintenanceReport,
    });
  } catch (error) {
    console.error("GET reports error:", error);
    return NextResponse.json(
      { error: "Failed to generate reports from Oracle Database." },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.close();
  }
}