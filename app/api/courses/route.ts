import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";
import Course from "@/models/Course";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const {
    title,
    subtitle,
    description,
    coverImage,
    category,
    level,
    language,
    tags,
    price,
    estimatedDuration,
    published,
    lessons,
  } = data ?? {};

  if (!title || !Array.isArray(lessons) || lessons.length === 0) {
    return NextResponse.json({ error: "Missing required fields (title, lessons)" }, { status: 400 });
  }

  await connectToDatabase();

  try {
    const course = new Course({
      title: String(title).trim(),
      subtitle: subtitle ? String(subtitle).trim() : undefined,
      description: description ? String(description).trim() : undefined,
      coverImage: coverImage ? String(coverImage).trim() : undefined,
      category: category ? String(category).trim() : undefined,
      level: level ? String(level) : undefined,
      language: language ? String(language) : undefined,
      tags: Array.isArray(tags) ? tags.map(String) : [],
      price: typeof price === "number" ? price : Number(price) || 0,
      estimatedDuration: typeof estimatedDuration === "number" ? estimatedDuration : (estimatedDuration ? Number(estimatedDuration) : undefined),
      published: Boolean(published),
      createdBy: (user as any)._id ?? (user as any).id,
      lessons: lessons.map((l: any) => ({
        title: String(l.title || "").trim(),
        type: l.type === "article" ? "article" : "video",
        content: String(l.content || "").trim(),
        testId: l.testId ? l.testId : undefined,
        summary: l.summary ? String(l.summary).trim() : undefined,
        durationMinutes: l.durationMinutes ? Number(l.durationMinutes) : undefined,
      })),
    });

    await course.save();

    return NextResponse.json({ ok: true, id: String(course._id) }, { status: 201 });
  } catch (err) {
    console.error("Create course error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}