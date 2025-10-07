import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/database";
import Course from "@/models/Course";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courseId = params.id;
  const data = await req.json();

  await connectToDatabase();

  const course = await Course.findById(courseId);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const viewerId = (user as any)._id ?? (user as any).id;
  if (String(course.createdBy) !== String(viewerId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // validate minimal fields (adapt as needed)
  if (!data?.title || !Array.isArray(data?.lessons) || data.lessons.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // apply updates (whitelist expected fields)
  course.title = String(data.title || course.title).trim();
  course.subtitle = data.subtitle ? String(data.subtitle).trim() : data.subtitle === "" ? undefined : course.subtitle;
  course.description = data.description ? String(data.description).trim() : course.description;
  course.coverImage = data.coverImage ? String(data.coverImage).trim() : course.coverImage;
  course.category = data.category ? String(data.category).trim() : course.category;
  course.level = data.level ? String(data.level) : course.level;
  course.language = data.language ? String(data.language) : course.language;
  course.tags = Array.isArray(data.tags) ? data.tags.map(String) : course.tags;
  course.price = typeof data.price === "number" ? data.price : course.price;
  course.estimatedDuration = typeof data.estimatedDuration === "number" ? data.estimatedDuration : course.estimatedDuration;
  // allow updating published flag as well
  if (typeof data.published !== "undefined") course.published = Boolean(data.published);

  // lessons mapping: replace entire lessons array (you can fine-tune to merge/patch)
  course.lessons = (data.lessons || []).map((l: any) => ({
    title: String(l.title || "").trim(),
    type: l.type === "article" ? "article" : "video",
    content: String(l.content || "").trim(),
    testId: l.testId ? l.testId : undefined,
    summary: l.summary ? String(l.summary).trim() : undefined,
    durationMinutes: l.durationMinutes ? Number(l.durationMinutes) : undefined,
  }));

  await course.save();

  return NextResponse.json({ ok: true, id: String(course._id) });
}