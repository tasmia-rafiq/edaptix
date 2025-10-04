// app/api/users/students/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((user as any).role !== "teacher") {
      return NextResponse.json({ error: "Forbidden: Only teachers can view students" }, { status: 403 });
    }

    await connectToDatabase();

    const students = await User.find({ role: "student" })
      .select("_id name email")
      .lean();

    return NextResponse.json(students);
  } catch (err: any) {
    console.error("Error fetching students:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
