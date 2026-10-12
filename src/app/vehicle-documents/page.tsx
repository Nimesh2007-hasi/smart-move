"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

type VehicleDocument = {
_id: string;
vehicleId: string;
registrationNumber: string;
documentType: string;
documentNumber: string;
issueDate: string;
expiryDate: string;
fileId?: string;
fileUrl?: string;
status: string;
uploadedAt?: string;
};

type DocumentForm = {
vehicleId: string;
registrationNumber: string;
documentType: string;
documentNumber: string;
issueDate: string;
expiryDate: string;
fileId: string;
};

const emptyForm: DocumentForm = {
vehicleId: "",
registrationNumber: "",
documentType: "Registration Certificate",
documentNumber: "",
issueDate: "",
expiryDate: "",
fileId: "",
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_TYPES = [
"application/pdf",
"image/jpeg",
"image/png",
"image/webp",
];

function toText(value: unknown): string {
if (value === null || value === undefined) return "";
return String(value);
}

function toDateInput(value: unknown): string {
if (!value) return "";

const text = String(value);

// Handles both YYYY-MM-DD and ISO date strings.
const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
if (match) return match[1];

const date = new Date(text);

if (Number.isNaN(date.getTime())) return "";

const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, "0");
const day = String(date.getDate()).padStart(2, "0");

return `${year}-${month}-${day}`;
}

function normalizeDocument(raw: Record<string, unknown>): VehicleDocument {
return {
_id: toText(raw._id),
vehicleId: toText(raw.vehicleId),
registrationNumber: toText(raw.registrationNumber),
documentType: toText(raw.documentType),
documentNumber: toText(raw.documentNumber),
issueDate: toDateInput(raw.issueDate),
expiryDate: toDateInput(raw.expiryDate),
fileId: toText(raw.fileId) || undefined,
fileUrl: toText(raw.fileUrl) || undefined,
status: toText(raw.status) || "VALID",
uploadedAt: toText(raw.uploadedAt) || undefined,
};
}

async function readResponse(response: Response): Promise<Record<string, unknown> | unknown[]> {
const text = await response.text();

if (!text) return {};

try {
return JSON.parse(text) as Record<string, unknown> | unknown[];
} catch {
throw new Error("The server returned an invalid response. Check your API route.");
}
}

