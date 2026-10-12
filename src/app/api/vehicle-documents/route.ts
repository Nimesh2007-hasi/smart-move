
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";

const COLLECTION = "vehicle_documents";

function validDate(value: unknown): boolean {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) &&
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value
  );
}

export async function GET() {
  try {
    const db = await getMongoDb();

    const documents = await db
      .collection(COLLECTION)
      .find({})
      .sort({ expiryDate: 1 })
      .limit(500)
      .toArray();

    return NextResponse.json(documents);
  } catch (error) {
    console.error("GET vehicle documents error:", error);

    return NextResponse.json(
      { error: "Failed to load vehicle documents." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const vehicleId = String(body.vehicleId ?? "").trim();
    const registrationNumber = String(body.registrationNumber ?? "").trim();
    const documentType = String(body.documentType ?? "").trim();
    const documentNumber = String(body.documentNumber ?? "").trim();
    const issueDate = String(body.issueDate ?? "");
    const expiryDate = String(body.expiryDate ?? "");
    const fileId = String(body.fileId ?? "").trim();

    if (
      !vehicleId ||
      !registrationNumber ||
      !documentType ||
      !documentNumber ||
      !validDate(issueDate) ||
      !validDate(expiryDate) ||
      expiryDate < issueDate ||
      !ObjectId.isValid(fileId)
    ) {
      return NextResponse.json(
        {
          error:
            "Enter valid vehicle and document details, dates, and an uploaded file.",
        },
        { status: 400 }
      );
    }

    const db = await getMongoDb();

    const uploadedFile = await db
      .collection("uploads.files")
      .findOne({ _id: new ObjectId(fileId) });

    if (!uploadedFile) {
      return NextResponse.json(
        { error: "Uploaded file not found in MongoDB." },
        { status: 404 }
      );
    }

    const document = {
      vehicleId,
      registrationNumber,
      documentType,
      documentNumber,
      issueDate,
      expiryDate,
      fileId,
      status:
        expiryDate < new Date().toISOString().slice(0, 10)
          ? "EXPIRED"
          : "VALID",
      uploadedAt: new Date(),
    };

    const result = await db
      .collection(COLLECTION)
      .insertOne(document);

    return NextResponse.json(
      { _id: result.insertedId.toString(), ...document },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST vehicle document error:", error);

    return NextResponse.json(
      { error: "Failed to save vehicle document." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const id = String(body.id ?? "");
    const vehicleId = String(body.vehicleId ?? "").trim();
    const registrationNumber = String(body.registrationNumber ?? "").trim();
    const documentType = String(body.documentType ?? "").trim();
    const documentNumber = String(body.documentNumber ?? "").trim();
    const issueDate = String(body.issueDate ?? "");
    const expiryDate = String(body.expiryDate ?? "");
    const fileId = String(body.fileId ?? "").trim();

    if (
      !ObjectId.isValid(id) ||
      !vehicleId ||
      !registrationNumber ||
      !documentType ||
      !documentNumber ||
      !validDate(issueDate) ||
      !validDate(expiryDate) ||
      expiryDate < issueDate ||
      !ObjectId.isValid(fileId)
    ) {
      return NextResponse.json(
        {
          error:
            "Enter valid document details, dates, and an uploaded file.",
        },
        { status: 400 }
      );
    }

    const db = await getMongoDb();

    const uploadedFile = await db
      .collection("uploads.files")
      .findOne({ _id: new ObjectId(fileId) });

    if (!uploadedFile) {
      return NextResponse.json(
        { error: "Uploaded file not found in MongoDB." },
        { status: 404 }
      );
    }

    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          vehicleId,
          registrationNumber,
          documentType,
          documentNumber,
          issueDate,
          expiryDate,
          fileId,
          status:
            expiryDate < new Date().toISOString().slice(0, 10)
              ? "EXPIRED"
              : "VALID",
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Vehicle document not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Vehicle document updated successfully.",
    });
  } catch (error) {
    console.error("PUT vehicle document error:", error);

    return NextResponse.json(
      { error: "Failed to update vehicle document." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "A valid document record ID is required." },
        { status: 400 }
      );
    }

    const db = await getMongoDb();

    const result = await db.collection(COLLECTION).deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Vehicle document not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Vehicle document deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE vehicle document error:", error);

    return NextResponse.json(
      { error: "Failed to delete vehicle document." },
      { status: 500 }
    );
  }
}