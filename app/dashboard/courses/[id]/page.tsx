import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/database";
import Course from "@/models/Course";
import Submission from "@/models/Submission";
import Test from "@/models/Test";
import { format as formatDateFn } from "date-fns";
import { Edit, Globe, Lock, Trash, Play } from "lucide-react";

function formatDate(iso?: string | Date) {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return formatDateFn(d, "MMM d, yyyy '·' h:mm a");
}

function minutesToHuman(mins?: number | null) {
  if (!mins || mins <= 0) return "—";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const r = mins % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  await connectToDatabase();

  const {id} = await params;
  const course = await Course.findById(id).lean();
  if (!course) {
    return (
      <main className="min-h-screen p-8 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center py-24">
          <h1 className="text-2xl font-semibold">Course not found</h1>
          <p className="text-slate-500 mt-2">This course does not exist or has been removed.</p>
          <div className="mt-6">
            <Link href="/dashboard" className="px-4 py-2 rounded-md bg-indigo text-white">Back to dashboard</Link>
          </div>
        </div>
      </main>
    );
  }

  // compute some derived values
  const lessons = Array.isArray(course.lessons) ? course.lessons : [];
  const lessonCount = lessons.length;
  const totalMinutes = lessons.reduce((acc: number, l: any) => acc + (Number(l.durationMinutes || 0)), 0);

  // collect testIds from lessons (if any) and compute attempts
  const testIds = lessons.map((l: any) => l.testId).filter(Boolean);
  let attemptsMap: Record<string, number> = {};
  if (testIds.length > 0) {
    const agg = await Submission.aggregate([
      { $match: { testId: { $in: testIds } } },
      { $group: { _id: "$testId", count: { $sum: 1 } } },
    ]);
    attemptsMap = {};
    agg.forEach((r: any) => {
      attemptsMap[String(r._id)] = r.count;
    });
  }

  // role checks
  const viewerId = (user as any).id ?? (user as any)._id;
  const isCreator = String(course.createdBy) === String(viewerId);
  const isTeacher = (user as any).role === "teacher";

  // friendly header pieces
  const published = Boolean(course.published);
  const priceLabel = (course.price && Number(course.price) > 0) ? `$${Number(course.price).toFixed(2)}` : "Free";

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* header */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-36 h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
              {course.coverImage ? (
                <img src={course.coverImage} alt={course.title} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">No cover</div>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
              {course.subtitle && <div className="text-slate-600 mt-1">{course.subtitle}</div>}
              <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
                <div>{lessonCount} lesson{lessonCount !== 1 ? "s" : ""}</div>
                <div>•</div>
                <div>{minutesToHuman(course.estimatedDuration)}</div>
                <div>•</div>
                <div>{course.level ?? "Beginner"}</div>
                <div>•</div>
                <div className="font-medium">{priceLabel}</div>
              </div>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {Array.isArray(course.tags) && course.tags.slice(0, 8).map((t: string) => (
                  <span key={t} className="inline-block text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* actions differ slightly if viewer is creator/teacher vs student */}
            {isCreator || isTeacher ? (
              <>
                <Link href={`/dashboard/courses/create?edit=${course._id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-slate-200 bg-white hover:shadow-sm text-sm">
                  <Edit size={14} /> Edit
                </Link>

                <form action={`/api/courses/${course._id}/toggle-publish`} method="POST">
                  <input type="hidden" name="current" value={published ? "published" : "draft"} />
                  <button type="submit" className={`px-4 py-2 rounded-md text-sm ${published ? "bg-white border border-rose-200 text-rose-600" : "bg-indigo text-white"}`}>
                    {published ? "Unpublish" : "Publish"}
                  </button>
                </form>

                <form action={`/api/courses/${course._id}/delete`} method="POST" onSubmit={undefined}>
                  <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-rose-50 text-rose-600 border border-rose-200 text-sm">
                    <Trash size={14} /> Delete
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href={`/dashboard/courses/${course._id}/start`} className="px-4 py-2 rounded-md bg-gradient-to-br from-indigo to-teal text-white">
                  <Play size={14} /> Start course
                </Link>
                <Link href={`/dashboard/courses/${course._id}/enroll`} className="px-4 py-2 rounded-md border border-slate-200 text-slate-700">
                  Enroll
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold">About this course</h2>
              <p className="mt-3 text-slate-700">{course.description ?? "No description provided."}</p>

              <div className="mt-4 flex gap-3 items-center text-sm text-slate-500">
                <div>Created: <span className="text-slate-700 font-medium">{formatDate(course.createdAt)}</span></div>
                <div>•</div>
                <div>Last updated: <span className="text-slate-700 font-medium">{formatDate(course.updatedAt)}</span></div>
              </div>
            </section>

            {/* lessons list */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Lessons</h3>
                <div className="text-sm text-slate-500">{lessonCount} lesson{lessonCount !== 1 ? "s" : ""} • {minutesToHuman(totalMinutes)}</div>
              </div>

              <div className="space-y-4">
                {lessons.map((lsn: any, i: number) => {
                  const attempts = lsn.testId ? (attemptsMap[String(lsn.testId)] ?? 0) : 0;
                  return (
                    <article key={String(i)} className="rounded-lg bg-white border border-slate-100 p-4 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-md bg-indigo-50 text-teal flex items-center justify-center font-semibold">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-base font-medium text-indigo">{lsn.title || `Lesson ${i + 1}`}</div>
                              {lsn.summary && <div className="text-sm text-slate-600 mt-1">{String(lsn.summary).slice(0, 180)}</div>}
                              <div className="mt-2 text-xs text-slate-400 flex gap-3 items-center">
                                <div>{lsn.type === "video" ? "Video" : "Article"}</div>
                                <div>•</div>
                                <div>{lsn.durationMinutes ? `${lsn.durationMinutes} min` : "—"}</div>
                                {lsn.testId && (
                                  <>
                                    <div>•</div>
                                    <div>{attempts} attempt{attempts !== 1 ? "s" : ""}</div>
                                  </>
                                )}
                              </div>

                              <div className="flex gap-2 mt-6">
                                {lsn.testId && <Link href={`/dashboard/tests/${lsn.testId}/attempts`} className="primary_btn white_btn !text-sm">View attempts</Link>}
                                <Link href={`/dashboard/lessons/${course._id}/${i}`} className="primary_btn !text-sm">Open</Link>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 items-end">
                              {lsn.type === "video" && lsn.content ? (
                                <div className="w-50 h-40 bg-slate-100 rounded overflow-hidden border border-slate-400">
                                  <video src={lsn.content} controls className="w-full h-full object-cover" />
                                </div>
                              ) : lsn.type === "article" ? (
                                <div className="px-3 py-1 rounded-md bg-slate-50 text-xs border">Article</div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          {/* right: stats and quick info */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Course status</div>
                  <div className="font-medium mt-1">{published ? <span className="inline-flex items-center gap-2 text-teal-600"><Globe size={14} /> Published</span> : <span className="inline-flex items-center gap-2 text-slate-600"><Lock size={14} /> Draft</span>}</div>
                </div>
                <div className="text-sm text-slate-500">{priceLabel}</div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                <div className="space-y-1">
                  <div className="text-xs">Lessons</div>
                  <div className="font-semibold">{lessonCount}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs">Duration</div>
                  <div className="font-semibold">{minutesToHuman(course.estimatedDuration)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs">Level</div>
                  <div className="font-semibold">{course.level ?? "Beginner"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs">Language</div>
                  <div className="font-semibold">{course.language ?? "English"}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm">
              <div className="text-sm text-slate-500">Tests attached</div>
              <div className="mt-3 space-y-2">
                {lessons.filter((l: any) => l.testId).length === 0 ? (
                  <div className="text-sm text-slate-500">No tests attached</div>
                ) : (
                  (await Promise.all(lessons.map(async (l: any) => {
                    if (!l.testId) return null;
                    const t = await Test.findById(l.testId).lean();
                    return t ? { id: String(t._id), title: t.title } : null;
                  }))).filter(Boolean).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between">
                      <div className="text-sm text-slate-700">{t.title}</div>
                      <Link href={`/dashboard/tests/${t.id}/attempts`} className="text-sm px-4 py-1 rounded-md border border-slate-300 text-slate-700">Attempts</Link>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm text-sm text-slate-500">
              <div className="font-medium mb-2">Share / Public link</div>
              {published ? (
                <div className="text-xs">
                  Public link:
                  <div className="mt-2 px-3 py-2 rounded-md bg-slate-50 text-xs break-words">
                    {typeof window !== "undefined" ? window.location.origin + `/courses/${course._id}` : `/courses/${course._id}`}
                  </div>
                </div>
              ) : (
                <div className="text-xs">Publish the course to generate a public link.</div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}