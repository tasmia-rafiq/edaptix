import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI ?? (() => {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
})();

let isConnected = false;

export async function connectToDatabase() {
  // Prevent multiple connections in development
  if (isConnected) {
    console.log("MongoDB is already connected.");
    return;
  }

  // Prevent connection attempts on the client side
  if (typeof window !== 'undefined') {
    console.log("Skipping database connection on client side");
    return;
  }

  try {
    const opts = {
      dbName: "edaptix",
      bufferCommands: false,
    };

    await mongoose.connect(MONGODB_URI!, opts);
    isConnected = true;
    console.log("MongoDB Connected.");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}