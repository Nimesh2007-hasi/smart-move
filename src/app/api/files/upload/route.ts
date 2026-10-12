
import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";
import { GridFSBucket, ObjectId } from "mongodb";
import { Readable } from "node:stream";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "application/pdf",
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select a file." },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be smaller than 20 MB." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "This file type is not allowed." },
        { status: 400 }
      );
    }

    const db = await getMongoDb();
    const bucket = new GridFSBucket(db, {
      bucketName: "uploads",
    });

    const fileId = new ObjectId();
    const buffer = Buffer.from(await file.arrayBuffer());

    await new Promise<void>((resolve, reject) => {
        
    const uploadStream = bucket.openUploadStreamWithId(
    fileId,
    file.name,
    {
        metadata: {
        originalName: file.name,
        contentType: file.type,
        uploadedAt: new Date(),
        },
    }
    );

      Readable.from(buffer)
        .pipe(uploadStream)
        .on("error", reject)
        .on("finish", resolve);
    });

    return NextResponse.json({
      message: "File uploaded successfully.",
      fileId: fileId.toString(),
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error("GridFS upload error:", error);

    return NextResponse.json(
      { error: "File upload failed." },
      { status: 500 }
    );
  }
}