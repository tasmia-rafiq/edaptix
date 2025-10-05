import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/database";
import Test from "@/models/Test";
import Submission from "@/models/Submission";
import User from "@/models/User";

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

  return total > 0 ? Math.round((raw / total) * 100) : 0;
}

function getBarColor(percent: number) {
  if (percent >= 85) return "bg-emerald-500";
  if (percent >= 70) return "bg-teal-500";
  if (percent >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

// the id here is the testId
export default async function ResultPage({ params }: { params: Promise<{ id: string; submissionId: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/signin");
  }

  await connectToDatabase();

  const { id, submissionId } = await params;

  const submission = await Submission.findById(submissionId).lean();
  if (!submission) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto text-center py-12">
          <h1 className="text-2xl font-semibold">Result not found</h1>
          <p className="text-slate-500 mt-2">This attempt could not be found or was removed.</p>
          <div className="mt-6">
            <Link href="/dashboard" className="px-4 py-2 bg-teal text-white rounded-md">Back to dashboard</Link>
          </div>
        </div>
      </main>
    );
  }

  const test = await Test.findById(submission.id ?? id).lean();
  if (!test) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto text-center py-12">
          <h1 className="text-2xl font-semibold">Test not found</h1>
          <p className="text-slate-500 mt-2">The test associated with this result could not be found.</p>
          <div className="mt-6">
            <Link href="/dashboard" className="px-4 py-2 bg-teal text-white rounded-md">Back to dashboard</Link>
          </div>
        </div>
      </main>
    );
  }

  // permission: allow if viewer is student owner OR test creator (teacher)
  const viewerId = (user as any).id ?? (user as any)._id;
  const isStudentOwner = String(submission.studentId) === String(viewerId);
  const isTeacherOwner = String(test.createdBy) === String(viewerId) || (user as any).role === "teacher";

  if (!isStudentOwner && !isTeacherOwner) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto text-center py-12">
          <h1 className="text-2xl font-semibold">Access denied</h1>
          <p className="text-slate-500 mt-2">You don't have permission to view this result.</p>
          <div className="mt-6">
            <Link href="/dashboard" className="px-4 py-2 bg-teal text-white rounded-md">Back to dashboard</Link>
          </div>
        </div>
      </main>
    );
  }

  // fetch student user for display (best-effort)
  let studentUser: any = null;
  try {
    studentUser = await User.findById(submission.studentId).lean();
  } catch (e) {
    // ignore
  }

  // normalize test.questions: expected shape: [{ text, options: [string|{text}], correctIndex }]
  const questions = Array.isArray(test.questions) ? test.questions : [];

  // student's answers: submission.answers expected to be array of selected option indices
  const answers: number[] = Array.isArray(submission.answers) ? submission.answers.map((a: any) => (typeof a === "number" ? a : Number(a))) : [];

  const percent = computePercentNumberFromSubmission(submission);
  const barColor = getBarColor(percent);

  // Prepare per-question data
  const perQuestion = questions.map((q: any, qi: number) => {
    const opts = Array.isArray(q.options) ? q.options.map((o: any) => (typeof o === "string" ? o : (o?.text ?? String(o)))) : [];
    const correctIndex = typeof q.correctIndex === "number" ? q.correctIndex : -1;
    const selectedIndex = typeof answers[qi] === "number" && !Number.isNaN(answers[qi]) ? answers[qi] : -1;
    const correct = selectedIndex === correctIndex;
    return {
      index: qi,
      text: q.text ?? "",
      options: opts,
      correctIndex,
      selectedIndex,
      correct,
    };
  });

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-indigo">{test.title}</h1>
              {test.description && <p className="text-sm text-slate-500 mt-1">{test.description}</p>}
              <div className="text-xs text-slate-400 mt-2">
                Attempt #{submission.attempt ?? 1} • {formatDate(submission.createdAt)} • {questions.length} question{questions.length !== 1 ? "s" : ""}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="text-sm text-slate-500">Student</div>
              <div className="font-medium">{studentUser?.name ?? (String(submission.studentId).slice(0, 8) + "...")}</div>

              <div className="mt-2 w-44">
                <div className="text-xs text-slate-500">Score</div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-semibold">{percent}%</div>
                  <div className="flex-1">
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        className={`${barColor} h-full rounded-full`}
                        style={{ width: `${percent}%` }}
                        role="progressbar"
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Score ${percent} percent`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {isStudentOwner && (
                <div className="mt-3 flex gap-2">
                  <Link href={`/dashboard/tests/${test._id}`} className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50">Retake</Link>
                  <Link href="/dashboard" className="px-3 py-1.5 rounded-md bg-teal text-white">Back</Link>
              </div>
              )}
            </div>
          </div>

          <hr className="my-6 border-slate-200" />

          <section className="space-y-6">
            {perQuestion.map((pq) => (
              <article key={pq.index} className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 mb-2">
                      {pq.index + 1}. {pq.text}
                    </div>

                    <div className="space-y-2">
                      {pq.options.map((opt: string, oi: number) => {
                        const isSelected = oi === pq.selectedIndex;
                        const isCorrect = oi === pq.correctIndex;

                        // styling
                        let base = "flex items-center gap-3 px-3 py-2 rounded-md border ";
                        let textClass = "text-sm";
                        if (isCorrect) {
                          base += "bg-emerald-50 border-emerald-200";
                          textClass += " text-emerald-800 font-medium";
                        } else if (isSelected && !isCorrect) {
                          base += "bg-rose-50 border-rose-200";
                          textClass += " text-rose-700 font-medium";
                        } else {
                          base += "bg-slate-50 border-slate-200";
                          textClass += " text-slate-700";
                        }

                        const label = isCorrect
                            ? "Correct"
                            : isSelected
                            ? isStudentOwner
                              ? "Your answer"
                              : "Selected"
                            : null;

                        return (
                          <div key={oi} className={base}>
                            <div className="w-6 text-xs font-semibold text-slate-600">{String.fromCharCode(65 + oi)}.</div>
                            <div className={textClass}>{opt}</div>

                            <div className="ml-auto text-xs">
                              {label ? (
                                  <span className={`inline-flex items-center gap-1 ${isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                                    {isCorrect ? "✓ Correct" : (isStudentOwner ? "✕ Your answer" : "● Selected")}
                                  </span>
                                ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="shrink-0 pl-4 flex flex-col items-end gap-2">
                    <div className={`text-sm font-semibold ${pq.correct ? "text-emerald-600" : "text-rose-600"}`}>
                      {pq.correct ? "Correct" : "Incorrect"}
                    </div>
                    <div className="text-xs text-slate-400">
                      {pq.selectedIndex >= 0 && pq.correctIndex >= 0 ? (
                        <>{pq.selectedIndex === pq.correctIndex ? "You chose correctly" : `Correct: ${String.fromCharCode(65 + pq.correctIndex)}`}</>
                      ) : (
                        <>{pq.selectedIndex >= 0 ? `Selected: ${pq.selectedIndex}` : "No answer"}</>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
