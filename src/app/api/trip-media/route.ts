
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";

const COLLECTION = "trip_media";

export async function GET(request: NextRequest) {
  try {
    const tripIdParam = request.nextUrl.searchParams.get("tripId");
    const tripId = Number(tripIdParam);

    if (!tripIdParam || !Number.isInteger(tripId) || tripId < 1) {
      return NextResponse.json(
        { error: "A valid tripId is required." },
        { status: 400 }
      );
    }

    const db = await getMongoDb();
    const media = await db
      .collection(COLLECTION)
      .find({ tripId })
      .sort({ uploadedAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json(media);
  } catch (error) {
    console.error("GET trip media error:", error);
    return NextResponse.json(
      { error: "Failed to load trip media." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const tripId = Number(body.tripId);
    const mediaType = String(body.mediaType ?? "").trim();
    const title = String(body.title ?? "").trim();
    const fileId = String(body.fileId ?? "").trim();

    if (
      !Number.isInteger(tripId) ||
      tripId < 1 ||
      !mediaType ||
      !title ||
      !ObjectId.isValid(fileId)
    ) {
      return NextResponse.json(
        { error: "Trip ID, media type, title and a valid uploaded file ID are required." },
        { status: 400 }
      );
    }

    const db = await getMongoDb();

    // Confirm the file exists in GridFS before saving its reference.
    const gridFsFile = await db
      .collection("uploads.files")
      .findOne({ _id: new ObjectId(fileId) });

    if (!gridFsFile) {
      return NextResponse.json(
        { error: "The uploaded file was not found in MongoDB." },
        { status: 404 }
      );
    }

    const document = {
      tripId,
      mediaType,
      title,
      fileId,
      uploadedBy: String(body.uploadedBy ?? "").trim(),
      tags: Array.isArray(body.tags) ? body.tags : [],
      uploadedAt: new Date(),
      visibility: body.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
    };

    const result = await db.collection(COLLECTION).insertOne(document);

    return NextResponse.json(
      { _id: result.insertedId.toString(), ...document },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST trip media error:", error);
    return NextResponse.json(
      { error: "Failed to add trip media." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body.id ?? "");

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "A valid media record ID is required." },
        { status: 400 }
      );
    }

    const tripId = Number(body.tripId);
    const mediaType = String(body.mediaType ?? "").trim();
    const title = String(body.title ?? "").trim();
    const fileId = String(body.fileId ?? "").trim();

    if (
      !Number.isInteger(tripId) ||
      tripId < 1 ||
      !mediaType ||
      !title ||
      !ObjectId.isValid(fileId)
    ) {
      return NextResponse.json(
        { error: "Trip ID, media type, title and a valid uploaded file ID are required." },
        { status: 400 }
      );
    }

    const db = await getMongoDb();

    const gridFsFile = await db
      .collection("uploads.files")
      .findOne({ _id: new ObjectId(fileId) });

    if (!gridFsFile) {
      return NextResponse.json(
        { error: "The uploaded file was not found in MongoDB." },
        { status: 404 }
      );
    }

    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          tripId,
          mediaType,
          title,
          fileId,
          uploadedBy: String(body.uploadedBy ?? "").trim(),
          tags: Array.isArray(body.tags) ? body.tags : [],
          visibility: body.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Media record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Media updated successfully.",
    });
  } catch (error) {
    console.error("PUT trip media error:", error);
    return NextResponse.json(
      { error: "Failed to update trip media." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "A valid media record ID is required." },
        { status: 400 }
      );
    }

    const db = await getMongoDb();
    const result = await db.collection(COLLECTION).deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Media record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Media deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE trip media error:", error);
    return NextResponse.json(
      { error: "Failed to delete trip media." },
      { status: 500 }
    );
  }
}