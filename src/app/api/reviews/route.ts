
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";
import { hasRole } from "@/lib/auth-session";

const collectionName = "passenger_reviews";
const validStatuses = ["PUBLISHED", "HIDDEN"];

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function validId(value: unknown): boolean {
  const numberValue = Number(value);
  return Number.isSafeInteger(numberValue) && numberValue > 0;
}

function validRating(value: unknown): boolean {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue >= 1 && numberValue <= 5;
}

function validComment(value: unknown): boolean {
  return typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 1000;
}

function serializeReview(review: Record<string, any>) {
  return {
    ...review,
    _id: review._id.toString(),
    createdAt: review.createdAt instanceof Date
      ? review.createdAt.toISOString()
      : review.createdAt ?? null,
  };
}

// ADMIN: List all reviews, including hidden reviews.
export async function GET() {
  try {
    const admin = await hasRole("ADMIN");
    if (!admin) return errorResponse("Admin access required.", 403);

    const db = await getMongoDb();
    const reviews = await db.collection(collectionName)
      .find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json(reviews.map((review) => serializeReview(review)));
  } catch (error) {
    console.error("GET reviews error:", error);
    return errorResponse("Failed to load reviews.", 500);
  }
}

// ADMIN: Add a review record.
export async function POST(request: NextRequest) {
  try {
    const admin = await hasRole("ADMIN");
    if (!admin) return errorResponse("Admin access required.", 403);

    const body = await request.json();
    const passengerId = Number(body.passengerId);
    const tripId = Number(body.tripId);
    const rating = Number(body.rating);
    const comment = typeof body.comment === "string"
      ? body.comment.trim()
      : "";
    const status = String(body.status ?? "PUBLISHED").toUpperCase();

    if (
      !validId(passengerId) ||
      !validId(tripId) ||
      !validRating(rating) ||
      !validComment(comment) ||
      !validStatuses.includes(status)
    ) {
      return errorResponse(
        "Enter valid passenger and trip IDs, a rating from 1 to 5, a comment of 1–1000 characters, and a valid status.",
        400
      );
    }

    const document = {
      passengerId,
      tripId,
      rating,
      comment,
      categories: Array.isArray(body.categories)
        ? body.categories.filter((item: unknown) => typeof item === "string").slice(0, 20)
        : [],
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await getMongoDb();
    const result = await db.collection(collectionName).insertOne(document);

    return NextResponse.json(
      { _id: result.insertedId.toString(), ...document },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST review error:", error);
    return errorResponse("Failed to create review.", 500);
  }
}

// ADMIN: Edit a review or moderate its publication status.
export async function PUT(request: NextRequest) {
  try {
    const admin = await hasRole("ADMIN");
    if (!admin) return errorResponse("Admin access required.", 403);

    const body = await request.json();
    const id = String(body.id ?? "");
    const passengerId = Number(body.passengerId);
    const tripId = Number(body.tripId);
    const rating = Number(body.rating);
    const comment = typeof body.comment === "string"
      ? body.comment.trim()
      : "";
    const status = String(body.status ?? "PUBLISHED").toUpperCase();

    if (!ObjectId.isValid(id)) {
      return errorResponse("A valid review ID is required.", 400);
    }

    if (
      !validId(passengerId) ||
      !validId(tripId) ||
      !validRating(rating) ||
      !validComment(comment) ||
      !validStatuses.includes(status)
    ) {
      return errorResponse("Enter valid review details.", 400);
    }

    const db = await getMongoDb();
    const result = await db.collection(collectionName).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          passengerId,
          tripId,
          rating,
          comment,
          status,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return errorResponse("Review not found.", 404);
    }

    return NextResponse.json({ message: "Review updated." });
  } catch (error) {
    console.error("PUT review error:", error);
    return errorResponse("Failed to update review.", 500);
  }
}

// ADMIN: Delete a review.
export async function DELETE(request: NextRequest) {
  try {
    const admin = await hasRole("ADMIN");
    if (!admin) return errorResponse("Admin access required.", 403);

    const id = request.nextUrl.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return errorResponse("A valid review ID is required.", 400);
    }

    const db = await getMongoDb();
    const result = await db.collection(collectionName).deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return errorResponse("Review not found.", 404);
    }

    return NextResponse.json({ message: "Review deleted." });
  } catch (error) {
    console.error("DELETE review error:", error);
    return errorResponse("Failed to delete review.", 500);
  }
}
