import Link from "next/link";
import { connectToDatabase } from "@/lib/database";
import Test from "@/models/Test";
import Submission from "@/models/Submission";
import User from "@/models/User";
import { format as formatDateFn } from "date-fns";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { getCurrentUser } from "@/lib/session";

function formatDate(iso?: string | Date) {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return formatDateFn(d, "MMM d, yyyy");
}

export default async function TestsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, any>>;
}) {
  const sp = (await searchParams) as Record<string, any> ?? {};
  const q = (sp?.q ?? "").toString().trim();
  const page = Math.max(1, Number(sp?.page ?? 1));
  const limit = 12;
  const skip = (page - 1) * limit;
  const levelFilter = (sp?.level ?? "").toString().trim();
  const tagFilter = (sp?.tag ?? "").toString().trim();
  const sort = (sp?.sort ?? "newest").toString();

  await connectToDatabase();

  const user = await getCurrentUser();

  // Only show published tests
  const query: any = { visibility: "public" };

  if (q) {
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ title: re }, { description: re }];
  }
  if (levelFilter) query.level = levelFilter;
  if (tagFilter) query.tags = tagFilter;

  // fetch tests + count (default newest)
  const [total, tests] = await Promise.all([
    Test.countDocuments(query),
    Test.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  // gather creator ids
  const creatorIds = Array.from(new Set((tests || []).map((t: any) => String(t.createdBy)).filter(Boolean)));
  const users = creatorIds.length ? await User.find({ _id: { $in: creatorIds } }).select("name").lean() : [];
  const usersMap: Record<string, any> = {};
  users.forEach((u: any) => (usersMap[String(u._id)] = u));

  // compute attempt counts for displayed tests
  const testIds = (tests || []).map((t: any) => t._id).filter(Boolean);
  let attemptsMap: Record<string, number> = {};
  if (testIds.length > 0) {
    const agg = await Submission.aggregate([
      { $match: { testId: { $in: testIds } } },
      { $group: { _id: "$testId", count: { $sum: 1 } } },
    ]);
    agg.forEach((r: any) => {
      attemptsMap[String(r._id)] = r.count;
    });
  }

  // If user requested popular sort, reorder tests by attempts count desc
  let displayTests = tests || [];
  if (sort === "popular") {
    displayTests = [...displayTests].sort((a: any, b: any) => {
      const ca = attemptsMap[String(a._id)] ?? 0;
      const cb = attemptsMap[String(b._id)] ?? 0;
      // fall back to createdAt for tie-break
      if (cb === ca) return (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      return cb - ca;
    });
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // collect available tags and levels for the filter UI (simple extraction)
  const tagSet = new Set<string>();
  const levelSet = new Set<string>();
  const sample = await Test.find({ published: true }).select("tags level").lean();
  sample.forEach((t: any) => {
    if (Array.isArray(t.tags)) t.tags.forEach((tg: string) => tagSet.add(tg));
    if (t.level) levelSet.add(t.level);
  });
  const availableTags = Array.from(tagSet).slice(0, 20);
  const availableLevels = Array.from(levelSet).length ? Array.from(levelSet) : ["Beginner", "Intermediate", "Advanced"];

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Assessments</h1>
            <p className="text-sm text-slate-500 mt-1">Browse instructor-created tests — preview, filter, and take assessments.</p>
          </div>

          <div className="w-full md:w-auto flex items-center gap-3">
            <form method="GET" className="flex items-center w-full md:w-auto gap-2">
              <input
                name="q"
                defaultValue={q}
                placeholder="Search tests, keywords..."
                className="form_input !pr-10 !bg-white"
                aria-label="Search tests"
              />
              <button type="submit" className="px-3 py-3 rounded-md bg-indigo text-white" aria-label="Search">
                <Search size={16} />
              </button>
            </form>

            <Link href="/dashboard" className="hidden sm:inline-flex primary_btn">My dashboard</Link>
          </div>
        </header>

        {/* Filters row */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <form method="GET" className="flex items-center gap-2">
              <input type="hidden" name="q" value={q ?? ""} />
              <select name="level" defaultValue={levelFilter} className="form_input !bg-white">
                <option value="">All levels</option>
                {availableLevels.map((lv) => <option key={lv} value={lv}>{lv}</option>)}
              </select>

              <select name="tag" defaultValue={tagFilter} className="form_input !bg-white">
                <option value="">All tags</option>
                {availableTags.map((tg) => <option key={tg} value={tg}>{tg}</option>)}
              </select>

              <select name="sort" defaultValue={sort} className="form_input !bg-white">
                <option value="newest">Newest</option>
                <option value="popular">Most attempts</option>
              </select>

              <button type="submit" className="primary_btn !text-sm">Apply</button>
              <Link href="/tests" className="primary_btn white_btn !text-sm">Reset</Link>
            </form>
          </div>

          <div className="text-sm text-slate-500">
            Showing {total === 0 ? 0 : Math.min(total, skip + 1)} – {Math.min(total, skip + limit)} of {total}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTests.map((t: any) => {
            const attempts = attemptsMap[String(t._id)] ?? 0;
            const creator = usersMap[String(t.createdBy)];
            const priceLabel = t.paid && t.price ? `$${Number(t.price).toFixed(2)}` : "Free";
            return (
              <article key={String(t._id)} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="pr-4">
                      <h3 className="text-lg font-semibold text-slate-900">{t.title}</h3>
                      {t.subtitle && <div className="text-sm text-slate-500 mt-1 line-clamp-2">{t.subtitle}</div>}
                    </div>

                    <div className="text-xs text-slate-400 text-right">
                      <div>{formatDate(t.createdAt)}</div>
                      <div className="mt-1 font-medium">{priceLabel}</div>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-600 flex-1">
                    {t.description ? String(t.description).slice(0, 160) + (String(t.description).length > 160 ? "…" : "") : "No description available."}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {Array.isArray(t.tags) && t.tags.slice(0, 6).map((tg: string) => (
                        <span key={tg} className="inline-block text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">{tg}</span>
                      ))}
                    </div>

                    <div className="text-xs text-slate-400">{t.level ?? "Beginner"}</div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500">By <span className="text-slate-700 font-medium">{creator?.name ?? "Instructor"}</span></div>
                      <div className="text-xs text-slate-400 mt-1">{attempts} attempt{attempts !== 1 ? "s" : ""}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link href={`/dashboard/tests/${t._id}`} className="primary_btn !text-sm">View</Link>
                      <Link href={`/dashboard/tests/${t._id}`} className="primary_btn white_btn !text-sm">Take</Link>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between text-xs bg-slate-50">
                  <div className="text-slate-500">Duration: {t.durationMinutes ? `${t.durationMinutes} min` : "—"}</div>
                  <div className="text-slate-500">Questions: {Array.isArray(t.questions) ? t.questions.length : (t.questionCount ?? "—")}</div>
                </div>
              </article>
            );
          })}

          {displayTests.length === 0 && (
            <div className="col-span-full text-center rounded-lg bg-white p-12 border border-slate-100 text-slate-500">
              No tests found. Try adjusting filters or search.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">Showing {total === 0 ? 0 : Math.min(total, skip + 1)} – {Math.min(total, skip + limit)} of {total}</div>
          <div className="flex items-center gap-2">
            <Link
              href={`/tests?page=${Math.max(1, page - 1)}${q ? `&q=${encodeURIComponent(q)}` : ""}${levelFilter ? `&level=${encodeURIComponent(levelFilter)}` : ""}${tagFilter ? `&tag=${encodeURIComponent(tagFilter)}` : ""}${sort ? `&sort=${encodeURIComponent(sort)}` : ""}`}
              className={`${page <= 1 ? "opacity-50 pointer-events-none" : ""}`}
            >
              <ChevronLeft />
            </Link>

            <div className="text-sm">Page {page} / {totalPages}</div>

            <Link
              href={`/tests?page=${Math.min(totalPages, page + 1)}${q ? `&q=${encodeURIComponent(q)}` : ""}${levelFilter ? `&level=${encodeURIComponent(levelFilter)}` : ""}${tagFilter ? `&tag=${encodeURIComponent(tagFilter)}` : ""}${sort ? `&sort=${encodeURIComponent(sort)}` : ""}`}
              className={`${page >= totalPages ? "opacity-50 pointer-events-none" : ""}`}
            >
              <ChevronRight />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
