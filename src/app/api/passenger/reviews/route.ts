
import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";
import { getCurrentSession } from "@/lib/auth-session";
import { getOraclePool } from "@/lib/oracle";
import oracledb from "oracledb";

type TicketRow = {
  TICKET_ID: number;
  TRIP_ID: number;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getPassengerId() {
  const session = await getCurrentSession();

  if (session?.role !== "PASSENGER") {
    return {
      passengerId: null,
      response: errorResponse(
        "Please sign in as a passenger.",
        401
      ),
    };
  }

  const passengerId = Number(session.id);

  if (!Number.isSafeInteger(passengerId) || passengerId < 1) {
    return {
      passengerId: null,
      response: errorResponse(
        "Your passenger session has an invalid ID. Please sign in again.",
        401
      ),
    };
  }

  return { passengerId, response: null };
}

// GET: Load booked trips that have not already been reviewed.
export async function GET() {
  let connection: oracledb.Connection | undefined;

  try {
    const auth = await getPassengerId();

    if (auth.response || auth.passengerId === null) {
      return auth.response!;
    }

    const passengerId = auth.passengerId;
    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute<TicketRow>(
      `SELECT
          MIN(ticket_id) AS TICKET_ID,
          trip_id AS TRIP_ID
       FROM ticket
       WHERE passenger_id = :passengerId
         AND UPPER(TRIM(booking_status)) <> 'CANCELLED'
       GROUP BY trip_id
       ORDER BY trip_id DESC`,
      { passengerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const tickets = result.rows ?? [];

    await connection.close();
    connection = undefined;

    const db = await getMongoDb();
    const reviews = db.collection("passenger_reviews");

    const existingReviews = await reviews
      .find(
        { passengerId },
        { projection: { tripId: 1, _id: 0 } }
      )
      .toArray();

    const reviewedTripIds = new Set(
      existingReviews.map((review) => Number(review.tripId))
    );

    const eligibleTrips = tickets
      .filter((ticket) => !reviewedTripIds.has(Number(ticket.TRIP_ID)))
      .map((ticket) => ({
        ticketId: Number(ticket.TICKET_ID),
        tripId: Number(ticket.TRIP_ID),
      }));

    return NextResponse.json({ trips: eligibleTrips });
  } catch (error) {
    console.error("GET passenger review trips failed:", error);

    return errorResponse(
      "Unable to load your booked trips. Please try again.",
      500
    );
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error("Failed to close Oracle connection:", error);
      }
    }
  }
}

// POST: Verify the booking and save the review in MongoDB.
export async function POST(request: NextRequest) {
  let connection: oracledb.Connection | undefined;

  try {
    const auth = await getPassengerId();

    if (auth.response || auth.passengerId === null) {
      return auth.response!;
    }

    const passengerId = auth.passengerId;
    const body = await request.json();

    const tripId = Number(body.tripId);
    const rating = Number(body.rating);
    const comment =
      typeof body.comment === "string" ? body.comment.trim() : "";

    if (
      !Number.isSafeInteger(tripId) ||
      tripId < 1 ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      comment.length < 1 ||
      comment.length > 1000
    ) {
      return errorResponse(
        "Choose a trip, select a rating from 1 to 5, and enter feedback of 1–1000 characters.",
        400
      );
    }

    console.log("Review verification:", { passengerId, tripId });

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const ticketResult = await connection.execute<TicketRow>(
      `SELECT ticket_id AS TICKET_ID, trip_id AS TRIP_ID
       FROM ticket
       WHERE passenger_id = :passengerId
         AND trip_id = :tripId
         AND UPPER(TRIM(booking_status)) <> 'CANCELLED'
         AND ROWNUM = 1`,
      { passengerId, tripId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log("Matching Oracle tickets:", ticketResult.rows);

    if (!ticketResult.rows?.length) {
      return errorResponse(
        "No active booking was found for this trip under your passenger account. Please select a trip from your booked trips.",
        403
      );
    }

    await connection.close();
    connection = undefined;

    const db = await getMongoDb();
    const collection = db.collection("passenger_reviews");

    const existing = await collection.findOne({ passengerId, tripId });

    if (existing) {
      return errorResponse(
        "You have already reviewed this trip.",
        409
      );
    }

    const now = new Date();

    const document = {
      passengerId,
      tripId,
      rating,
      comment,
      categories: [] as string[],
      status: "PUBLISHED",
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(document);

    return NextResponse.json(
      {
        message: "Your review was submitted successfully.",
        review: {
          ...document,
          _id: result.insertedId.toString(),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Passenger review submission failed:", error);

    return errorResponse(
      "Unable to submit your review. Check the server terminal for the detailed error.",
      500
    );
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error("Failed to close Oracle connection:", error);
      }
    }
  }
}
