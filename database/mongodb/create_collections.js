
const dbName = "smart_move_mongodb";
const database = db.getSiblingDB(dbName);

const collections = [
  "passenger_reviews",
  "announcements",
  "trip_media",
  "vehicle_documents"
];

collections.forEach((name) => {
  if (!database.getCollectionNames().includes(name)) {
    database.createCollection(name);
    print(`Created collection: ${name}`);
  } else {
    print(`Collection already exists: ${name}`);
  }
});
