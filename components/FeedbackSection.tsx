"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function FeedbackSection({
  submissionId,
  initialFeedback,
}: {
  submissionId: string;
  initialFeedback?: string;
}) {
  const [feedback, setFeedback] = useState(initialFeedback || "");
  const [loading, setLoading] = useState(false);

  const handleRegenerate = async () => {
    if (!confirm("Regenerate AI feedback? This will replace the current one.")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/regenerate-feedback`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to regenerate feedback");

      setFeedback(data.feedback);
      alert("✅ Feedback regenerated successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Could not regenerate feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-10 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold text-indigo">Personalized Feedback</h2>

        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="px-3 py-1.5 bg-teal text-white rounded-md hover:bg-teal-700 disabled:opacity-50 text-sm"
        >
          {loading ? "Regenerating..." : "🔄 Regenerate Feedback"}
        </button>
      </div>

      <div className="prose prose-indigo max-w-none text-slate-800">
        {feedback ? (
          <ReactMarkdown
            components={{
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  className="text-blue-600 underline hover:text-blue-800 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              ),
            }}
          >
            {feedback}
          </ReactMarkdown>
        ) : (
          <p className="text-slate-500">No feedback available yet.</p>
        )}
      </div>
    </section>
  );
}
