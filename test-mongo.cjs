
const { MongoClient } = require("mongodb");

async function testConnection() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI was not loaded from .env.local");
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  try {
    console.log("Testing MongoDB Atlas connection...");

    await client.connect();
    const result = await client.db("admin").command({ ping: 1 });

    console.log("SUCCESS: MongoDB connection works.", result);
  } catch (error) {
    console.error("MongoDB connection test failed:");
    console.error(error);
  } finally {
    await client.close().catch(() => {});
  }
}

testConnection();
