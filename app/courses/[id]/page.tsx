import React from "react";
import Link from "next/link";
import { connectToDatabase } from "@/lib/database";
import Course from "@/models/Course";
import User from "@/models/User";
import { format as formatDateFn } from "date-fns";
import { Play } from "lucide-react";
import Enrollment from "@/models/Enrollment";

function minutesToHuman(mins?: number | null) {
  if (!mins || mins <= 0) return "—";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const r = mins % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

function formatDate(iso?: string | Date) {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return formatDateFn(d, "MMM d, yyyy");
}

export default async function CoursePublicPage({ params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();

  const { id } = await params;
  const course = await Course.findById(id).lean();
  if (!course || !course.published) {
    return (
      <main className="min-h-screen p-8 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center py-24">
          <h1 className="text-2xl font-semibold">Course not available</h1>
          <p className="text-slate-500 mt-2">This course is not published or does not exist.</p>
          <div className="mt-6">
            <Link href="/" className="px-4 py-2 rounded-md bg-indigo text-white">Back to home</Link>
          </div>
        </div>
      </main>
    );
  }

  const creator = course.createdBy ? await User.findById(course.createdBy).select("name").lean() : null;

  // determine whether current viewer is already enrolled (best-effort: if logged in)
  // We cannot reliably check viewer on public page without getCurrentUser; intentionally omitted so enroll form will handle auth.
  // But we can show current enrollment count:
  const enrollmentCount = await Enrollment.countDocuments({ courseId: course._id });

  const lessons = Array.isArray(course.lessons) ? course.lessons : [];
  const lessonCount = lessons.length;
  const priceLabel = course.price && Number(course.price) > 0 ? `$${Number(course.price).toFixed(2)}` : "Free";

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="rounded-2xl bg-white p-6 border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-full md:w-64">
              <div className="w-full h-40 bg-slate-100 overflow-hidden rounded-lg border border-slate-300">
                {course.coverImage ? (
                  <img src={course.coverImage} alt={course.title} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">No cover</div>
                )}
              </div>

              <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
                <div>{lessonCount} lesson{lessonCount !== 1 ? "s" : ""} • {minutesToHuman(course.estimatedDuration)}</div>
                <div>Level: <span className="font-medium">{course.level ?? "Beginner"}</span></div>
                <div>Price: <span className="font-medium">{priceLabel}</span></div>
                <div>{enrollmentCount} enrolled</div>
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
              {course.subtitle && <div className="text-slate-600 mt-2">{course.subtitle}</div>}

              <div className="mt-4 text-slate-700">{course.description}</div>

              <div className="mt-6 flex items-center gap-3">
                {/* Enroll button posts to the enroll API route, which will redirect */}
                <form action={`/api/courses/${course._id}/enroll`} method="POST">
                  <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo text-white">
                    <Play size={14}/> Enroll {priceLabel !== "Free" ? `• ${priceLabel}` : ""}
                  </button>
                </form>

                <Link href={`/courses/${course._id}#curriculum`} className="px-4 py-2 rounded-md border border-slate-200 text-slate-700">View curriculum</Link>

                <div className="ml-auto text-sm text-slate-500">
                  Instructor: <span className="text-slate-700 font-medium">{creator?.name ?? "Instructor"}</span>
                </div>
              </div>

              {/* tags */}
              <div className="mt-4 flex gap-2 flex-wrap">
                {Array.isArray(course.tags) && course.tags.map((t: string) => (
                  <span key={t} className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-700">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div id="curriculum" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <section className="rounded-2xl bg-white p-6 border border-slate-100 shadow-sm">
              <h2 className="text-lg font-semibold">Curriculum</h2>
              <div className="mt-4 space-y-3">
                {lessons.map((lsn: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-4 p-3 rounded-lg border border-slate-100">
                    <div className="w-10 h-10 rounded-md bg-indigo-50 text-indigo-700 font-semibold flex items-center justify-center">{idx + 1}</div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{lsn.title || `Lesson ${idx + 1}`}</div>
                      {lsn.summary && <div className="text-sm text-slate-600 mt-1">{String(lsn.summary).slice(0, 180)}</div>}
                      <div className="mt-2 text-xs text-slate-400">{lsn.type === "video" ? "Video" : "Article"} • {lsn.durationMinutes ? `${lsn.durationMinutes} min` : "—"}</div>
                    </div>

                    <div className="flex-shrink-0 text-sm text-slate-500">
                      {lsn.testId ? <Link href={`/dashboard/tests/${lsn.testId}/attempts`} className="px-3 py-1 rounded-md border border-slate-200 text-slate-700">Test attempts</Link> : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm text-sm text-slate-600">
              <div className="font-medium mb-2">Quick info</div>
              <div className="grid gap-2">
                <div>Created: <span className="text-slate-700">{formatDate(course.createdAt)}</span></div>
                <div>Last updated: <span className="text-slate-700">{formatDate(course.updatedAt)}</span></div>
                <div>Level: <span className="text-slate-700">{course.level ?? "Beginner"}</span></div>
                <div>Language: <span className="text-slate-700">{course.language ?? "English"}</span></div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm text-sm text-slate-600">
              <div className="font-medium mb-2">Share</div>
              <div className="text-xs text-slate-500">{typeof window !== "undefined" ? window.location.href : `/courses/${course._id}`}</div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}