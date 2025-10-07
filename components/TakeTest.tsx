"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";


export default function TakeTest({ test, studentId }: { test: any; studentId: string }) {
  const total = test.questions?.length ?? 0;
  const [answers, setAnswers] = useState<number[]>(Array(total).fill(-1));
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<null | {
    score: number;
    total: number;
    attempt: number;
    submissionId: string;
    feedback?: string;
  }>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const select = (qIndex: number, optIndex: number) => {
    if (submittedResult) return; // disable after submit
    const copy = [...answers];
    copy[qIndex] = optIndex;
    setAnswers(copy);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

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

      setSubmittedResult({
        score: data.score,
        total: data.total,
        attempt: data.attempt,
        submissionId: data.submissionId,
        feedback: data.feedback,
      });
    } catch (err) {
      console.error(err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

    const handleRegenerateFeedback = async () => {
    if (!submittedResult) return;
    if (!confirm("Regenerate AI feedback? This will replace the current one.")) return;

    setRegenerating(true);
    try {
      const res = await fetch(
        `/api/submissions/${submittedResult.submissionId}/regenerate-feedback`,
        { method: "POST" }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to regenerate feedback");

      setSubmittedResult({
        ...submittedResult,
        feedback: data.feedback,
      });

      alert("✅ Feedback regenerated successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Could not regenerate feedback.");
    } finally {
      setRegenerating(false);
    }
  };

  if (submittedResult) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-green-600">Test submitted successfully</h2>
          <p>
            <strong>Score:</strong> {submittedResult.score} / {submittedResult.total}
          </p>
          <p>
            <strong>Attempt:</strong> #{submittedResult.attempt}
          </p>
          <p className="text-sm text-slate-500">
            <strong>Submission ID:</strong> {submittedResult.submissionId}
          </p>
        </div>

        {submittedResult.feedback && (
          <div className="border rounded-lg bg-gray-50 p-4 shadow-sm">
            <button
              onClick={() => setShowFeedback(!showFeedback)}
              className="flex justify-between w-full text-left font-medium text-teal-700 hover:text-teal-900"
            >
              <span>📘 View Personalized AI Feedback</span>
              <span>{showFeedback ? "▲" : "▼"}</span>
            </button>
             <button
                onClick={handleRegenerateFeedback}
                disabled={regenerating}
                className="ml-4 px-3 py-1.5 bg-teal text-white rounded-md hover:bg-teal-700 disabled:opacity-50 text-sm"
              >
                {regenerating ? "Regenerating..." : "🔄 Regenerate"}
              </button>

            {showFeedback && (
              <div className="mt-4 whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
                <ReactMarkdown
                components={{
                  a: ({node, ...props}) =>(
                    <a {...props}
                    className="text-blue-600 underline hover:text-blue-800 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"/>
                  ),
                  }
                }
                >{submittedResult.feedback}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {test.questions.map((q: any, qi: number) => (
        <div key={qi} className="border p-4 rounded-md bg-white">
          <div className="mb-3 font-medium">
            {qi + 1}. {q.text}
          </div>
          <div className="flex flex-col gap-2">
            {q.options.map((opt: any, oi: number) => (
              <label
                key={oi}
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${
                  answers[qi] === oi
                    ? "bg-sky-50 border border-sky-200"
                    : "hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name={`q-${qi}`}
                  checked={answers[qi] === oi}
                  onChange={() => select(qi, oi)}
                  className="h-4 w-4"
                />
                <span>
                  {String.fromCharCode(65 + oi)}. {opt.text}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-teal text-white rounded-md disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Test"}
        </button>
      </div>
    </form>
  );
}
