"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash, ChevronUp, ChevronDown } from "lucide-react";

type Option = { text: string };
type Question = { text: string; options: Option[]; correctIndex: number };

function emptyQuestion(): Question {
  return { text: "", options: [{ text: "" }, { text: "" }], correctIndex: 0 };
}

export default function CreateTestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get("edit") ?? null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>(() => [
    emptyQuestion(),
  ]);
  const [visibility, setVisibility] = useState<"private" | "public">("public");

  const [loading, setLoading] = useState(false); // for saving
  const [loadingInitial, setLoadingInitial] = useState(false); // for fetching test
  const [error, setError] = useState<string | null>(null);

  // Fetch existing test if editId present
  useEffect(() => {
    if (!editId) return;

    let mounted = true;
    (async () => {
      setLoadingInitial(true);
      setError(null);
      try {
        const res = await fetch(`/api/tests/${editId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (res.status === 404) {
          setError("Test not found.");
          setLoadingInitial(false);
          return;
        }

        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setError(d?.error || "Failed to load test for editing.");
          setLoadingInitial(false);
          return;
        }

        const data = await res.json();
        if (!mounted) return;

        // Expected shape: { _id, title, description, visibility, questions: [{ text, options: [..], correctIndex }, ...] }
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setVisibility(data.visibility === "public" ? "public" : "private");
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(
            data.questions.map((q: any) => {
              const options = Array.isArray(q.options)
                ? q.options.map((o: any) => {
                    if (typeof o === "string") return { text: o };
                    if (o && typeof o === "object")
                      return { text: String(o.text ?? "") };
                    return { text: "" };
                  })
                : [{ text: "" }, { text: "" }];

              return {
                text: String(q.text ?? ""),
                options,
                correctIndex:
                  typeof q.correctIndex === "number" ? q.correctIndex : 0,
              } as Question;
            })
          );
        } else {
          setQuestions([emptyQuestion()]);
        }
      } catch (err: any) {
        console.error("Load test error", err);
        setError("Failed to load test. Check console.");
      } finally {
        if (mounted) setLoadingInitial(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [editId]);

  // form helpers (same as your current ones)
  function addQuestion() {
    setQuestions((q) => [...q, emptyQuestion()]);
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateQuestionText(index: number, text: string) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, text } : q))
    );
  }

  function addOption(questionIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === questionIndex
          ? { ...q, options: [...q.options, { text: "" }] }
          : q
      )
    );
  }

  function updateOptionText(
    questionIndex: number,
    optionIndex: number,
    text: string
  ) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              options: q.options.map((o, oi) =>
                oi === optionIndex ? { ...o, text } : o
              ),
            }
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
        if (correctIndex >= nextOptions.length)
          correctIndex = nextOptions.length - 1;
        return { ...q, options: nextOptions, correctIndex };
      })
    );
  }

  function setCorrectIndex(questionIndex: number, index: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === questionIndex ? { ...q, correctIndex: index } : q
      )
    );
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

  // submit (create or update)
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
      if (
        typeof q.correctIndex !== "number" ||
        q.correctIndex < 0 ||
        q.correctIndex >= q.options.length
      ) {
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

      let res;
      if (editId) {
        // update existing test
        res = await fetch(`/api/tests/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // create new test
        res = await fetch("/api/tests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to save test");
        setLoading(false);
        return;
      }

      // success -> navigate to test view
      const id = editId ?? data.id;
      router.push(`/dashboard/tests/${id}`);
    } catch (err: any) {
      console.error("Save test error", err);
      setError("Failed to save test. Check console.");
    } finally {
      setLoading(false);
    }
  }

  // initial loading UI
  if (loadingInitial) {
    return (
      <div className="p-6 bg-white rounded shadow text-center">
        Loading test for edit…
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-6 rounded-md shadow"
    >
      <div className="flex gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Test title (e.g., Midterm - Algebra)"
          className="form_input"
          required
        />
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as any)}
          className="px-3 py-2 border border-slate-300 rounded-md"
        >
          <option value="private">Private</option>
          <option value="public">Public (students can see)</option>
        </select>
      </div>

      <div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description (optional)"
          className="form_input"
          rows={2}
        />
      </div>

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={qi} className="p-4 border border-slate-400 rounded-md">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">Question {qi + 1}</div>
                <div className="text-xs text-slate-500">
                  ({q.options.length} options)
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveQuestionUp(qi)}
                  title="Move up"
                  className="p-1"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => moveQuestionDown(qi)}
                  title="Move down"
                  className="p-1"
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => removeQuestion(qi)}
                  title="Remove"
                  className="p-1 text-red-600"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>

            <div className="mb-3">
              <input
                value={q.text}
                onChange={(e) => updateQuestionText(qi, e.target.value)}
                placeholder="Enter question text"
                className="form_input"
              />
            </div>

            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex gap-2 items-center">
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
                    className="form_input"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(qi, oi)}
                    className="p-1 text-red-600"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => addOption(qi)}
                  className="inline-flex items-center gap-2 px-3 py-1 border border-slate-400 rounded text-sm"
                >
                  <Plus size={14} /> Add option
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={addQuestion}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 rounded-md"
        >
          <Plus size={16} /> Add question
        </button>

        <button
          type="submit"
          disabled={loading}
          className="ml-auto px-4 py-2 bg-teal text-white rounded-md"
        >
          {loading ? "Saving..." : editId ? "Save changes" : "Save test"}
        </button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
    </form>
  );
}
