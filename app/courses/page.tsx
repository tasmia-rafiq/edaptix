// app/courses/page.tsx
import React from "react";
import Link from "next/link";
import { connectToDatabase } from "@/lib/database";
import Course from "@/models/Course";
import User from "@/models/User";
import { format as formatDateFn } from "date-fns";
import { Play, Globe, Lock } from "lucide-react";

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

export default async function CoursesPage({
  searchParams,
}: {
  searchParams?: { q?: string; page?: string };
}) {
  // simple search + pagination on server
  const q = (searchParams?.q ?? "").trim();
  const page = Math.max(1, Number(searchParams?.page ?? 1));
  const limit = 12;
  const skip = (page - 1) * limit;

  await connectToDatabase();

  // build query: only published courses
  const query: any = { published: true };

  if (q) {
    // simple case-insensitive regex search over title + subtitle + description
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ title: re }, { subtitle: re }, { description: re }];
  }

  const [total, courses] = await Promise.all([
    Course.countDocuments(query),
    Course.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  // fetch teacher names for the courses
  const creatorIds = Array.from(new Set((courses || []).map((c: any) => String(c.createdBy)).filter(Boolean)));
  const users = await User.find({ _id: { $in: creatorIds } }).select("name").lean();
  const usersMap: Record<string, any> = {};
  users.forEach((u: any) => (usersMap[String(u._id)] = u));

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Courses</h1>
            <p className="text-sm text-slate-500 mt-1">
              Browse available courses — search, preview and enroll.
            </p>
          </div>

          <form method="GET" className="flex items-center gap-2">
            <input
              name="q"
              defaultValue={searchParams?.q ?? ""}
              placeholder="Search courses, keywords..."
              className="form_input !w-64"
              aria-label="Search courses"
            />
            <button type="submit" className="px-3 py-2 rounded-md bg-indigo text-white text-sm">Search</button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {courses.map((c: any) => {
            const lessons = Array.isArray(c.lessons) ? c.lessons : [];
            const lessonCount = lessons.length;
            const priceLabel = c.price && Number(c.price) > 0 ? `$${Number(c.price).toFixed(2)}` : "Free";
            const creator = usersMap[String(c.createdBy)];
            return (
              <article key={String(c._id)} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="relative">
                  <div className="w-full h-44 bg-slate-100 flex items-center justify-center overflow-hidden">
                    {c.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.coverImage} alt={c.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-400">No cover</div>
                    )}
                  </div>
                  <div className="absolute top-3 left-3 inline-flex items-center gap-2 px-2 py-1 rounded-md bg-slate-900/60 text-white text-xs">
                    <Play size={12} /> {lessonCount} lesson{lessonCount !== 1 ? "s" : ""}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-slate-900 truncate">{c.title}</h3>
                    {c.subtitle && <div className="text-sm text-slate-600 mt-1 line-clamp-2">{c.subtitle}</div>}

                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <div>{minutesToHuman(c.estimatedDuration)}</div>
                      <div>•</div>
                      <div>{c.level ?? "Beginner"}</div>
                      <div>•</div>
                      <div className="font-semibold">{priceLabel}</div>
                    </div>

                    <div className="mt-3 flex gap-2 flex-wrap">
                      {Array.isArray(c.tags) && c.tags.slice(0, 6).map((t: string) => (
                        <span key={t} className="inline-block text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      By <span className="text-slate-700 font-medium">{creator?.name ?? "Instructor"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/courses/${c._id}`} className="text-sm px-3 py-1 rounded-md bg-indigo text-white">View</Link>
                      <Link href={`/dashboard/courses/${c._id}/enroll`} className="text-sm px-3 py-1 rounded-md border border-slate-200 text-slate-700">Enroll</Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-slate-500">Showing {(page - 1) * limit + 1} – {Math.min(page * limit, total)} of {total} courses</div>

          <div className="flex items-center gap-2">
            <Link
              href={`/courses?page=${Math.max(1, page - 1)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`px-3 py-1 rounded-md border ${page <= 1 ? "opacity-50 pointer-events-none" : ""}`}
            >
              Prev
            </Link>

            <div className="text-sm">Page {page} / {totalPages}</div>

            <Link
              href={`/courses?page=${Math.min(totalPages, page + 1)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`px-3 py-1 rounded-md border ${page >= totalPages ? "opacity-50 pointer-events-none" : ""}`}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
