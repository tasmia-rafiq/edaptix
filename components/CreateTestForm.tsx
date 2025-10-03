// components/CreateTestForm.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash, ChevronUp, ChevronDown } from "lucide-react";

type Option = { text: string };
type Question = { text: string; options: Option[]; correctIndex: number };

function emptyQuestion(): Question {
  return {
    text: "",
    options: [{ text: "" }, { text: "" }],
    correctIndex: 0,
  };
}

export default function CreateTestForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>(() => [emptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"private" | "public">("private");

  function addQuestion() {
    setQuestions((q) => [...q, emptyQuestion()]);
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateQuestionText(index: number, text: string) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, text } : q)));
  }

  function addOption(questionIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === questionIndex ? { ...q, options: [...q.options, { text: "" }] } : q
      )
    );
  }

  function updateOptionText(questionIndex: number, optionIndex: number, text: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === questionIndex
          ? { ...q, options: q.options.map((o, oi) => (oi === optionIndex ? { ...o, text } : o)) }
          : q
      )
    );
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== questionIndex) return q;
        const nextOptions = q.options.filter((_, oi) => oi !== optionIndex);
        let correctIndex = q.correctIndex;
        if (nextOptions.length === 0) {
          return { ...q, options: nextOptions, correctIndex: -1 };
        }
        if (correctIndex >= nextOptions.length) correctIndex = nextOptions.length - 1;
        return { ...q, options: nextOptions, correctIndex };
      })
    );
  }

  function setCorrectIndex(questionIndex: number, index: number) {
    setQuestions((prev) => prev.map((q, i) => (i === questionIndex ? { ...q, correctIndex: index } : q)));
  }

  function moveQuestionUp(index: number) {
    setQuestions((prev) => {
      if (index <= 0) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(index - 1, 0, item);
      return copy;
    });
  }

  function moveQuestionDown(index: number) {
    setQuestions((prev) => {
      if (index >= prev.length - 1) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(index + 1, 0, item);
      return copy;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (questions.length === 0) {
      setError("Add at least one question.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setError(`Question ${i + 1}: text is required.`);
        return;
      }
      if (!q.options || q.options.length < 2) {
        setError(`Question ${i + 1}: at least 2 options required.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].text.trim()) {
          setError(`Question ${i + 1}, option ${j + 1}: text is required.`);
          return;
        }
      }
      if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
        setError(`Question ${i + 1}: set a valid correct option.`);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        visibility,
        questions: questions.map((q) => ({
          text: q.text.trim(),
          options: q.options.map((o) => o.text.trim()),
          correctIndex: q.correctIndex,
        })),
      };

      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to create test");
        setLoading(false);
        return;
      }

      router.push(`/dashboard/tests/${data.id}`);
    } catch (err: any) {
      console.error(err);
      setError("Failed to create test. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-md shadow">
      <div className="flex gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Test title (e.g., Midterm - Algebra)"
          className="flex-1 px-3 py-2 border rounded-md"
          required
        />
        <select value={visibility} onChange={(e) => setVisibility(e.target.value as any)} className="px-3 py-2 border rounded-md">
          <option value="private">Private</option>
          <option value="public">Public (students can see)</option>
        </select>
      </div>

      <div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description (optional)"
          className="w-full px-3 py-2 border rounded-md"
          rows={2}
        />
      </div>

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={qi} className="p-4 border rounded-md">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">Question {qi + 1}</div>
                <div className="text-xs text-slate-500">({q.options.length} options)</div>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => moveQuestionUp(qi)} title="Move up" className="p-1">
                  <ChevronUp size={16} />
                </button>
                <button type="button" onClick={() => moveQuestionDown(qi)} title="Move down" className="p-1">
                  <ChevronDown size={16} />
                </button>
                <button type="button" onClick={() => removeQuestion(qi)} title="Remove" className="p-1 text-red-600">
                  <Trash size={16} />
                </button>
              </div>
            </div>

            <div className="mb-3">
              <input
                value={q.text}
                onChange={(e) => updateQuestionText(qi, e.target.value)}
                placeholder="Enter question text"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex gap-2 items-center">
                  {/* name uses deterministic question index so SSR/client match */}
                  <input
                    type="radio"
                    name={`correct_${qi}`}
                    checked={q.correctIndex === oi}
                    onChange={() => setCorrectIndex(qi, oi)}
                    className="h-4 w-4"
                  />
                  <input
                    value={opt.text}
                    onChange={(e) => updateOptionText(qi, oi, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                    className="flex-1 px-3 py-2 border rounded-md"
                  />
                  <button type="button" onClick={() => removeOption(qi, oi)} className="p-1 text-red-600">
                    <Trash size={16} />
                  </button>
                </div>
              ))}

              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => addOption(qi)} className="inline-flex items-center gap-2 px-3 py-1 border rounded text-sm">
                  <Plus size={14} /> Add option
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={addQuestion} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-md">
          <Plus size={16} /> Add question
        </button>

        <button type="submit" disabled={loading} className="ml-auto px-4 py-2 bg-sky-600 text-white rounded-md">
          {loading ? "Saving..." : "Save test"}
        </button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
    </form>
  );
}
