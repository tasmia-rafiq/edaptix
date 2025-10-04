import React from "react";
import { connectToDatabase } from "@/lib/database";
import Test from "@/models/Test";
import Submission from "@/models/Submission"; // import submission model
import Link from "next/link";

function formatDate(iso?: string | Date) {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default async function AllAvailableTests({ studentId }: { studentId: string }) {
  await connectToDatabase();

  const tests = await Test.find({ visibility: "public" }).sort({ createdAt: -1 }).lean();

  // fetch submissions for this student
  const submissions = await Submission.find({ studentId }).lean();

  // Map testId -> submission info for quick lookup
  const submissionsMap: Record<string, { attempts: number; lastScore: number }> = {};
  submissions.forEach((s) => {
    const key = s.testId.toString();
    if (!submissionsMap[key]) {
      submissionsMap[key] = { attempts: 1, lastScore: s.score };
    } else {
      submissionsMap[key].attempts += 1;
      submissionsMap[key].lastScore = s.score;
    }
  });

  if (!tests || tests.length === 0) {
    return (
      <div className="rounded-md bg-white p-6 shadow-sm">
        <p className="text-slate-600">No public tests are available yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {tests.map((t: any) => {
        const submissionInfo = submissionsMap[t._id.toString()] || { attempts: 0, lastScore: 0 };

        return (
          <article
            key={t._id}
            className="group bg-white border border-slate-300 rounded-lg shadow-sm p-5 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-800 truncate">{t.title}</h3>
                {t.description && (
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">{t.description}</p>
                )}

                <div className="mt-3 flex flex-col gap-1 text-xs text-slate-500">
                  <span>{(t.questions?.length ?? 0)} questions</span>
                  <span>Attempts: {submissionInfo.attempts}</span>
                  {submissionInfo.attempts > 0 && <span>Last score: {submissionInfo.lastScore}</span>}
                  <span>Created: <strong>{formatDate(t.createdAt)}</strong></span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <Link
                  href={`/dashboard/tests/${t._id}`}
                  className="text-sm px-3 py-1 rounded-md border border-slate-400 text-slate-700 hover:bg-slate-50"
                >
                  Take Test
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
