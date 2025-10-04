import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";
import User from "@/models/User";

export async function GET() {
  try {
    await connectToDatabase();

    // Fetch only students
    const students = await User.find({ role: "student" }).select("name email _id").lean();

    return NextResponse.json(students);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}
