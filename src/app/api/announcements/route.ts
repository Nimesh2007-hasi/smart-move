import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";

const collectionName = "announcements";

export async function GET() {
  try {
    const db = await getMongoDb();
    const items = await db.collection(collectionName)
      .find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load announcements." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const message = String(body.message ?? "").trim();
    const audience = String(body.audience ?? "ALL").trim();
    const type = String(body.type ?? "GENERAL").trim();
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return NextResponse.json({ error: "Invalid expiry date." }, { status: 400 });
    }

    const document = {
      title,
      message,
      audience,
      type,
      published: Boolean(body.published),
      createdAt: new Date(),
      ...(expiresAt ? { expiresAt } : {}),
    };

    const db = await getMongoDb();
    const result = await db.collection(collectionName).insertOne(document);

    return NextResponse.json({ _id: result.insertedId.toString(), ...document }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create announcement." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body.id ?? "");
    const title = String(body.title ?? "").trim();
    const message = String(body.message ?? "").trim();
    const audience = String(body.audience ?? "ALL").trim();
    const type = String(body.type ?? "GENERAL").trim();
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid announcement ID required." }, { status: 400 });
    }
    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return NextResponse.json({ error: "Invalid expiry date." }, { status: 400 });
    }

    const update: Record<string, unknown> = {
      title,
      message,
      audience,
      type,
      published: Boolean(body.published),
    };

    if (expiresAt) update.expiresAt = expiresAt;
    else update.expiresAt = null;

    const db = await getMongoDb();
    const result = await db.collection(collectionName).updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );

    if (!result.matchedCount) {
      return NextResponse.json({ error: "Announcement not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Announcement updated." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update announcement." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid announcement ID required." }, { status: 400 });
    }

    const db = await getMongoDb();
    const result = await db.collection(collectionName).deleteOne({ _id: new ObjectId(id) });

    if (!result.deletedCount) {
      return NextResponse.json({ error: "Announcement not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Announcement deleted." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete announcement." }, { status: 500 });
  }
}