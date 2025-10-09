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

// --- SMALL SVG HELPERS (server-side) ---
function sparklinePath(values: number[], w = 220, h = 48, stroke = "#0ea5a4") {
  if (!values || values.length === 0) return "";
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = w / Math.max(1, values.length - 1);
  const pts = values.map((v, i) => {
    const x = Math.round(i * step);
    const y = Math.round(h - ((v - min) / range) * h);
    return `${x},${y}`;
  });
  return `M ${pts.join(" L ")}`;
}

function barHeights(bucketCounts: number[], maxH = 48) {
  const max = Math.max(...bucketCounts, 1);
  return bucketCounts.map((c) => Math.round((c / max) * maxH));
}

// --- END SVG HELPERS ---

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
          <p className="text-slate-500 mt-2">That test could not be found or was deleted.</p>
          <div className="mt-6">
            <Link href="/dashboard" className="px-4 py-2 bg-sky-600 text-white rounded-md">Back to dashboard</Link>
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
          <p className="text-slate-500 mt-2">You don't have permission to view attempts for this test.</p>
        </div>
      </main>
    );
  }

  // pagination & search
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
      // no students match -> render header + empty
      return (
        <main className="min-h-screen bg-slate-50 py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{test.title}</h1>
                <p className="text-sm text-slate-500 mt-1">{test.description}</p>
              </div>
              <div>
                <Link href={`/dashboard/tests/${test._id}`} className="px-3 py-1.5 rounded-md border">Back</Link>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 text-center">No attempts match your search.</div>
          </div>
        </main>
      );
    }
  }

  // Build the submissions query
  const baseQuery: any = { testId: test._id };
  if (studentIdsFilter) baseQuery.studentId = { $in: studentIdsFilter };

  // Fetch list + count
  const [totalCount, submissions] = await Promise.all([
    Submission.countDocuments(baseQuery),
    Submission.find(baseQuery).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  // fetch student info for displayed submissions
  const studentIds = Array.from(new Set(submissions.map((s: any) => String(s.studentId)).filter(Boolean)));
  const students = await User.find({ _id: { $in: studentIds } }).select("name email").lean();
  const studentsMap: Record<string, any> = {};
  students.forEach((su: any) => (studentsMap[String(su._id)] = su));

  // --- ANALYTICS AGGREGATIONS ---
  // 1) recent attempts timeseries (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); // include today (30 days)
  const timeseriesAgg = await Submission.aggregate([
    { $match: { testId: test._id, createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  // create a 30-day array
  const dateMap: Record<string, number> = {};
  timeseriesAgg.forEach((r: any) => (dateMap[r._id] = r.count));
  const dates: string[] = [];
  const counts: number[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(thirtyDaysAgo.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dates.push(key);
    counts.push(dateMap[key] || 0);
  }

  // 2) score distribution buckets (0-9,10-19,..90-100)
  // compute percent for each submission across whole dataset (or recent subset)
  const distributionAgg = await Submission.aggregate([
    { $match: { testId: test._id } },
    // compute percent field
    {
      $project: {
        percent: {
          $cond: [
            { $gt: ["$total", 0] },
            { $multiply: [{ $divide: ["$score", "$total"] }, 100] },
            0,
          ],
        },
      },
    },
    {
      $bucket: {
        groupBy: "$percent",
        boundaries: [0,10,20,30,40,50,60,70,80,90,101], // last bucket includes 100
        default: "100+",
        output: { count: { $sum: 1 } },
      },
    },
  ]);
  // Convert aggregation to ordered array of 10 buckets
  const buckets = new Array(10).fill(0);
  distributionAgg.forEach((b: any) => {
    const idx = typeof b._id === "number" ? Math.min(9, Math.floor(b._id / 10)) : 9;
    buckets[idx] = b.count;
  });

  // 3) summary metrics: average, median, pass rate
  const scoreAggAll = await Submission.aggregate([
    { $match: { testId: test._id } },
    {
      $project: {
        percent: {
          $cond: [
            { $gt: ["$total", 0] },
            { $multiply: [{ $divide: ["$score", "$total"] }, 100] },
            0,
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        avg: { $avg: "$percent" },
        min: { $min: "$percent" },
        max: { $max: "$percent" },
        count: { $sum: 1 },
      },
    },
  ]);
  const summary = scoreAggAll[0] || { avg: 0, min: 0, max: 0, count: 0 };
  // median approximation: fetch sorted percent and pick middle (only if dataset small — but acceptable)
  const maybeMedianDocs = await Submission.find({ testId: test._id }).select("score total studentId").lean();
  const percentArray = maybeMedianDocs.map((d: any) => computePercentNumberFromSubmission(d)).sort((a,b)=>a-b);
  const median = percentArray.length ? percentArray[Math.floor((percentArray.length-1)/2)] : 0;
  const passThreshold = 50;
  const passCount = maybeMedianDocs.reduce((acc: number, d: any) => acc + (computePercentNumberFromSubmission(d) >= passThreshold ? 1 : 0), 0);
  const passRate = maybeMedianDocs.length ? Math.round((passCount / maybeMedianDocs.length) * 1000) / 10 : 0;

  // 4) top students (by average score + attempts) — limit 5
  const topStudentsAgg = await Submission.aggregate([
    { $match: { testId: test._id } },
    {
      $project: {
        studentId: 1,
        percent: {
          $cond: [
            { $gt: ["$total", 0] },
            { $multiply: [{ $divide: ["$score", "$total"] }, 100] },
            0,
          ],
        },
      },
    },
    {
      $group: {
        _id: "$studentId",
        avgPercent: { $avg: "$percent" },
        attempts: { $sum: 1 },
      },
    },
    { $sort: { avgPercent: -1, attempts: -1 } },
    { $limit: 5 },
  ]);
  const topStudentIds = topStudentsAgg.map((t: any) => t._id).filter(Boolean);
  const topUsers = topStudentIds.length ? await User.find({ _id: { $in: topStudentIds } }).select("name email").lean() : [];
  const topUsersMap: Record<string, any> = {};
  topUsers.forEach((u: any) => (topUsersMap[String(u._id)] = u));

  // derived values for sparkline and histogram
  const sparkPath = sparklinePath(counts, 220, 48);
  const histHeights = barHeights(buckets, 48);

  // compute avgScore final
  const avgScore = summary.count ? Math.round(summary.avg * 10) / 10 : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  // render
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{test.title}</h1>
            <p className="text-sm text-slate-500 mt-1">{test.description}</p>
            <div className="text-sm text-slate-400 mt-1">
              {totalCount} attempts • Avg score: {avgScore}% • Pass rate: {passRate}%
            </div>
          </div>

          <div className="flex items-center gap-3">
            <form method="GET" className="flex items-center gap-2 border border-slate-300 rounded-md pr-2">
              <input name="q" defaultValue={q ?? ""} placeholder="Search students..." className="form_input !border-0" />
              <button type="submit"><Search className="size-5 text-teal" /></button>
            </form>
            <Link href="/dashboard" className="primary_btn !py-1.5">Dashboard</Link>
          </div>
        </div>

        {/* Analytics + list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: detailed analytics card (spans 2 cols on large) */}
          <div className="lg:col-span-2 space-y-4">
            <section className="rounded-2xl bg-white p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Insights</h2>
                  <div className="text-sm text-slate-500 mt-1">High-level analytics for this test (last 30 days shown below).</div>
                </div>
                <div className="text-xs text-slate-500">Updated: {formatDate(new Date())}</div>
              </div>

              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500">Total attempts</div>
                  <div className="text-2xl font-semibold mt-2">{summary.count}</div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500">Average score</div>
                  <div className="text-2xl font-semibold mt-2">{avgScore}%</div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500">Median</div>
                  <div className="text-2xl font-semibold mt-2">{median}%</div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500">Pass rate</div>
                  <div className="text-2xl font-semibold mt-2">{passRate}%</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                {/* Sparkline */}
                <div className="md:col-span-2 rounded-lg p-4 bg-white border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-800">Attempts (last 30 days)</div>
                      <div className="text-xs text-slate-500 mt-1">Daily attempts trend</div>
                    </div>
                    <div className="text-sm text-slate-500">{counts.reduce((a,b)=>a+b,0)} in 30 days</div>
                  </div>

                  <div className="mt-4">
                    <svg width="100%" height="56" viewBox="0 0 220 48" className="w-full">
                      <path d={sparkPath} fill="none" stroke="#0ea5a4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      {/* tiny gradient area */}
                      <defs>
                        <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#0ea5a4" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="#0ea5a4" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* optional area fill: approximate polygon */}
                    </svg>

                    <div className="mt-2 text-xs text-slate-500">Recent activity across the past month. Use this to identify spikes or drops in student engagement.</div>
                  </div>
                </div>

                {/* Histogram */}
                <div className="rounded-lg p-4 bg-white border border-slate-100 shadow-sm">
                  <div className="text-sm font-medium text-slate-800">Score distribution</div>
                  <div className="text-xs text-slate-500 mt-1">Buckets (0-9 → 90-100)</div>

                  <div className="mt-3 flex items-end gap-2 h-16">
                    {histHeights.map((h: number, i: number) => {
                      const pct = buckets[i] ? Math.round((buckets[i] / Math.max(...buckets,1)) * 100) : 0;
                      return (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div className={`w-4 rounded-t ${getBarColor(i*10+5)} transition`} style={{ height: `${h}px` }} title={`${buckets[i]} attempts`} />
                          <div className="text-xs text-slate-400 mt-1">{i===9? '90+' : `${i*10}`}</div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-2 text-xs text-slate-500">Visually inspect where students clustered and whether many scored low or high.</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-sm font-semibold text-slate-800">Top students</div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {topStudentsAgg.length === 0 ? (
                    <div className="text-sm text-slate-500">No top students yet.</div>
                  ) : (
                    topStudentsAgg.map((t: any) => {
                      const u = topUsersMap[String(t._id)];
                      return (
                        <div key={String(t._id)} className="p-3 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-slate-800">{u?.name ?? String(t._id).slice(0,8)}</div>
                            <div className="text-xs text-slate-500 mt-1">{u?.email ?? ""}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">{Math.round(t.avgPercent*10)/10}%</div>
                            <div className="text-xs text-slate-400 mt-1">{t.attempts} attempt{t.attempts!==1?'s':''}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>

            {/* Attempts list */}
            <section className="rounded-2xl bg-white p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Attempts</h3>
                  <div className="text-sm text-slate-500">Latest student attempts — detailed view below.</div>
                </div>
                <div className="text-sm text-slate-500">Showing {(page - 1) * limit + 1} – {Math.min(page * limit, totalCount)}</div>
              </div>

              <div className="space-y-3">
                {submissions.length > 0 ? submissions.map((s: any) => {
                  const student = studentsMap[String(s.studentId)] ?? null;
                  const percent = computePercentNumberFromSubmission(s);
                  const barColor = getBarColor(percent);

                  return (
                    <div key={String(s._id)} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-200 hover:shadow-sm transition bg-slate-50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-800 truncate">{student?.name ?? String(s.studentId).slice(0,8)}</div>
                            <div className="text-xs text-slate-500 mt-1">{student?.email ?? ""}</div>
                          </div>

                          <div className="text-xs text-slate-400">
                            <div>Attempt #{s.attempt ?? 1}</div>
                            <div className="mt-1">{formatDate(s.createdAt)}</div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <div className="flex-1 min-w-0">
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div className={`${barColor} h-full rounded-full transition-all`} style={{ width: `${percent}%` }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}/>
                            </div>

                            <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                              <div>{s.total ? `${s.correctCount ?? Math.round((percent/100)*(s.total||0))} / ${s.total}` : ""}</div>
                              <div>{percent}%</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        <Link href={`/dashboard/tests/${test._id}/results/${s._id}`} className="text-sm px-3 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50">View result</Link>

                        <form action={`/api/tests/${test._id}/resend-result-email`} method="POST">
                          <input type="hidden" name="submissionId" value={String(s._id)} />
                          <button type="submit" className="text-sm px-3 py-1 rounded-md bg-slate-100">Send email</button>
                        </form>
                      </div>
                    </div>
                  );
                }) : <div className="text-center text-slate-500 py-12">No attempts found.</div>}
              </div>

              {/* pagination */}
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-slate-500">Showing {(page - 1) * limit + 1} – {Math.min(page * limit, totalCount)} of {totalCount}</div>

                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/tests/${test._id}/attempts?page=${Math.max(1, page - 1)}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={`px-3 py-1 ${page <= 1 ? "opacity-50 pointer-events-none" : ""}`}><ChevronLeft /></Link>

                  <div className="text-sm">Page {page} / {totalPages}</div>

                  <Link href={`/dashboard/tests/${test._id}/attempts?page=${Math.min(totalPages, page + 1)}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={`px-3 py-1 ${page >= totalPages ? "opacity-50 pointer-events-none" : ""}`}><ChevronRight /></Link>
                </div>
              </div>
            </section>
          </div>

          {/* Right column: quick stats & actions */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm">
              <div className="text-xs text-slate-500">Quick actions</div>
              <div className="mt-3 flex flex-col gap-2">
                <Link href={`/dashboard/tests/${test._id}/export`} className="px-3 py-2 rounded-md border border-slate-400 text-sm">Export results (CSV)</Link>
                <Link href={`/dashboard/tests/${test._id}/settings`} className="px-3 py-2 rounded-md border border-slate-400 text-sm">Test settings</Link>
                <form action={`/api/tests/${test._id}/notify`} method="POST">
                  <button type="submit" className="px-3 py-2 rounded-md bg-indigo text-white text-sm">Send reminder to students</button>
                </form>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm">
              <div className="text-xs text-slate-500">Metric guide</div>
              <ul className="mt-3 text-sm text-slate-600 space-y-2">
                <li><span className="font-medium">Average score:</span> mean percent across attempts.</li>
                <li><span className="font-medium">Pass rate:</span> percent scoring ≥ {passThreshold}%.</li>
                <li><span className="font-medium">Distribution:</span> shows where students cluster.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
