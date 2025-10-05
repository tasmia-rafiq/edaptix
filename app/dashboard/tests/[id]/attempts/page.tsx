import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/database";
import Submission from "@/models/Submission";
import Test from "@/models/Test";
import User from "@/models/User";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

function formatDate(iso?: string | Date) {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function computePercentNumberFromSubmission(s: any): number {
  const raw = Number(s.score ?? 0);
  const total = Number(s.total ?? 0) || 0;
  return total > 0 ? Math.round((raw / total) * 1000) / 10 : 0;
}

function getBarColor(percent: number) {
  if (percent >= 85) return "bg-emerald-500";
  if (percent >= 70) return "bg-teal-500";
  if (percent >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

export default async function AttemptsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<object>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const { id } = await params;
  const sp = (await searchParams) as { [key: string]: any } ?? {};
  const viewerId = (user as any).id ?? (user as any)._id;

  await connectToDatabase();

  const test = await Test.findById(id).lean();
  if (!test) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-semibold">Test not found</h1>
          <p className="text-slate-500 mt-2">
            That test could not be found or was deleted.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-sky-600 text-white rounded-md"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Only allow teachers (owners) to view attempts
  const isTeacherOwner =
    String(test.createdBy) === String(viewerId) ||
    (user as any).role === "teacher";
  if (!isTeacherOwner) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-semibold">Unauthorized</h1>
          <p className="text-slate-500 mt-2">
            You don't have permission to view attempts for this test.
          </p>
        </div>
      </main>
    );
  }

  // pagination
  const page = Math.max(1, Number(sp?.page ?? 1));
  const limit = 10;
  const skip = (page - 1) * limit;
  const q = (sp?.q ?? "").toString().trim();

  // optional search by student name (server-side). If q provided, do a user search first.
  let studentIdsFilter: string[] | undefined = undefined;
  if (q) {
    const users = await User.find({ name: { $regex: q, $options: "i" } })
      .select("_id")
      .lean();
    studentIdsFilter = users.map((u: any) => u._id.toString());
    if (studentIdsFilter.length === 0) {
      // no students match -> return empty
      return (
        <main className="min-h-screen bg-slate-50 py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{test.title}</h1>
                <p className="text-sm text-slate-500 mt-1">
                  {test.description}
                </p>
              </div>
              <div>
                <Link
                  href={`/dashboard/tests/${test._id}`}
                  className="px-3 py-1.5 rounded-md border"
                >
                  Back
                </Link>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 text-center">
              No attempts match your search.
            </div>
          </div>
        </main>
      );
    }
  }

  // build query
  const query: any = { testId: test._id };
  if (studentIdsFilter) query.studentId = { $in: studentIdsFilter };

  const [totalCount, submissions] = await Promise.all([
    Submission.countDocuments(query),
    Submission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  // gather student ids and fetch names
  const studentIds = Array.from(
    new Set(submissions.map((s: any) => String(s.studentId)).filter(Boolean))
  );
  const students = await User.find({ _id: { $in: studentIds } })
    .select("name email")
    .lean();
  const studentsMap: Record<string, any> = {};
  students.forEach((su: any) => (studentsMap[String(su._id)] = su));

  // compute overall summary
  const percentList = submissions.map((s: any) =>
    computePercentNumberFromSubmission(s)
  );
  const avgScore =
    percentList.length > 0
      ? Math.round(
          (percentList.reduce((a, b) => a + b, 0) / percentList.length) * 10
        ) / 10
      : 0;

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{test.title}</h1>
            <p className="text-sm text-slate-500 mt-1">{test.description}</p>
            <div className="text-sm text-slate-400 mt-1">
              {totalCount} attempts • Avg score: {avgScore}%
            </div>
          </div>

          <div className="flex items-center gap-3">
            <form method="GET" className="flex items-center gap-2 border border-slate-300 rounded-md pr-2">
              <input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Search students..."
                className="form_input !border-0"
              />
              <button type="submit">
                <Search className="size-5 text-teal" />
              </button>
            </form>

            <Link
              href="/dashboard"
              className="primary_btn !py-1.5"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 border border-slate-100 shadow-sm">
          <div className="space-y-4">
            {submissions.length > 0 ? submissions.map((s: any) => {
              const student = studentsMap[String(s.studentId)] ?? null;
              const percent = computePercentNumberFromSubmission(s);
              const barColor = getBarColor(percent);

              return (
                <div
                  key={String(s._id)}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-200 hover:shadow-sm transition bg-slate-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">
                          {student?.name ?? String(s.studentId).slice(0, 8)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {student?.email ?? ""}
                        </div>
                      </div>

                      <div className="text-xs text-slate-400">
                        <div>Attempt #{s.attempt ?? 1}</div>
                        <div className="mt-1">{formatDate(s.createdAt)}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-sm">

                      <div className="flex-1 min-w-0">
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`${barColor} h-full rounded-full transition-all`}
                            style={{ width: `${percent}%` }}
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={percent}
                          />
                        </div>

                        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                          <div>
                            {s.total
                              ? `${
                                  s.correctCount ??
                                  Math.round((percent / 100) * (s.total || 0))
                                } / ${s.total}`
                              : ""}
                          </div>
                          <div>{percent}%</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <Link
                      href={`/dashboard/tests/${test._id}/results/${s._id}`}
                      className="text-sm px-3 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      View result
                    </Link>

                    <form
                      action={`/api/tests/${test._id}/resend-result-email`}
                      method="POST"
                    >
                      <input
                        type="hidden"
                        name="submissionId"
                        value={String(s._id)}
                      />
                      <button
                        type="submit"
                        className="text-sm px-3 py-1 rounded-md bg-slate-100"
                      >
                        Send email
                      </button>
                    </form>
                  </div>
                </div>
              );
            }) : <div className="text-center text-slate-500 py-12">No attempts found.</div>}
          </div>

          {/* pagination */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Showing {(page - 1) * limit + 1} –{" "}
              {Math.min(page * limit, totalCount)} of {totalCount}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/tests/${test._id}/attempts?page=${Math.max(
                  1,
                  page - 1
                )}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`px-3 py-1 ${
                  page <= 1 ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <ChevronLeft />
              </Link>

              <div className="text-sm">
                Page {page} / {totalPages}
              </div>

              <Link
                href={`/dashboard/tests/${test._id}/attempts?page=${Math.min(
                  totalPages,
                  page + 1
                )}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`px-3 py-1 ${
                  page >= totalPages ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <ChevronRight />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
