
const database = db.getSiblingDB("smart_move_mongodb");

// Display all published reviews
database.passenger_reviews.find({
  status: "PUBLISHED"
}).sort({ createdAt: -1 });

// Find reviews for a specific trip
database.passenger_reviews.find({
  tripId: 1,
  status: "PUBLISHED"
});

// Find reviews with ratings of 4 or 5
database.passenger_reviews.find({
  rating: { $gte: 4 },
  status: "PUBLISHED"
});

// Calculate average passenger rating
database.passenger_reviews.aggregate([
  { $match: { status: "PUBLISHED" } },
  {
    $group: {
      _id: null,
      averageRating: { $avg: "$rating" },
      totalReviews: { $sum: 1 }
    }
  }
]);

// Search reviews containing a keyword
database.passenger_reviews.find({
  status: "PUBLISHED",
  comment: { $regex: "clean", $options: "i" }
});




// Display published announcements
database.announcements.find({
  published: true
}).sort({ createdAt: -1 });

// Find announcements by type
database.announcements.find({
  type: "SCHEDULE"
});

// Find announcements that have not expired
database.announcements.find({
  published: true,
  $or: [
    { expiresAt: { $exists: false } },
    { expiresAt: null },
    { expiresAt: { $gte: new Date() } }
  ]
}).sort({ createdAt: -1 });
