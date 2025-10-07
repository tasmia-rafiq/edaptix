import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/database";
import Course from "@/models/Course";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courseId = params.id;
  await connectToDatabase();

  const course = await Course.findById(courseId);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const viewerId = (user as any)._id ?? (user as any).id;
  if (String(course.createdBy) !== String(viewerId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // delete the course document
  await Course.deleteOne({ _id: courseId });

  // NOTE: if you'd like to remove uploaded Cloudinary assets, implement that here (optional).

  // redirect teacher back to /dashboard
  return NextResponse.redirect(new URL("/dashboard", req.url));
}
