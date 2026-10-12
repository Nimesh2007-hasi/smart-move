
"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

type TripMedia = {
  _id: string;
  tripId: number;
  mediaType: string;
  title: string;
  fileId?: string;
  fileUrl?: string;
  uploadedBy?: string;
  tags?: string[];
  uploadedAt?: string;
  visibility: string;
};

type MediaForm = {
  tripId: string;
  mediaType: string;
  title: string;
  fileId: string;
  uploadedBy: string;
  visibility: string;
};

const emptyForm: MediaForm = {
  tripId: "1",
  mediaType: "Image",
  title: "",
  fileId: "",
  uploadedBy: "",
  visibility: "PUBLIC",
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "application/pdf",
];

export default function TripMediaPage() {
  const [media, setMedia] = useState<TripMedia[]>([]);
  const [tripFilter, setTripFilter] = useState("1");
  const [form, setForm] = useState<MediaForm>(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadMedia = useCallback(async () => {
    const parsedTripId = Number(tripFilter);

    if (
      !tripFilter.trim() ||
      !Number.isInteger(parsedTripId) ||
      parsedTripId < 1
    ) {
      setMedia([]);
      setLoading(false);
      setError("Enter a valid Trip ID greater than zero.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/trip-media?tripId=${encodeURIComponent(tripFilter)}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load trip media.");
      }

      setMedia(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load trip media."
      );
    } finally {
      setLoading(false);
    }
  }, [tripFilter]);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  function openAddForm() {
    setEditingId(null);
    setSelectedFile(null);
    setForm({ ...emptyForm, tripId: tripFilter });
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function openEditForm(item: TripMedia) {
    setEditingId(item._id);
    setSelectedFile(null);

    setForm({
      tripId: String(item.tripId),
      mediaType: item.mediaType,
      title: item.title,
      fileId: item.fileId || "",
      uploadedBy: item.uploadedBy || "",
      visibility: item.visibility || "PUBLIC",
    });

    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setSelectedFile(null);
    setForm({ ...emptyForm, tripId: tripFilter });
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const tripId = Number(form.tripId);

      if (!Number.isInteger(tripId) || tripId < 1) {
        throw new Error("Enter a valid Trip ID.");
      }

      if (!form.title.trim()) {
        throw new Error("Enter a media title.");
      }

      let fileId = form.fileId;

      if (selectedFile) {
        if (selectedFile.size === 0) {
          throw new Error("The selected file is empty.");
        }

        if (selectedFile.size > MAX_FILE_SIZE) {
          throw new Error("The maximum file size is 20 MB.");
        }

        if (!ALLOWED_TYPES.includes(selectedFile.type)) {
          throw new Error(
            "Allowed file types: JPG, PNG, WebP, MP4 and PDF."
          );
        }

        const uploadData = new FormData();
        uploadData.append("file", selectedFile);

        const uploadResponse = await fetch("/api/files/upload", {
          method: "POST",
          body: uploadData,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(
            uploadResult.error || "File upload failed."
          );
        }

        fileId = uploadResult.fileId;
      }

      if (!fileId) {
        throw new Error("Please select a file to upload.");
      }

      const response = await fetch("/api/trip-media", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripId,
          mediaType: form.mediaType,
          title: form.title.trim(),
          fileId,
          uploadedBy: form.uploadedBy.trim(),
          visibility: form.visibility,
          id: editingId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save trip media."
        );
      }

      const savedTripId = String(tripId);

      setTripFilter(savedTripId);
      setForm({ ...emptyForm, tripId: savedTripId });
      setSelectedFile(null);
      setEditingId(null);
      setShowForm(false);
      setSuccess(
        editingId
          ? "Trip media updated successfully."
          : "Trip media uploaded and saved successfully."
      );

      // Refresh immediately when the active filter is unchanged.
      if (savedTripId === tripFilter) {
        await loadMedia();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save trip media."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (
      !window.confirm(
        "Are you sure you want to delete this media record?"
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/trip-media?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete media."
        );
      }

      setSuccess("Trip media record deleted successfully.");
      await loadMedia();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete media."
      );
    }
  }

  function getMediaUrl(item: TripMedia) {
    if (item.fileId) {
      return `/api/files/${encodeURIComponent(item.fileId)}`;
    }

    return item.fileUrl || "";
  }

  function getMediaLabel(item: TripMedia) {
    if (item.fileId) return "Open uploaded file";
    if (item.fileUrl) return "Open existing URL";
    return "No file";
  }

  return (
    <div className="min-h-screen">
      <Sidebar />

      <div className="ml-64">
        <Header />

        <main className="p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#44506a]">
                Trip Media
              </h1>
              <p className="mt-2 text-[#7a869a]">
                Manage trip photos, videos and documents stored in
                MongoDB GridFS.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddForm}
              className="neu-btn px-6 py-3"
            >
              + Add Trip Media
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

          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="neu-flat mt-8 space-y-5 p-6"
            >
              <h2 className="text-xl font-semibold text-[#44506a]">
                {editingId ? "Update Trip Media" : "Add Trip Media"}
              </h2>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="tripId"
                    className="mb-2 block font-medium"
                  >
                    Trip ID *
                  </label>
                  <input
                    id="tripId"
                    type="number"
                    min="1"
                    required
                    value={form.tripId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tripId: e.target.value,
                      })
                    }
                    className="neu-input w-full px-4 py-3"
                  />
                </div>

                <div>
                  <label
                    htmlFor="mediaType"
                    className="mb-2 block font-medium"
                  >
                    Media Type *
                  </label>
                  <select
                    id="mediaType"
                    required
                    value={form.mediaType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        mediaType: e.target.value,
                      })
                    }
                    className="neu-input w-full px-4 py-3"
                  >
                    <option value="Image">Image</option>
                    <option value="Video">Video</option>
                    <option value="Document">Document</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="title"
                    className="mb-2 block font-medium"
                  >
                    Title *
                  </label>
                  <input
                    id="title"
                    required
                    maxLength={150}
                    value={form.title}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title: e.target.value,
                      })
                    }
                    placeholder="Enter media title"
                    className="neu-input w-full px-4 py-3"
                  />
                </div>

                <div>
                  <label
                    htmlFor="mediaFile"
                    className="mb-2 block font-medium"
                  >
                    Select File {!form.fileId && "*"}
                  </label>
                  <input
                    id="mediaFile"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,application/pdf"
                    required={!form.fileId}
                    onChange={(e) =>
                      setSelectedFile(
                        e.target.files?.[0] ?? null
                      )
                    }
                    className="neu-input w-full px-4 py-3"
                  />
                  <p className="mt-2 text-sm text-[#7a869a]">
                    JPG, PNG, WebP, MP4 or PDF. Maximum 20 MB.
                  </p>

                  {form.fileId && !selectedFile && (
                    <p className="mt-2 text-sm text-green-700">
                      Existing MongoDB file attached. Choose another
                      file to replace it.
                    </p>
                  )}

                  {selectedFile && (
                    <p className="mt-2 break-all text-sm text-[#44506a]">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="uploadedBy"
                    className="mb-2 block font-medium"
                  >
                    Uploaded By
                  </label>
                  <input
                    id="uploadedBy"
                    value={form.uploadedBy}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        uploadedBy: e.target.value,
                      })
                    }
                    placeholder="Admin name"
                    className="neu-input w-full px-4 py-3"
                  />
                </div>

                <div>
                  <label
                    htmlFor="visibility"
                    className="mb-2 block font-medium"
                  >
                    Visibility
                  </label>
                  <select
                    id="visibility"
                    value={form.visibility}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        visibility: e.target.value,
                      })
                    }
                    className="neu-input w-full px-4 py-3"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private</option>
                  </select>
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
                      ? "Update Media"
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
            <label
              htmlFor="tripFilter"
              className="font-medium"
            >
              Filter by Trip ID
            </label>

            <input
              id="tripFilter"
              type="number"
              min="1"
              value={tripFilter}
              onChange={(e) => setTripFilter(e.target.value)}
              className="neu-input w-40 px-4 py-3"
            />

            <button
              type="button"
              onClick={() => void loadMedia()}
              className="neu-btn px-5 py-3"
            >
              Refresh
            </button>
          </div>

          <div className="neu-flat mt-8 overflow-x-auto p-6">
            <h2 className="text-xl font-semibold text-[#44506a]">
              Trip Media Records ({media.length})
            </h2>

            {loading ? (
              <p className="py-8">
                Loading media from MongoDB...
              </p>
            ) : (
              <table className="neu-table mt-5 w-full min-w-[1000px]">
                <thead>
                  <tr className="text-left text-sm text-[#7a869a]">
                    <th className="px-4 py-4">Trip ID</th>
                    <th className="px-4 py-4">Type</th>
                    <th className="px-4 py-4">Title</th>
                    <th className="px-4 py-4">File</th>
                    <th className="px-4 py-4">Uploaded By</th>
                    <th className="px-4 py-4">Upload Date</th>
                    <th className="px-4 py-4">Visibility</th>
                    <th className="px-4 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {media.map((item) => {
                    const fileUrl = getMediaUrl(item);

                    return (
                      <tr key={item._id}>
                        <td className="px-4 py-4">
                          {item.tripId}
                        </td>
                        <td className="px-4 py-4">
                          {item.mediaType}
                        </td>
                        <td className="px-4 py-4">
                          {item.title}
                        </td>
                        <td className="px-4 py-4">
                          {fileUrl ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 underline"
                            >
                              {getMediaLabel(item)}
                            </a>
                          ) : (
                            <span className="text-[#7a869a]">
                              No file attached
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {item.uploadedBy || "—"}
                        </td>
                        <td className="px-4 py-4">
                          {item.uploadedAt
                            ? new Date(
                                item.uploadedAt
                              ).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-4">
                          {item.visibility}
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
                              onClick={() =>
                                void handleDelete(item._id)
                              }
                              className="neu-btn px-3 py-2 text-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {media.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-[#7a869a]"
                      >
                        No media records found for this trip.
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