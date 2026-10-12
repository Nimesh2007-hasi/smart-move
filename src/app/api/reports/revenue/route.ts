import { NextRequest, NextResponse } from "next/server";
import oracledb from "oracledb";
import { getOraclePool } from "@/lib/oracle";

async function readDbmsOutput(connection: oracledb.Connection) {
  const lines: string[] = [];

  for (let i = 0; i < 1000; i++) {
    const result = await connection.execute(
      `BEGIN DBMS_OUTPUT.GET_LINE(:line, :status); END;`,
      {
        line: {
          dir: oracledb.BIND_OUT,
          type: oracledb.STRING,
          maxSize: 32767,
        },
        status: {
          dir: oracledb.BIND_OUT,
          type: oracledb.NUMBER,
        },
      }
    );

    const output = result.outBinds as {
      line: string | null;
      status: number;
    };

    if (output.status !== 0) break;
    lines.push(output.line ?? "");
  }

  return lines;
}

export async function GET(request: NextRequest) {
  let connection: oracledb.Connection | undefined;

  try {
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDate = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const startDate =
      request.nextUrl.searchParams.get("startDate") ??
      formatDate(defaultStart);

    const endDate =
      request.nextUrl.searchParams.get("endDate") ??
      formatDate(defaultEnd);

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ||
      startDate > endDate
    ) {
      return NextResponse.json(
        { error: "Use valid dates in YYYY-MM-DD format; startDate must not be after endDate." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    await connection.execute(`BEGIN DBMS_OUTPUT.ENABLE(NULL); END;`);

    await connection.execute(
      `BEGIN
         REPORT_REVENUE(
           TO_DATE(:startDate, 'YYYY-MM-DD'),
           TO_DATE(:endDate, 'YYYY-MM-DD')
         );
       END;`,
      { startDate, endDate }
    );

    const lines = await readDbmsOutput(connection);

    return NextResponse.json({ startDate, endDate, lines });
  } catch (error) {
    console.error("Revenue report error:", error);
    return NextResponse.json(
      { error: "Failed to generate the revenue report." },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.close();
  }
}