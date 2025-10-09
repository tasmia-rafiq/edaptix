import Link from "next/link";
import { connectToDatabase } from "@/lib/database";
import Course from "@/models/Course";
import { format as formatDateFn } from "date-fns";
import { Edit, Globe, Lock, Trash, Play } from "lucide-react";

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

export default async function AllCourses({ teacherId }: { teacherId: string }) {
  // server-side DB fetch
  await connectToDatabase();
  const courses = await Course.find({ createdBy: teacherId }).sort({ createdAt: -1 }).lean();

  if (!courses || courses.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 border border-slate-100 shadow-sm text-sm text-slate-500">
        You haven't created any courses yet. <Link href="/dashboard/courses/create" className="text-indigo ml-1">Create your first course</Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {courses.map((c: any) => {
        const lessons = Array.isArray(c.lessons) ? c.lessons : [];
        const lessonCount = lessons.length;
        const priceLabel = c.price && Number(c.price) > 0 ? `$${Number(c.price).toFixed(2)}` : "Free";
        const published = Boolean(c.published);

        return (
          <article key={String(c._id)} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex">
            <div className="w-28 h-28 bg-slate-100 flex items-center justify-center overflow-hidden">
              {c.coverImage ? (
                <Link href={`/dashboard/courses/${c._id}`} className="w-full h-full block">
                    <img src={c.coverImage} alt={c.title} className="w-full h-full object-cover" />
                </Link>
              ) : (
                <div className="text-slate-400 text-xs">No cover</div>
              )}
            </div>

            <div className="p-4 flex flex-col break-all">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <Link href={`/dashboard/courses/${c._id}`}>
                    <h3 className="text-base font-semibold text-slate-900 truncate">{c.title}</h3>
                    {c.subtitle && <div className="text-sm text-slate-600 mt-1">{c.subtitle}</div>}
                  </Link>

                  <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                    <div>{lessonCount} lesson{lessonCount !== 1 ? "s" : ""}</div>
                    <div>•</div>
                    <div>{minutesToHuman(c.estimatedDuration)}</div>
                    <div>•</div>
                    <div className="font-medium">{priceLabel}</div>
                  </div>

                  <div className="mt-2 flex gap-2 flex-wrap">
                    {Array.isArray(c.tags) && c.tags.slice(0, 5).map((t: string) => (
                      <span key={t} className="inline-block text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-xs text-slate-500">{formatDate(c.createdAt)}</div>
                  <div className="text-sm">
                    {published ? (
                      <span className="inline-flex items-center gap-1 text-teal-600"><Globe size={14} /> Published</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-600"><Lock size={14} /> Draft</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Link href={`/dashboard/courses/create?edit=${c._id}`} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-sm">
                  <Edit size={14} /> Edit
                </Link>

                <form action={`/api/courses/${c._id}/toggle-publish`} method="POST" className="inline-block">
                  <input type="hidden" name="current" value={published ? "published" : "draft"} />
                  <button type="submit" className={`px-3 py-1.5 rounded-md text-sm ${published ? "bg-white border border-rose-200 text-rose-600" : "bg-indigo text-white"}`}>
                    {published ? "Unpublish" : "Publish"}
                  </button>
                </form>

                <form action={`/api/courses/${c._id}/delete`} method="POST" onSubmit={undefined} className="inline-block ml-auto">
                  <button type="submit" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200 text-sm">
                    <Trash size={14} /> Delete
                  </button>
                </form>

                <Link href={`/dashboard/courses/${c._id}`} className="ml-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 text-sm">
                  View
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
