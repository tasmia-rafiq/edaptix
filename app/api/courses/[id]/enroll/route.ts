import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/database";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect("/signin");
  }

  await connectToDatabase();

  const courseId = (await params).id;
  const course = await Course.findById(courseId).lean();
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // if course is not published, prevent enrollment unless creator
  const viewerId = (user as any)._id ?? (user as any).id;
  const isCreator = String(course.createdBy) === String(viewerId);
  if (!course.published && !isCreator) {
    return NextResponse.json({ error: "Course not public" }, { status: 403 });
  }

  // If paid course, redirect to checkout placeholder
  if (course.price && Number(course.price) > 0) {
    // You should replace this with your payment flow.
    // Redirect to a checkout route (not implemented here).
    return NextResponse.redirect(`/dashboard/courses/${courseId}/checkout`);
  }

  // free course: create enrollment (unique index prevents duplicates)
  try {
    await Enrollment.create({
      courseId,
      studentId: viewerId,
    });
  } catch (err: any) {
    // duplicate key -> already enrolled
    if (err?.code === 11000) {
      // already enrolled; just redirect to course start
      return NextResponse.redirect(`/dashboard/courses/${courseId}/start`);
    }
    console.error("Enrollment error:", err);
    return NextResponse.json({ error: "Could not enroll" }, { status: 500 });
  }

  // success -> redirect to course start / dashboard course player
  return NextResponse.redirect(`/dashboard/courses/${courseId}/start`);
}