import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

let cached = (global as any)._mongoose;

if (!cached) {
  cached = (global as any)._mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    console.log("MongoDB is already connected.");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      dbName: "edaptix",
      bufferCommands: false,
      // useNewUrlParser etc are default in Mongoose 7+
    } as any;

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log("MongoDB connected successfully.")
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