export default function VehicleDocumentsPage() {
const [documents, setDocuments] = useState<VehicleDocument[]>([]);
const [form, setForm] = useState<DocumentForm>({ ...emptyForm });
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [editingId, setEditingId] = useState<string | null>(null);
const [showForm, setShowForm] = useState(false);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [deletingId, setDeletingId] = useState<string | null>(null);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");
const [vehicleFilter, setVehicleFilter] = useState("");

const loadDocuments = useCallback(async () => {
setLoading(true);
setError("");

try {
  const response = await fetch("/api/vehicle-documents", {
    cache: "no-store",
  });

  const result = await readResponse(response);

  if (!response.ok) {
    const message =
      !Array.isArray(result) && typeof result.error === "string"
        ? result.error
        : "Failed to load vehicle documents.";

    throw new Error(message);
  }

  if (!Array.isArray(result)) {
    throw new Error("Unexpected vehicle documents response. Check the GET API route.");
  }

  setDocuments(
    result.map((item) =>
      normalizeDocument(item as Record<string, unknown>)
    )
  );
} catch (err) {
  setError(
    err instanceof Error
      ? err.message
      : "Failed to load vehicle documents."
  );
} finally {
  setLoading(false);
}


}, []);

useEffect(() => {
void loadDocuments();
}, [loadDocuments]);

function openAddForm() {
setEditingId(null);
setSelectedFile(null);
setForm({ ...emptyForm });
setShowForm(true);
setError("");
setSuccess("");
}

function openEditForm(item: VehicleDocument) {
setEditingId(item._id);
setSelectedFile(null);

setForm({
  vehicleId: toText(item.vehicleId),
  registrationNumber: toText(item.registrationNumber),
  documentType: toText(item.documentType) || "Registration Certificate",
  documentNumber: toText(item.documentNumber),
  issueDate: toDateInput(item.issueDate),
  expiryDate: toDateInput(item.expiryDate),
  fileId: toText(item.fileId),
});

setShowForm(true);
setError("");
setSuccess("");


}

function closeForm() {
setShowForm(false);
setEditingId(null);
setSelectedFile(null);
setForm({ ...emptyForm });
}

async function handleSubmit(e: FormEvent<HTMLFormElement>) {
e.preventDefault();


if (saving) return;

setSaving(true);
setError("");
setSuccess("");

try {
  // Convert every form field to a safe string before validation.
  const vehicleId = toText(form.vehicleId).trim();
  const registrationNumber = toText(form.registrationNumber).trim();
  const documentType = toText(form.documentType).trim();
  const documentNumber = toText(form.documentNumber).trim();
  const issueDate = toText(form.issueDate).trim();
  const expiryDate = toText(form.expiryDate).trim();

  if (!vehicleId) {
    throw new Error("Vehicle ID is required.");
  }

  if (!registrationNumber) {
    throw new Error("Registration number is required.");
  }

  if (!documentType) {
    throw new Error("Please select a document type.");
  }

  if (!documentNumber) {
    throw new Error("Document number is required.");
  }

  if (!issueDate || !expiryDate) {
    throw new Error("Please enter both issue and expiry dates.");
  }

  if (issueDate > expiryDate) {
    throw new Error("Issue date cannot be later than expiry date.");
  }

  let fileId = toText(form.fileId).trim();

  if (selectedFile) {
    if (selectedFile.size === 0) {
      throw new Error("The selected file is empty.");
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      throw new Error("The maximum file size is 20 MB.");
    }

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      throw new Error("Allowed file types are PDF, JPG, PNG and WebP.");
    }

    const uploadData = new FormData();
    uploadData.append("file", selectedFile);

    const uploadResponse = await fetch("/api/files/upload", {
      method: "POST",
      body: uploadData,
    });

    const uploadResult = await readResponse(uploadResponse);

    if (!uploadResponse.ok) {
      const message =
        !Array.isArray(uploadResult) &&
        typeof uploadResult.error === "string"
          ? uploadResult.error
          : "Document upload failed.";

      throw new Error(message);
    }

    if (
      Array.isArray(uploadResult) ||
      typeof uploadResult.fileId !== "string" ||
      !uploadResult.fileId
    ) {
      throw new Error("Upload completed without returning a file ID.");
    }

    fileId = uploadResult.fileId;
  }

  if (!fileId) {
    throw new Error("Please select a document file.");
  }

  const payload = {
    vehicleId,
    registrationNumber,
    documentType,
    documentNumber,
    issueDate,
    expiryDate,
    fileId,
    ...(editingId ? { id: editingId } : {}),
  };

  const response = await fetch("/api/vehicle-documents", {
    method: editingId ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await readResponse(response);

  if (!response.ok) {
    const message =
      !Array.isArray(result) && typeof result.error === "string"
        ? result.error
        : "Failed to save vehicle document.";

    throw new Error(message);
  }

  closeForm();

  setSuccess(
    editingId
      ? "Vehicle document updated successfully."
      : "Vehicle document uploaded successfully."
  );

  await loadDocuments();
} catch (err) {
  setError(
    err instanceof Error
      ? err.message
      : "Failed to save vehicle document."
  );
} finally {
  setSaving(false);
}


}

async function handleDelete(id: string) {
if (deletingId) return;


const confirmed = window.confirm(
  "Delete this vehicle document record? The stored file will not be deleted automatically."
);

if (!confirmed) return;

setError("");
setSuccess("");
setDeletingId(id);

try {
  const response = await fetch(
    `/api/vehicle-documents?id=${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );

  const result = await readResponse(response);

  if (!response.ok) {
    const message =
      !Array.isArray(result) && typeof result.error === "string"
        ? result.error
        : "Failed to delete document.";

    throw new Error(message);
  }

  setSuccess("Vehicle document record deleted successfully.");
  await loadDocuments();
} catch (err) {
  setError(
    err instanceof Error
      ? err.message
      : "Failed to delete document."
  );
} finally {
  setDeletingId(null);
}


}

function getStatus(item: VehicleDocument) {
const expiryDate = toDateInput(item.expiryDate);


// Use the local calendar date to avoid UTC timezone differences.
const now = new Date();
const today = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, "0"),
  String(now.getDate()).padStart(2, "0"),
].join("-");

if (expiryDate && expiryDate < today) {
  return "EXPIRED";
}

return item.status === "EXPIRED" ? "VALID" : item.status || "VALID";


}

function getFileUrl(item: VehicleDocument) {
if (item.fileId) {
return `/api/files/${encodeURIComponent(item.fileId)}`;
}


return item.fileUrl || "";


}

const query = toText(vehicleFilter).trim().toLowerCase();

const filteredDocuments = documents.filter((item) => {
if (!query) return true;


return (
  toText(item.vehicleId).toLowerCase().includes(query) ||
  toText(item.registrationNumber).toLowerCase().includes(query) ||
  toText(item.documentNumber).toLowerCase().includes(query)
);


});

const expiredCount = documents.filter(
(item) => getStatus(item) === "EXPIRED"
).length;

const validCount = documents.length - expiredCount;

return ( <div className="min-h-screen"> <Sidebar />

```
  <div className="ml-64">
    <Header />

    <main className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#44506a]">
            Vehicle Documents
          </h1>
          <p className="mt-2 text-[#7a869a]">
            Upload and manage vehicle certificates, insurance and other
            documents stored in MongoDB.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="neu-btn px-6 py-3"
        >
          + Add Document
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-red-300 p-4 text-red-600"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mt-6 rounded-lg border border-green-300 p-4 text-green-700"
        >
          {success}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="neu-flat rounded-xl p-5">
          <p className="text-sm text-[#7a869a]">Total Documents</p>
          <p className="mt-2 text-3xl font-bold text-[#44506a]">
            {documents.length}
          </p>
        </div>

        <div className="neu-flat rounded-xl p-5">
          <p className="text-sm text-[#7a869a]">Valid Documents</p>
          <p className="mt-2 text-3xl font-bold text-green-700">
            {validCount}
          </p>
        </div>

        <div className="neu-flat rounded-xl p-5">
          <p className="text-sm text-[#7a869a]">Expired Documents</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {expiredCount}
          </p>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="neu-flat mt-8 space-y-5 p-6"
        >
          <h2 className="text-xl font-semibold text-[#44506a]">
            {editingId ? "Update Vehicle Document" : "Add Vehicle Document"}
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="vehicleId" className="mb-2 block font-medium">
                Vehicle ID *
              </label>
              <input
                id="vehicleId"
                required
                maxLength={100}
                value={toText(form.vehicleId)}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    vehicleId: e.target.value,
                  }))
                }
                placeholder="Enter vehicle ID"
                className="neu-input w-full px-4 py-3"
              />
            </div>

            <div>
              <label
                htmlFor="registrationNumber"
                className="mb-2 block font-medium"
              >
                Registration Number *
              </label>
              <input
                id="registrationNumber"
                required
                maxLength={50}
                value={toText(form.registrationNumber)}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    registrationNumber: e.target.value,
                  }))
                }
                placeholder="e.g. ABC-1234"
                className="neu-input w-full px-4 py-3"
              />
            </div>

            <div>
              <label
                htmlFor="documentType"
                className="mb-2 block font-medium"
              >
                Document Type *
              </label>
              <select
                id="documentType"
                required
                value={toText(form.documentType)}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    documentType: e.target.value,
                  }))
                }
                className="neu-input w-full px-4 py-3"
              >
                <option value="Registration Certificate">
                  Registration Certificate
                </option>
                <option value="Revenue License">Revenue License</option>
                <option value="Insurance">Insurance</option>
                <option value="Fitness Certificate">
                  Fitness Certificate
                </option>
                <option value="Emission Test">Emission Test</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="documentNumber"
                className="mb-2 block font-medium"
              >
                Document Number *
              </label>
              <input
                id="documentNumber"
                required
                maxLength={100}
                value={toText(form.documentNumber)}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    documentNumber: e.target.value,
                  }))
                }
                placeholder="Enter document number"
                className="neu-input w-full px-4 py-3"
              />
            </div>

            <div>
              <label htmlFor="issueDate" className="mb-2 block font-medium">
                Issue Date *
              </label>
              <input
                id="issueDate"
                type="date"
                required
                value={toDateInput(form.issueDate)}
                max={form.expiryDate || undefined}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    issueDate: e.target.value,
                  }))
                }
                className="neu-input w-full px-4 py-3"
              />
            </div>

            <div>
              <label
                htmlFor="expiryDate"
                className="mb-2 block font-medium"
              >
                Expiry Date *
              </label>
              <input
                id="expiryDate"
                type="date"
                required
                min={form.issueDate || undefined}
                value={toDateInput(form.expiryDate)}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    expiryDate: e.target.value,
                  }))
                }
                className="neu-input w-full px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="documentFile"
                className="mb-2 block font-medium"
              >
                Upload Document {!form.fileId && "*"}
              </label>

              <input
                id="documentFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                required={!form.fileId}
                onChange={(e) =>
                  setSelectedFile(e.target.files?.[0] ?? null)
                }
                className="neu-input w-full px-4 py-3"
              />

              <p className="mt-2 text-sm text-[#7a869a]">
                PDF, JPG, PNG or WebP. Maximum size: 20 MB.
              </p>

              {form.fileId && !selectedFile && (
                <p className="mt-2 text-sm text-green-700">
                  An existing MongoDB file is attached. Choose a new file
                  only if you want to replace it.
                </p>
              )}

              {selectedFile && (
                <p className="mt-2 break-all text-sm text-[#44506a]">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="neu-btn px-6 py-3 disabled:opacity-50"
            >
              {saving
                ? "Uploading and saving..."
                : editingId
                  ? "Update Document"
                  : "Upload and Save"}
            </button>

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="neu-btn px-6 py-3 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="neu-flat mt-8 flex flex-wrap items-center gap-4 p-5">
        <label htmlFor="vehicleFilter" className="font-medium">
          Search Vehicle / Registration / Document
        </label>

        <input
          id="vehicleFilter"
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
          placeholder="Enter a search term"
          className="neu-input min-w-[240px] px-4 py-3"
        />

        <button
          type="button"
          onClick={() => void loadDocuments()}
          disabled={loading}
          className="neu-btn px-5 py-3 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="neu-flat mt-8 overflow-x-auto p-6">
        <h2 className="text-xl font-semibold text-[#44506a]">
          Vehicle Document Records ({filteredDocuments.length})
        </h2>

        {loading ? (
          <p className="py-8">Loading vehicle documents...</p>
        ) : (
          <table className="neu-table mt-5 w-full min-w-[1200px]">
            <thead>
              <tr className="text-left text-sm text-[#7a869a]">
                <th className="px-4 py-4">Vehicle ID</th>
                <th className="px-4 py-4">Registration</th>
                <th className="px-4 py-4">Document Type</th>
                <th className="px-4 py-4">Document Number</th>
                <th className="px-4 py-4">Issue Date</th>
                <th className="px-4 py-4">Expiry Date</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">File</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredDocuments.map((item) => {
                const fileUrl = getFileUrl(item);
                const status = getStatus(item);

                return (
                  <tr key={item._id}>
                    <td className="px-4 py-4">{item.vehicleId || "—"}</td>
                    <td className="px-4 py-4">
                      {item.registrationNumber || "—"}
                    </td>
                    <td className="px-4 py-4">{item.documentType || "—"}</td>
                    <td className="px-4 py-4">
                      {item.documentNumber || "—"}
                    </td>
                    <td className="px-4 py-4">{item.issueDate || "—"}</td>
                    <td className="px-4 py-4">{item.expiryDate || "—"}</td>
                    <td className="px-4 py-4">
                      <span
                        className={
                          status === "EXPIRED"
                            ? "rounded-full bg-red-100 px-3 py-1 text-sm text-red-700"
                            : "rounded-full bg-green-100 px-3 py-1 text-sm text-green-700"
                        }
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {fileUrl ? (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 underline"
                        >
                          Open Document
                        </a>
                      ) : (
                        <span className="text-[#7a869a]">No file</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(item)}
                          className="neu-btn px-3 py-2"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === item._id}
                          onClick={() => void handleDelete(item._id)}
                          className="neu-btn px-3 py-2 text-red-600 disabled:opacity-50"
                        >
                          {deletingId === item._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredDocuments.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-[#7a869a]"
                  >
                    No vehicle documents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </main>
  </div>
</div>


);
}
