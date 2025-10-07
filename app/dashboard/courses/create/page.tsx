// app/dashboard/create-course/page.tsx
import React from "react";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/database";
import Test from "@/models/Test";
import CreateCourseForm from "@/components/CreateCourseForm";

export default async function CreateCoursePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if ((user as any).role !== 'teacher') redirect('/dashboard');

  await connectToDatabase();

  // fetch tests created by this teacher so teacher can attach tests to lessons
  const tests = await Test.find({ createdBy: (user as any)._id }).select("_id title").sort({ createdAt: -1 }).lean();

  // convert ids to strings (server -> client props must be serializable)
  const plainTests = (tests || []).map((t: any) => ({ id: String(t._id), title: t.title }));

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">Create a new course</h1>
          <p className="text-base text-slate-500 mt-1">
            Add lessons (video or article), attach tests, and publish courses for students.
          </p>
        </div>

        <CreateCourseForm teacherTests={plainTests} />
      </div>
    </main>
  );
}
