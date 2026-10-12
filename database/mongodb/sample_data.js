
const dbName = "smart_move_mongodb";
const database = db.getSiblingDB(dbName);

// 1. Vehicle documents
database.vehicle_documents.insertMany([
  {
    vehicleId: "1",
    registrationNumber: "WP-NA-1234",
    documentType: "INSURANCE",
    documentNumber: "INS-2026-001",
    issueDate: "2026-01-01",
    expiryDate: "2027-01-01",
    fileUrl: "https://example.com/documents/insurance-001.pdf",
    status: "VALID",
    uploadedAt: ISODate("2026-10-09T10:00:00Z"),
    fileId: "sample-file-001"
  },
  {
    vehicleId: "2",
    registrationNumber: "WP-NB-5678",
    documentType: "REVENUE_LICENSE",
    documentNumber: "RL-2026-002",
    issueDate: "2026-03-01",
    expiryDate: "2027-03-01",
    fileUrl: "https://example.com/documents/revenue-license-002.pdf",
    status: "VALID",
    uploadedAt: ISODate("2026-10-09T10:15:00Z"),
    fileId: "sample-file-002"
  },
  {
    vehicleId: "3",
    registrationNumber: "WP-NC-9012",
    documentType: "FITNESS_CERTIFICATE",
    documentNumber: "FC-2026-003",
    issueDate: "2025-11-01",
    expiryDate: "2026-11-01",
    fileUrl: "https://example.com/documents/fitness-003.pdf",
    status: "EXPIRING_SOON",
    uploadedAt: ISODate("2026-10-09T10:20:00Z"),
    fileId: "sample-file-003"
  }
]);

// 2. Trip media
database.trip_media.insertMany([
  {
    tripId: 1,
    mediaType: "IMAGE",
    title: "Bus Interior",
    fileUrl: "https://example.com/media/bus-interior.jpg",
    uploadedBy: "admin",
    tags: ["bus", "interior", "passenger-comfort"],
    uploadedAt: ISODate("2026-10-09T10:30:00Z"),
    visibility: "PUBLIC"
  },
  {
    tripId: 1,
    mediaType: "IMAGE",
    title: "Passenger Boarding Area",
    fileUrl: "https://example.com/media/boarding-area.jpg",
    uploadedBy: "admin",
    tags: ["boarding", "terminal"],
    uploadedAt: ISODate("2026-10-09T10:45:00Z"),
    visibility: "PUBLIC"
  },
  {
    tripId: 2,
    mediaType: "VIDEO",
    title: "Trip Departure",
    fileUrl: "https://example.com/media/trip-departure.mp4",
    uploadedBy: "admin",
    tags: ["departure", "journey"],
    uploadedAt: ISODate("2026-10-09T11:00:00Z"),
    visibility: "PUBLIC"
  },
  {
    tripId: 2,
    mediaType: "IMAGE",
    title: "Vehicle Inspection",
    fileUrl: "https://example.com/media/vehicle-inspection.jpg",
    uploadedBy: "admin",
    tags: ["inspection", "safety"],
    uploadedAt: ISODate("2026-10-09T11:15:00Z"),
    visibility: "PRIVATE"
  }
]);

// 3. Passenger reviews
database.passenger_reviews.insertMany([
  {
    passengerId: 1,
    tripId: 1,
    rating: 5,
    comment: "Great transport service!",
    categories: ["cleanliness", "punctuality"],
    status: "PUBLISHED",
    createdAt: ISODate("2026-10-09T10:00:00Z")
  },
  {
    passengerId: 2,
    tripId: 1,
    rating: 4,
    comment: "Comfortable journey and friendly service.",
    categories: ["comfort", "staff"],
    status: "PUBLISHED",
    createdAt: ISODate("2026-10-09T11:00:00Z")
  },
  {
    passengerId: 3,
    tripId: 2,
    rating: 3,
    comment: "The bus arrived later than scheduled.",
    categories: ["punctuality"],
    status: "PUBLISHED",
    createdAt: ISODate("2026-10-09T12:00:00Z")
  },
  {
    passengerId: 1,
    tripId: 2,
    rating: 2,
    comment: "The vehicle needs better cleaning.",
    categories: ["cleanliness"],
    status: "PUBLISHED",
    createdAt: ISODate("2026-10-09T13:00:00Z")
  },
  {
    passengerId: 2,
    tripId: 2,
    rating: 5,
    comment: "Excellent driver and a smooth journey.",
    categories: ["driver", "comfort"],
    status: "PUBLISHED",
    createdAt: ISODate("2026-10-09T14:00:00Z")
  }
]);

// 4. Announcements
database.announcements.insertMany([
  {
    title: "New Bus Schedule",
    message: "A revised bus schedule will take effect from Monday. Please check your trip details before travelling.",
    type: "SCHEDULE",
    audience: "ALL",
    published: true,
    createdAt: ISODate("2026-10-09T08:00:00Z"),
    expiresAt: ISODate("2027-12-31T23:59:59Z")
  },
  {
    title: "Holiday Service Update",
    message: "Additional services may operate during public holidays. Check the website for available trips.",
    type: "SERVICE_UPDATE",
    audience: "ALL",
    published: true,
    createdAt: ISODate("2026-10-10T08:00:00Z"),
    expiresAt: ISODate("2027-12-31T23:59:59Z")
  },
  {
    title: "Maintenance Notice",
    message: "Some services may experience delays due to scheduled vehicle maintenance.",
    type: "MAINTENANCE",
    audience: "ALL",
    published: true,
    createdAt: ISODate("2026-10-11T08:00:00Z"),
    expiresAt: ISODate("2027-01-31T23:59:59Z")
  },
  {
    title: "System Maintenance",
    message: "The booking service may be temporarily unavailable during planned system maintenance.",
    type: "SYSTEM",
    audience: "ALL",
    published: false,
    createdAt: ISODate("2026-10-11T09:00:00Z"),
    expiresAt: ISODate("2027-01-31T23:59:59Z")
  }
]);

print("Smart Move MongoDB sample data inserted.");
