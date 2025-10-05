// components/AllTests.tsx
import React from "react";
import { connectToDatabase } from "@/lib/database";
import Test from "@/models/Test";
import Link from "next/link";
import { Eye, Edit, BarChart3, Globe, Lock } from "lucide-react";

type Props = {
  teacherId: string;
};

function formatDate(iso?: string | Date) {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AllTests({ teacherId }: Props) {
  // teacherId must be a plain string (not a Mongoose ObjectId)
  await connectToDatabase();
  const tests = await Test.find({ createdBy: teacherId })
    .sort({ createdAt: -1 })
    .lean();

  if (!tests || tests.length === 0) {
    return (
      <div className="rounded-md bg-white p-6 shadow-sm text-center">
        <p className="text-slate-600">You haven’t created any tests yet.</p>
        <div className="mt-4">
          <Link
            href="/dashboard/create-test"
            className="inline-flex items-center gap-2 px-5 py-2 bg-teal text-white rounded-lg hover:bg-teal/90 transition"
          >
            + Create your first test
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {tests.map((t: any) => (
        <article
          key={String(t._id)}
          className="group bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition flex flex-col justify-between"
        >
          {/* Top Info */}
          <div className="p-5 flex-1">
            <h3 className="text-lg font-semibold text-slate-800 truncate">
              {t.title}
            </h3>
            {t.description && (
              <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                {t.description}
              </p>
            )}

            <div className="mt-3 flex items-center flex-wrap gap-3 text-xs text-slate-500">
              <span>{t.questions?.length ?? 0} questions</span>
              <span>•</span>
              <span>
                {t.visibility === "public" ? (
                  <span className="inline-flex items-center gap-1 text-teal-600 font-medium">
                    <Globe size={12} /> Public
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                    <Lock size={12} /> Private
                  </span>
                )}
              </span>
              <span>•</span>
              <span>Created: {formatDate(t.createdAt)}</span>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50/60 rounded-b-xl">
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/tests/${t._id}`}
                className="flex items-center gap-1 text-xs text-slate-700 bg-white border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-100 transition"
                title="View Test"
              >
                <Eye size={14} /> View
              </Link>

              <Link
                href={`/dashboard/create-test?edit=${t._id}`}
                className="flex items-center gap-1 text-xs text-slate-700 bg-white border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-100 transition"
                title="Edit Test"
              >
                <Edit size={14} /> Edit
              </Link>

              <Link
                href={`/dashboard/tests/${t._id}/attempts`}
                className="flex items-center gap-1 text-xs text-slate-700 bg-white border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-100 transition"
                title="View Attempts"
              >
                <BarChart3 size={14} /> Attempts
              </Link>
            </div>

            <form
              action={`/api/tests/${t._id}/toggle-visibility`}
              method="POST"
              className="ml-auto"
            >
              <input
                type="hidden"
                name="current"
                value={t.visibility ?? "private"}
              />
              <button
                type="submit"
                className={`text-xs px-3 py-1.5 rounded-md border ${
                  t.visibility === "public"
                    ? "border-red-300 text-red-600 hover:bg-red-50"
                    : "border-teal-300 text-teal-600 hover:bg-teal-50"
                } transition`}
              >
                {t.visibility === "public" ? "Unpublish" : "Publish"}
              </button>
            </form>
          </div>
        </article>
      ))}
    </div>
  );
}
