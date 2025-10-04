"use client";

import React, { useState } from "react";

interface Test {
  _id: string;
  title: string;
  description?: string;
  questions: {
    text: string;
    options: { text: string }[];
    correctIndex?: number; // optional, hidden from students
  }[];
}

export default function TakeTest({
  test,
  studentId,
}: {
  test: Test;
  studentId: string;
}) {
  const [answers, setAnswers] = useState<number[]>(Array(test.questions.length).fill(-1));
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOptionSelect = (qIndex: number, optionIndex: number) => {
    if (submitted) return;
    const updated = [...answers];
    updated[qIndex] = optionIndex;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: test._id,
          studentId,
          answers,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");
      setSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
      alert("Something went wrong submitting your test.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">{test.title}</h1>
        {test.description && <p className="text-slate-600 mb-4">{test.description}</p>}
      </div>

      {test.questions.map((q, qi) => (
        <div key={qi} className="border rounded-lg p-4 bg-white shadow-sm">
          <h3 className="font-medium mb-3">{qi + 1}. {q.text}</h3>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => handleOptionSelect(qi, oi)}
                disabled={submitted}
                className={`w-full text-left px-4 py-2 border rounded-md transition
                  ${answers[qi] === oi ? "border-sky-500 bg-sky-50" : "border-slate-300"}
                  ${submitted ? "opacity-70 cursor-not-allowed" : "hover:border-sky-400"}
                `}
              >
                {String.fromCharCode(65 + oi)}. {opt.text}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-sky-600 text-white font-medium rounded-md hover:bg-sky-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Test"}
          </button>
        ) : (
          <p className="text-green-600 font-medium">✅ Test submitted successfully!</p>
        )}
      </div>
    </div>
  );
}
