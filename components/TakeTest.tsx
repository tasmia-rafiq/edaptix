// components/TakeTest.tsx
"use client";

import React, { useState } from "react";

export default function TakeTest({ test, studentId }: { test: any;studentId: string }) {
  // test is plain object: { _id, title, questions: [{ text, options: [{text}], ...}], ... }
  const total = test.questions?.length ?? 0;
  const [answers, setAnswers] = useState<number[]>(Array(total).fill(-1));
  const [loading, setLoading] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<null | { score: number; total: number; attempt: number; submissionId: string }>(null);
  const [error, setError] = useState<string | null>(null);

  const select = (qIndex: number, optIndex: number) => {
    if (submittedResult) return; // disable after submit
    const copy = [...answers];
    copy[qIndex] = optIndex;
    setAnswers(copy);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    // basic client validation: all questions answered
    if (answers.some((a) => a === -1)) {
      setError("Please answer all questions before submitting.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId: test._id, answers }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Submission failed");
        setLoading(false);
        return;
      }

      setSubmittedResult({ score: data.score, total: data.total, attempt: data.attempt, submissionId: data.submissionId });
    } catch (err) {
      console.error(err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (submittedResult) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-green-600">Test submitted</h2>
        <p>
          Score: <strong>{submittedResult.score}</strong> / {submittedResult.total}
        </p>
        <p>Attempt #{submittedResult.attempt}</p>
        <p className="text-sm text-slate-500">Submission id: {submittedResult.submissionId}</p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
      {test.questions.map((q: any, qi: number) => (
        <div key={qi} className="border p-4 rounded-md bg-white">
          <div className="mb-3 font-medium">
            {qi + 1}. {q.text}
          </div>
          <div className="flex flex-col gap-2">
            {q.options.map((opt: any, oi: number) => (
              <label key={oi} className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${answers[qi] === oi ? "bg-sky-50 border border-sky-200" : "hover:bg-slate-50"}`}>
                <input
                  type="radio"
                  name={`q-${qi}`}
                  checked={answers[qi] === oi}
                  onChange={() => select(qi, oi)}
                  className="h-4 w-4"
                />
                <span>{String.fromCharCode(65 + oi)}. {opt.text}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-teal text-white rounded-md disabled:opacity-50">
          {loading ? "Submitting..." : "Submit Test"}
        </button>
      </div>
    </form>
  );
}
