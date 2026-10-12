import { NextRequest, NextResponse } from "next/server";
import oracledb from "oracledb";
import { getOraclePool } from "@/lib/oracle";

const validId = (value: unknown) =>
  Number.isInteger(Number(value)) && Number(value) > 0;

async function withConnection<T>(
  callback: (connection: oracledb.Connection) => Promise<T>
): Promise<T> {
  const pool = await getOraclePool();
  const connection = await pool.getConnection();

  try {
    return await callback(connection);
  } finally {
    await connection.close();
  }
}

export async function GET() {
  try {
    const rows = await withConnection(async (connection) => {
      const result = await connection.execute(
        `SELECT f.feedback_id,
                f.passenger_id,
                p.name AS passenger_name,
                f.trip_id,
                r.origin,
                r.destination,
                f.rating,
                f.comments
         FROM feedback f
         JOIN passenger p ON p.passenger_id = f.passenger_id
         JOIN trip t ON t.trip_id = f.trip_id
         JOIN route r ON r.route_id = t.route_id
         ORDER BY f.feedback_id DESC`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      return result.rows ?? [];
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET feedback error:", error);
    return NextResponse.json(
      { error: "Failed to load feedback records." },
      { status: 500 }
    );
  }
}

async function saveFeedback(request: NextRequest, editing: boolean) {
  try {
    const body = await request.json();

    const feedbackId = Number(body.feedback_id);
    const passengerId = Number(body.passenger_id);
    const tripId = Number(body.trip_id);
    const rating = Number(body.rating);
    const comments = String(body.comments ?? "").trim();

    if (
      !validId(passengerId) ||
      !validId(tripId) ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      comments.length > 1000 ||
      (editing && !validId(feedbackId))
    ) {
      return NextResponse.json(
        {
          error:
            "Enter valid passenger and trip IDs, a rating from 1 to 5, and a comment of at most 1000 characters.",
        },
        { status: 400 }
      );
    }

    const result = await withConnection(async (connection) => {
      if (editing) {
        return connection.execute(
          `UPDATE feedback
           SET passenger_id = :passengerId,
               trip_id = :tripId,
               rating = :rating,
               comments = :comments
           WHERE feedback_id = :feedbackId`,
          {
            passengerId,
            tripId,
            rating,
            comments: comments || null,
            feedbackId,
          },
          { autoCommit: true }
        );
      }

      return connection.execute(
        `INSERT INTO feedback
           (passenger_id, trip_id, rating, comments)
         VALUES
           (:passengerId, :tripId, :rating, :comments)`,
        {
          passengerId,
          tripId,
          rating,
          comments: comments || null,
        },
        { autoCommit: true }
      );
    });

    if (editing && !result.rowsAffected) {
      return NextResponse.json(
        { error: "Feedback record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: editing ? "Feedback updated." : "Feedback added." },
      { status: editing ? 200 : 201 }
    );
  } catch (error) {
    console.error("Save feedback error:", error);
    return NextResponse.json(
      { error: "Failed to save feedback. Check that the selected passenger and trip exist." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return saveFeedback(request, false);
}

export async function PUT(request: NextRequest) {
  return saveFeedback(request, true);
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!validId(id)) {
    return NextResponse.json(
      { error: "A valid feedback ID is required." },
      { status: 400 }
    );
  }

  try {
    const result = await withConnection((connection) =>
      connection.execute(
        `DELETE FROM feedback WHERE feedback_id = :id`,
        { id: Number(id) },
        { autoCommit: true }
      )
    );

    if (!result.rowsAffected) {
      return NextResponse.json(
        { error: "Feedback record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Feedback deleted." });
  } catch (error) {
    console.error("Delete feedback error:", error);
    return NextResponse.json(
      { error: "Failed to delete feedback." },
      { status: 500 }
    );
  }
}