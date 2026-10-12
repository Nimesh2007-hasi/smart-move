
import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";
import { GridFSBucket, ObjectId } from "mongodb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid file ID." },
        { status: 400 }
      );
    }

    const db = await getMongoDb();
    const bucket = new GridFSBucket(db, {
      bucketName: "uploads",
    });

    const fileId = new ObjectId(id);

    const files = await bucket
      .find({ _id: fileId })
      .limit(1)
      .toArray();

    if (files.length === 0) {
      return NextResponse.json(
        { error: "File not found." },
        { status: 404 }
      );
    }

    const file = files[0];
    const contentType =
      typeof file.metadata?.contentType === "string"
        ? file.metadata.contentType
        : "application/octet-stream";

    const chunks: Buffer[] = [];

    const downloadStream = bucket.openDownloadStream(fileId);

    for await (const chunk of downloadStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const buffer = Buffer.concat(chunks);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.length),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("GridFS download error:", error);

    return NextResponse.json(
      { error: "Could not retrieve the file." },
      { status: 500 }
    );
  }
}