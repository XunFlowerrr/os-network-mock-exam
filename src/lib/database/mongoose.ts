import { env } from "@/util/envLoader";
import mongoose, { Mongoose } from "mongoose";

interface MongooseConnection {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

const MONGODB_URI =
  process.env.MONGODB_URI || env.MONGODB_URI || "your_default_mongodb_uri";
let cached: MongooseConnection = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export const connectToDatabase = async () => {
  console.log("Connecting to database");
  if (cached.conn) {
    return cached.conn;
  }

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: "auto-mock-cluster",
        bufferCommands: false,
      })
      .then((mongoose) => {
        console.log("Connected to MongoDB");
        return mongoose;
      })
      .catch((error) => {
        console.error("MongoDB connection error:", error);
        throw error;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
};
