
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "smart_move_mongodb";

if (!uri) {
  throw new Error("Please configure MONGODB_URI in .env.local");
}

const globalForMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

const clientPromise =
  globalForMongo.mongoClientPromise ??
  new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  })
    .connect()
    .catch((error) => {
      // Avoid logging the URI or database credentials.
      console.error("MongoDB connection failed:", {
        name: error?.name,
        code: error?.code,
        message: error?.message,
      });

      // Allow a later request to retry the connection.
      if (process.env.NODE_ENV !== "production") {
        delete globalForMongo.mongoClientPromise;
      }

      throw error;
    });

if (process.env.NODE_ENV !== "production") {
  globalForMongo.mongoClientPromise = clientPromise;
}

export async function getMongoDb() {
  const client = await clientPromise;
  return client.db(dbName);
}
