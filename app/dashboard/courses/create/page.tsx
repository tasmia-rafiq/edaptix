import React from "react";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/database";
import Test from "@/models/Test";
import Course from "@/models/Course";
import CreateCourseForm from "@/components/CreateCourseForm";

export default async function CreateCoursePage({ searchParams }: { searchParams?: Promise<{ [k:string]:any }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if ((user as any).role !== "teacher") redirect("/dashboard");

  await connectToDatabase();

  // fetch teacher tests
  const tests = await Test.find({ createdBy: (user as any)._id }).select("_id title").sort({ createdAt: -1 }).lean();
  const plainTests = (tests || []).map((t: any) => ({ id: String(t._id), title: t.title }));

  // check for edit param
  const searchParamsResolved = await searchParams;
  const editId = (searchParamsResolved && (searchParamsResolved as any).edit) ? String((searchParamsResolved as any).edit) : null;
  let plainCourse: any = null;

  if (editId) {
    const course = await Course.findById(editId).lean();
    if (!course) {
      redirect("/dashboard");
    }
    // (teachers only)
    if (String(course.createdBy) !== String((user as any)._id)) {
      redirect("/dashboard");
    }

    // convert ObjectIds to strings and produce a serializable shape
    plainCourse = {
      id: String(course._id),
      title: course.title ?? "",
      subtitle: course.subtitle ?? "",
      description: course.description ?? "",
      coverImage: course.coverImage ?? null,
      category: course.category ?? "",
      level: course.level ?? "Beginner",
      language: course.language ?? "English",
      tags: Array.isArray(course.tags) ? course.tags : [],
      price: Number(course.price || 0),
      published: Boolean(course.published),
      estimatedDuration: course.estimatedDuration ?? undefined,
      lessons: (course.lessons || []).map((l: any) => ({
        // keep lesson items serializable and give each a stable id for client refs
        id: l._id ? String(l._id) : `${Math.random().toString(36).slice(2,8)}-${Date.now()}`,
        title: l.title ?? "",
        type: l.type ?? "video",
        content: l.content ?? "",
        testId: l.testId ? String(l.testId) : null,
        summary: l.summary ?? "",
        durationMinutes: l.durationMinutes ?? null,
      })),
    };
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">{plainCourse ? "Edit course" : "Create a new course"}</h1>
          <p className="text-base text-slate-500 mt-1">
            Add lessons (video or article), attach tests, and publish courses for students.
          </p>
        </div>

        {/* pass plainTests and optional plainCourse */}
        {/* @ts-ignore */}
        <CreateCourseForm teacherTests={plainTests} course={plainCourse} />
      </div>
    </main>
  );
}