// app/api/courses/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/database";
import Course from "@/models/Course";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  const body = await req.json();

  await connectToDatabase();
  const course = await Course.findById(id);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  // ownership check
  if (String(course.createdBy) !== String((user as any)._id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // update fields (whitelist)
  course.title = body.title ?? course.title;
  course.subtitle = body.subtitle ?? course.subtitle;
  course.description = body.description ?? course.description;
  course.coverImage = body.coverImage ?? course.coverImage;
  course.category = body.category ?? course.category;
  course.level = body.level ?? course.level;
  course.language = body.language ?? course.language;
  course.tags = Array.isArray(body.tags) ? body.tags : course.tags;
  course.price = typeof body.price !== "undefined" ? body.price : course.price;
  course.published = Boolean(body.published);
  course.estimatedDuration = typeof body.estimatedDuration !== "undefined" ? body.estimatedDuration : course.estimatedDuration;

  // replace lessons array (you could do more sophisticated merging)
  if (Array.isArray(body.lessons)) {
    course.lessons = body.lessons.map((l: any) => ({
      title: String(l.title || ""),
      type: l.type === "article" ? "article" : "video",
      content: String(l.content || ""),
      testId: l.testId || undefined,
      summary: l.summary || undefined,
      durationMinutes: l.durationMinutes || undefined,
    }));
  }

  try {
    await course.save();
    return NextResponse.json({ ok: true, id: String(course._id) });
  } catch (err) {
    console.error("Update course error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  const course = await Course.findById(params.id);
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (String(course.createdBy) !== String((user as any)._id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await Course.deleteOne({ _id: params.id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete course error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
