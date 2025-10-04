import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/database";
import Test from "@/models/Test";
import Link from "next/link";
import React from "react";
import TakeTest from "@/components/TakeTest";

// export default async function TestPage({ params }: { params: { id: string } }) {


export default async function TestPage({ params }: { params: Promise<{id:string}> }) {
  const {id} = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  await connectToDatabase();

  // find test by id
  const test = await Test.findById(id).lean();
  if (!test) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-semibold mb-4">Test not found</h1>
          <p className="text-slate-500">We couldn't find that test. It may have been removed.</p>
          <div className="mt-6">
            <Link href="/dashboard" className="px-4 py-2 bg-sky-600 text-white rounded-md">Back to dashboard</Link>
          </div>
        </div>
      </main>
    );
  }

  // Teacher view (owner)
  const isOwner = String(test.createdBy) === String((user as any).id ?? (user as any)._id);
  const isTeacher = (user as any).role === "teacher";

  return (
    <main className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{test.title}</h1>
            {test.description && <p className="text-slate-600 mt-1">{test.description}</p>}
            <div className="text-xs text-slate-500 mt-2">
              {test.questions?.length ?? 0} questions • Visibility: {test.visibility}
            </div>
          </div>

          <div className="flex gap-2">
            {isOwner && (
              <>
                <Link href={`/dashboard/create-test?edit=${test._id}`} className="px-3 py-2 border rounded-md">Edit</Link>
                <Link href={`/dashboard/tests/${test._id}/results`} className="px-3 py-2 border rounded-md">Results</Link>
              </>
            )}
          </div>
        </header>

        <section className="bg-white p-6 rounded-lg shadow">
          {/* If student -> show TakeTest. If teacher -> show read-only preview */}
          {isTeacher && isOwner ? (
            <div>
              <h2 className="text-lg font-semibold mb-4">Preview (teacher)</h2>
              <ol className="space-y-4">
                {test.questions.map((q: any, qi: number) => (
                  <li key={qi} className="p-4 border rounded">
                    <div className="font-medium mb-2">{qi + 1}. {q.text}</div>
                    <div className="grid gap-2">
                      {q.options.map((opt: any, oi: number) => {
                        const correct = q.correctIndex === oi;
                        return (
                          <div key={oi} className={`px-3 py-2 rounded flex items-center justify-between ${correct ? "bg-green-50 border-green-200" : "bg-slate-50"}`}>
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-medium">{String.fromCharCode(65 + oi)}.</div>
                              <div className="text-sm">{opt.text}</div>
                            </div>
                            {correct && <div className="text-xs text-green-700 font-medium">Correct</div>}
                          </div>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            // Student view: render take test
            //  should take in test id
            <TakeTest 
                    test={JSON.parse(JSON.stringify(test))} 
                    studentId={String(user._id)} 
                  />

          )}
        </section>
      </div>
    </main>
  );
}
