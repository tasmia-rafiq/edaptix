import Link from "next/link";
import { connectToDatabase } from "@/lib/database";
import Submission from "@/models/Submission";
import Test from "@/models/Test";

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

function computePercentNumber(s: any): number {
  const raw = Number(s.score ?? 0);
  const total = Number(s.total ?? 0) || 0;

  return total > 0 ? Math.round((raw / total) * 100) : 0;
}


function getBarColorClass(percent: number) {
  if (percent >= 85) return "bg-emerald-500";
  if (percent >= 70) return "bg-teal-500";
  if (percent >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

export default async function StudentTestHistory({
  studentId,
}: {
  studentId: string;
}) {
  await connectToDatabase();

  const submissions = await Submission.find({ studentId })
    .sort({ createdAt: -1 })
    .lean();

  if (!submissions || submissions.length === 0) {
    return (
      <div className="rounded-md bg-white p-6 shadow-sm mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Your test attempts</h3>
            <p className="text-sm text-slate-500 mt-1">
              You haven't taken any tests yet — try a public test above.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const testIds = Array.from(
    new Set(submissions.map((s: any) => s.testId?.toString()).filter(Boolean))
  );
  const tests = await Test.find({ _id: { $in: testIds } }).lean();
  const testsMap: Record<string, any> = {};
  tests.forEach((t: any) => (testsMap[t._id.toString()] = t));

  // compute percent numbers for aggregates
  const percentList = submissions.map((s: any) => computePercentNumber(s));
  const totalAttempts = submissions.length;
  const avgScore =
    Math.round((percentList.reduce((a, b) => a + b, 0) / totalAttempts) * 10) / 10;
  const bestScore = Math.max(...percentList, 0);

  return (
    <section className="mt-8">
      <div className="rounded-2xl bg-white border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Your test attempts</h3>
            <p className="text-sm text-slate-500 mt-1">
              Recent tests you've taken — review results and retake where allowed.
            </p>
          </div>

          <div className="flex gap-6 items-center">
            <div className="text-right">
              <div className="text-sm text-slate-500">Attempts</div>
              <div className="text-xl font-semibold">{totalAttempts}</div>
            </div>

            <div className="text-right">
              <div className="text-sm text-slate-500">Avg. score</div>
              <div className="text-xl font-semibold">
                {isNaN(avgScore) ? "—" : `${avgScore}%`}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-slate-500">Best</div>
              <div className="text-xl font-semibold">{bestScore}%</div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {submissions.map((s: any) => {
            const test = testsMap[s.testId?.toString()];
            const percent = computePercentNumber(s);
            const barColor = getBarColorClass(percent);

            return (
              <article
                key={s._id?.toString()}
                className="flex items-center justify-between gap-4 p-4 rounded-lg border border-slate-200 hover:shadow-sm transition bg-slate-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">
                        {test?.title ?? "Untitled test"}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {test?.description
                          ? `${String(test.description).slice(0, 120)}`
                          : "No description"}
                      </div>
                    </div>

                    <div className="text-xs text-slate-400">
                      <div>Attempt #{s.attempt ?? 1}</div>
                      <div className="mt-1">{formatDate(s.createdAt)}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-sm">
                    {/* progress bar */}
                    <div className="flex-1 min-w-0">
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`${barColor} h-full rounded-full transition-all`}
                          style={{ width: `${percent}%` }}
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={percent}
                          aria-label={`Score ${percent} percent`}
                        />
                      </div>

                      <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                        <div>{s.total ? `${s.correctCount ?? Math.round((percent / 100) * (s.total || 0))} / ${s.total}` : ""}</div>
                        <div>{percent}%</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  <Link
                    href={`/dashboard/tests/${s.testId}/results/${s._id}`}
                    className="text-sm px-3 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    View result
                  </Link>

                  <Link
                    href={`/dashboard/tests/${s.testId}`}
                    className="text-sm px-3 py-1 rounded-md bg-indigo text-white"
                  >
                    Retake
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}