import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/database";
import Course from "@/models/Course";
import Submission from "@/models/Submission";
import { format as formatDateFn } from "date-fns";
import { Globe, Lock, Trash, Plus } from "lucide-react";
import DeleteBtn from "@/components/DeleteBtn";

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

export default async function TeacherCoursesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (!user.role || user.role !== "teacher") redirect("/dashboard");

  await connectToDatabase();

  const teacherId = (user as any)._id ?? (user as any).id;

  // fetch courses by this teacher
  const courses = await Course.find({ createdBy: teacherId })
    .sort({ createdAt: -1 })
    .lean();

  if (!courses || courses.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100">
            <h1 className="text-2xl font-semibold">Your courses</h1>
            <p className="mt-2 text-slate-500">
              You haven't created any courses yet. Create your first course to
              start teaching.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/dashboard/courses/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo text-white rounded-md"
              >
                <Plus size={16} /> Create course
              </Link>
              <Link href="/dashboard" className="primary_btn white_btn">
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // build map testId -> courseId(s) and collect all testIds
  const testIdToCourseIds: Record<string, string[]> = {};
  const allTestIdsSet = new Set<string>();

  courses.forEach((c: any) => {
    const lessons = Array.isArray(c.lessons) ? c.lessons : [];
    lessons.forEach((lsn: any) => {
      if (lsn?.testId) {
        const tid = String(lsn.testId);
        allTestIdsSet.add(tid);
        if (!testIdToCourseIds[tid]) testIdToCourseIds[tid] = [];
        if (!testIdToCourseIds[tid].includes(String(c._id)))
          testIdToCourseIds[tid].push(String(c._id));
      }
    });
  });

  const allTestIds = Array.from(allTestIdsSet);

  // aggregate attempts per testId
  let attemptsMap: Record<string, number> = {};
  if (allTestIds.length > 0) {
    const agg = await Submission.aggregate([
      { $match: { testId: { $in: allTestIds } } },
      { $group: { _id: "$testId", count: { $sum: 1 } } },
    ]);
    agg.forEach((r: any) => {
      attemptsMap[String(r._id)] = r.count;
    });
  }

  // now compute attempts per course by summing test attempts that belong to that course
  const courseAttempts: Record<string, number> = {};
  courses.forEach((c: any) => {
    courseAttempts[String(c._id)] = 0;
  });
  Object.entries(attemptsMap).forEach(([testId, cnt]) => {
    const courseIds = testIdToCourseIds[testId] ?? [];
    courseIds.forEach((cid) => {
      courseAttempts[cid] = (courseAttempts[cid] || 0) + cnt;
    });
  });

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Courses</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage the courses you've created — edit content, publish, or view
              learners and lesson analytics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/courses/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-tr from-indigo to-teal text-white"
            >
              <Plus size={16} /> New course
            </Link>
            <Link href="/dashboard" className="primary_btn white_btn">
              Back
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((c: any) => {
            const lessonCount = Array.isArray(c.lessons) ? c.lessons.length : 0;
            const attempts = courseAttempts[String(c._id)] ?? 0;
            const priceLabel =
              c.price && Number(c.price) > 0
                ? `$${Number(c.price).toFixed(2)}`
                : "Free";
            const published = Boolean(c.published);

            return (
              <article
                key={String(c._id)}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col"
              >
                <div className="flex items-start gap-4">
                  <div className="w-28 h-28 rounded-lg bg-slate-100 overflow-hidden border border-slate-300">
                    {c.coverImage ? (
                      <Link href={`/dashboard/courses/${c._id}`}>
                        <img
                          src={c.coverImage}
                          alt={c.title}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        No cover
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/dashboard/courses/${c._id}`}>
                          <h3 className="text-lg font-semibold text-slate-900 truncate">
                            {c.title}
                          </h3>
                          {c.subtitle && (
                            <div className="text-sm text-slate-600 mt-1 truncate">
                              {c.subtitle}
                            </div>
                          )}
                        </Link>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                          <div>
                            {lessonCount} lesson{lessonCount !== 1 ? "s" : ""}
                          </div>
                          <div>•</div>
                          <div>{minutesToHuman(c.estimatedDuration)}</div>
                          <div>•</div>
                          <div className="font-medium">{priceLabel}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`inline-flex items-center gap-2 text-sm px-2 py-1 rounded ${
                            published
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-slate-50 text-slate-600 border border-slate-100"
                          }`}
                        >
                          {published ? (
                            <>
                              <Globe size={14} /> Published
                            </>
                          ) : (
                            <>
                              <Lock size={14} /> Draft
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <Link
                        href={`/dashboard/courses/${c._id}`}
                        className="text-sm px-3 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </Link>

                      <Link
                        href={`/dashboard/courses/create?edit=${c._id}`}
                        className="text-sm px-3 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </Link>

                      <Link
                        href={`/dashboard/courses/${c._id}/analytics`}
                        className="text-sm px-3 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        Analytics
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                  <div>
                    <div className="mt-1">
                      Created{" "}
                      <span className="text-slate-700 font-medium">
                        {formatDate(c.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-500">
                      Attempts:{" "}
                      <span className="font-semibold text-slate-700 ml-1">
                        {attempts}
                      </span>
                    </div>

                    <form
                      action={`/api/courses/${c._id}/toggle-publish`}
                      method="POST"
                      className="inline"
                    >
                      <input
                        type="hidden"
                        name="current"
                        value={published ? "published" : "draft"}
                      />
                      <button
                        type="submit"
                        className={`text-sm px-3 py-1 rounded-md ${
                          published
                            ? "bg-white border border-rose-200 text-rose-600"
                            : "bg-indigo text-white"
                        }`}
                      >
                        {published ? "Unpublish" : "Publish"}
                      </button>
                    </form>

                    <DeleteBtn
                      action={`/api/courses/${c._id}/delete`}
                      onSubmitMsg={
                        "Are you sure you want to permanently delete this course? This action cannot be undone."
                      }
                      btn={
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-md bg-rose-50 text-rose-600 border border-rose-200"
                        >
                          <Trash size={14} /> Delete
                        </button>
                      }
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
