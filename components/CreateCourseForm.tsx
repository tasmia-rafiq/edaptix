"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash,
  ImageIcon,
  Video,
  ChevronDown,
  ChevronUp,
  CloudUpload,
  Tag,
  DollarSign,
  File,
} from "lucide-react";

type LessonDraft = {
  id: string;
  title: string;
  type: "video" | "article";
  content: string; // video -> cloud url, article -> markdown/html
  testId?: string | null;
  uploading?: boolean;
  uploadProgress?: number; // 0..100
  summary?: string;
  durationMinutes?: number | null;
  collapsed?: boolean;
};

export default function CreateCourseForm({
  teacherTests,
}: {
  teacherTests: { id: string; title: string }[];
}) {
  const router = useRouter();
  // file limits (client-side)
  const MAX_COVER_MB = 10;
  const MAX_VIDEO_MB = 1024; // ~1GB, adjust to plan
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  // Course metadata
  const [published, setPublished] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">(
    "Beginner"
  );
  const [language, setLanguage] = useState("English");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<number | "">("");
  const [estimatedDuration, setEstimatedDuration] = useState<number | "">("");

  // cover
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverProgress, setCoverProgress] = useState(0);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // lessons
  const [lessons, setLessons] = useState<LessonDraft[]>(() => [
    {
      id: String(Date.now()) + "-l0",
      title: "",
      type: "video",
      content: "",
      testId: null,
      uploading: false,
      uploadProgress: 0,
      summary: "",
      durationMinutes: null,
      collapsed: false,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // --- helper: signature + upload (signed) ---
  async function uploadFileToCloudinarySigned(
    file: File,
    type: "image" | "video",
    opts?: { folder?: string; onProgress?: (p: number) => void }
  ): Promise<{ secure_url: string; public_id?: string }> {
    // request signature
    const signResp = await fetch("/api/uploads/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: opts?.folder ?? `edaptix/${type}s` }),
      credentials: "same-origin",
    });
    if (!signResp.ok) {
      const err = await signResp.json().catch(() => ({}));
      throw new Error(err?.error || "Failed to get upload signature");
    }
    const sign = await signResp.json();
    const { cloudName, apiKey, timestamp, signature, folder } = sign;
    if (!cloudName || !apiKey || !timestamp || !signature) {
      throw new Error("Invalid signature response");
    }
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
    if (folder) formData.append("folder", folder);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);

      xhr.upload.addEventListener("progress", (ev) => {
        if (ev.lengthComputable && opts?.onProgress) {
          const pct = Math.round((ev.loaded / ev.total) * 100);
          opts.onProgress(pct);
        }
      });

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const resp = JSON.parse(xhr.responseText);
              resolve(resp);
            } catch (e) {
              reject(new Error("Failed to parse upload response"));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(formData);
    });
  }

  // --- UI helpers ---
  function addLesson() {
    setLessons((s) => [
      ...s,
      {
        id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8),
        title: "",
        type: "video",
        content: "",
        testId: null,
        uploading: false,
        uploadProgress: 0,
        summary: "",
        durationMinutes: null,
        collapsed: false,
      },
    ]);
  }

  function confirmAndRemoveLesson(idx: number) {
    if (
      !confirm(
        `Remove lesson ${
          idx + 1
        }? This will discard any uploaded video for this lesson.`
      )
    )
      return;
    setLessons((s) => s.filter((_, i) => i !== idx));
  }

  function toggleCollapse(idx: number) {
    setLessons((s) =>
      s.map((l, i) => (i === idx ? { ...l, collapsed: !l.collapsed } : l))
    );
  }

  function updateLesson(idx: number, patch: Partial<LessonDraft>) {
    setLessons((s) => s.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  // --- tags ---
  function addTagFromInput() {
    const t = tagInput.trim();
    if (!t) return;
    if (tags.includes(t)) {
      setTagInput("");
      return;
    }
    setTags((x) => [...x, t].slice(0, 10)); // limit tags
    setTagInput("");
  }
  function removeTag(idx: number) {
    setTags((s) => s.filter((_, i) => i !== idx));
  }

  // --- uploads ---
  async function handleCoverPick(file?: File) {
    setErrors([]);
    if (!file) {
      coverInputRef.current?.click();
      return;
    }
    if (file.size > MAX_COVER_MB * 1024 * 1024) {
      setErrors([`Cover must be under ${MAX_COVER_MB} MB`]);
      return;
    }
    setCoverUploading(true);
    setCoverProgress(0);
    try {
      const res = await uploadFileToCloudinarySigned(file, "image", {
        folder: "edaptix/covers",
        onProgress: (p) => setCoverProgress(p),
      });
      setCoverImage(res.secure_url);
    } catch (e) {
      console.error(e);
      setErrors(["Cover upload failed. Try again."]);
    } finally {
      setCoverUploading(false);
      setCoverProgress(0);
    }
  }

  async function handleLessonFileChoose(idx: number, file?: File) {
    setErrors([]);
    const l = lessons[idx];
    if (!l) return;
    if (!file) {
      fileInputRefs.current[l.id]?.click();
      return;
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setErrors([
        `Video must be under ${MAX_VIDEO_MB} MB (your plan may vary).`,
      ]);
      return;
    }
    updateLesson(idx, { uploading: true, uploadProgress: 0 });
    try {
      const res = await uploadFileToCloudinarySigned(file, "video", {
        folder: "edaptix/videos",
        onProgress: (p) => updateLesson(idx, { uploadProgress: p }),
      });
      updateLesson(idx, {
        content: res.secure_url,
        uploading: false,
        uploadProgress: 100,
      });
    } catch (err) {
      console.error(err);
      updateLesson(idx, { uploading: false, uploadProgress: 0 });
      setErrors(["Lesson upload failed. Try again."]);
    }
  }

  // --- submit ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    const nextErrors: string[] = [];

    if (!title.trim()) nextErrors.push("Course title is required.");
    if (!description.trim()) nextErrors.push("Course description is required.");
    if (lessons.length === 0) nextErrors.push("Add at least one lesson.");
    lessons.forEach((L, i) => {
      if (!L.title.trim())
        nextErrors.push(`Lesson ${i + 1}: title is required.`);
      if (!L.content.trim())
        nextErrors.push(`Lesson ${i + 1}: content is required.`);
      if (L.uploading) nextErrors.push(`Lesson ${i + 1} is still uploading.`);
    });
    if (isPaid && (price === "" || Number(price) <= 0))
      nextErrors.push("Enter a valid price for paid courses.");

    if (nextErrors.length) {
      setErrors(nextErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        description: description.trim(),
        coverImage: coverImage || undefined,
        category: category.trim() || undefined,
        level,
        language,
        tags,
        price: isPaid ? Number(price) : 0,
        estimatedDuration: estimatedDuration
          ? Number(estimatedDuration)
          : undefined,
        lessons: lessons.map((l) => ({
          title: l.title.trim(),
          type: l.type,
          content: l.content.trim(),
          testId: l.testId || undefined,
          summary: l.summary || undefined,
          durationMinutes: l.durationMinutes || undefined,
        })),
        published,
      };

      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors([data?.error || "Failed to create course."]);
        setLoading(false);
        return;
      }
      router.push(`/dashboard/courses/${data.id}`);
    } catch (err) {
      console.error(err);
      setErrors(["Something went wrong. Please try again."]);
    } finally {
      setLoading(false);
    }
  }

  // small helper renderers
  const renderProgress = (p: number) => (
    <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
      <div
        className="h-full rounded"
        style={{
          width: `${p}%`,
          background:
            p > 66
              ? "linear-gradient(90deg,#10b981,#06b6d4)"
              : p > 33
              ? "#f59e0b"
              : "#ef4444",
        }}
        role="progressbar"
        aria-valuenow={p}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-6 rounded-2xl shadow-lg"
    >
      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-md border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
          <div className="font-medium mb-1">Please fix the following</div>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Top row: title + cover */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* publish toggle */}
        <div className="flex items-center gap-2">
          <input
            id="published"
            type="checkbox"
            checked={published}
            onChange={() => setPublished((s) => !s)}
          />
          <label htmlFor="published" className="text-sm text-slate-600">
            Publish now (make course public)
          </label>
        </div>
        <div className="lg:col-span-2 space-y-3">
          <label className="form_label">Course title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Intro to Algebra"
            className="form_input"
          />

          <label className="form_label">Subtitle (optional)</label>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="A short subtitle to explain audience"
            className="form_input"
          />

          <label className="form_label mt-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Write a compelling course description that explains outcomes and audience."
            className="form_input h-40 resize-none"
          />
        </div>

        <aside className="space-y-3">
          <label className="form_label">Cover image</label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer?.files?.[0];
              if (f) handleCoverPick(f);
            }}
            className="w-56 h-36 rounded-lg border border-dashed border-slate-200 flex items-center justify-center bg-slate-50 cursor-pointer"
            onClick={() => coverInputRef.current?.click()}
            title="Click or drop an image"
          >
            <div className="text-center text-slate-500">
              {coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverImage}
                  alt="cover"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <>
                  <CloudUpload className="mx-auto" />
                  <div className="text-xs mt-1">
                    Upload cover (recommended 1280×720)
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="primary_btn flex items-center gap-1"
            >
              <File className="size-4" /> Select file
            </button>
            {coverImage && (
              <button
                type="button"
                onClick={() => setCoverImage(null)}
                className="primary_btn white_btn flex items-center gap-1"
              >
                <Trash className="size-4" /> Remove
              </button>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleCoverPick(f);
              }}
            />
          </div>

          {coverUploading && (
            <div className="mt-1">
              <div className="text-xs text-slate-500 mb-1">
                Uploading cover — {coverProgress}%
              </div>
              {renderProgress(coverProgress)}
            </div>
          )}
        </aside>
      </div>

      {/* metadata row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="form_label">Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Mathematics"
            className="form_input"
          />
        </div>

        <div>
          <label className="form_label">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as any)}
            className="form_input"
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>

        <div>
          <label className="form_label">Language</label>
          <input
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="English"
            className="form_input"
          />
        </div>

        <div>
          <label className="form_label">Estimated duration (mins)</label>
          <input
            type="number"
            min={0}
            value={String(estimatedDuration)}
            onChange={(e) =>
              setEstimatedDuration(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            placeholder="90"
            className="form_input"
          />
        </div>
      </div>

      {/* tags + price */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div>
          <label className="form_label">Tags</label>
          <div className="mt-2 flex gap-2 items-center">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTagFromInput();
                }
              }}
              placeholder="Add a tag and press Enter"
              className="form_input"
            />
            <button
              type="button"
              onClick={addTagFromInput}
              className="px-3 py-2 rounded-md bg-teal text-white"
            >
              <Tag size={14} />
            </button>
          </div>
          <div className="mt-2 flex gap-2 flex-wrap">
            {tags.map((t, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-slate-100 text-xs"
              >
                <span>{t}</span>
                <button
                  type="button"
                  onClick={() => removeTag(i)}
                  className="text-xs px-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="form_label">Pricing</label>
          <div className="mt-2 flex items-center gap-3">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="priceMode"
                checked={!isPaid}
                onChange={() => setIsPaid(false)}
              />
              <span className="text-sm">Free</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="priceMode"
                checked={isPaid}
                onChange={() => setIsPaid(true)}
              />
              <span className="text-sm">Paid</span>
            </label>

            {isPaid && (
              <div className="ml-auto flex items-center gap-2">
                <DollarSign />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={String(price)}
                  onChange={(e) =>
                    setPrice(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="form_input"
                  placeholder="9.99"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <hr className="border-slate-300" />

      {/* Lessons */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-indigo">Lessons</h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addLesson}
              className="inline-flex items-center gap-2 primary_btn"
            >
              <Plus size={14} /> Add lesson
            </button>
            <div className="text-sm text-slate-500">
              {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {lessons.map((l, i) => (
            <div
              key={l.id}
              className="rounded-lg border border-slate-300 p-4 bg-slate-50 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-md bg-teal-100 flex items-center justify-center text-teal font-semibold">
                  {i + 1}
                </div>

                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <input
                          value={l.title}
                          onChange={(e) =>
                            updateLesson(i, { title: e.target.value })
                          }
                          placeholder={`Lesson ${i + 1} title`}
                          className="form_input bg-white"
                        />
                        <select
                          value={l.type}
                          onChange={(e) =>
                            updateLesson(i, {
                              type: e.target.value as any,
                              content: "",
                            })
                          }
                          className="form_input bg-white flex-1/3"
                        >
                          <option value="video">Video</option>
                          <option value="article">Article</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => toggleCollapse(i)}
                          className="form_input bg-white flex-1/5 flex gap-1 items-center"
                        >
                          {l.collapsed ? (
                            <>
                              <ChevronDown size={14} /> Expand
                            </>
                          ) : (
                            <>
                              <ChevronUp size={14} /> Collapse
                            </>
                          )}
                        </button>
                      </div>

                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 items-start gap-3">
                        <textarea
                          value={l.summary || ""}
                          onChange={(e) =>
                            updateLesson(i, { summary: e.target.value })
                          }
                          placeholder="Short summary (optional)"
                          className="form_input bg-white md:col-span-2 h-26 resize-none"
                        />

                        <input
                          type="number"
                          min={0}
                          value={String(l.durationMinutes ?? "")}
                          onChange={(e) =>
                            updateLesson(i, {
                              durationMinutes:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                          placeholder="Duration (mins)"
                          className="form_input bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => confirmAndRemoveLesson(i)}
                        className="px-3 py-2.5 rounded-md bg-red-50 text-red-600 border"
                      >
                        <Trash className="size-4" />
                      </button>
                    </div>
                  </div>

                  {!l.collapsed && (
                    <>
                      <div className="mt-3">
                        {l.type === "video" ? (
                          <div className="flex items-start gap-4">
                            <div className="w-48 h-28 bg-slate-200 rounded-md border border-slate-400 flex items-center justify-center overflow-hidden">
                              {l.content ? (
                                <video
                                  src={l.content}
                                  className="w-full h-full object-cover"
                                  controls
                                />
                              ) : (
                                <div className="text-xs text-slate-400 text-center">
                                  <Video />
                                  <div className="mt-1">No video</div>
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    fileInputRefs.current[l.id]?.click() ?? null
                                  }
                                  className="primary_btn !text-sm"
                                >
                                  Upload video
                                </button>
                                {l.content && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateLesson(i, { content: "" })
                                    }
                                    className="primary_btn white_btn !text-sm"
                                  >
                                    Remove
                                  </button>
                                )}
                                <div className="text-sm text-slate-400 ml-auto">
                                  MP4/WebM. Max: {MAX_VIDEO_MB} MB
                                </div>
                              </div>

                              <div className="mt-2">
                                {l.uploading ? (
                                  <div className="space-y-1">
                                    <div className="text-sm">
                                      Uploading — {l.uploadProgress ?? 0}%
                                    </div>
                                    {renderProgress(l.uploadProgress ?? 0)}
                                  </div>
                                ) : l.content ? (
                                  <div className="text-sm text-slate-500">
                                    Uploaded
                                  </div>
                                ) : (
                                  <div className="text-sm text-slate-400">
                                    No video selected
                                  </div>
                                )}
                              </div>

                              <input
                                ref={(el) => {
                                  fileInputRefs.current[l.id] = el;
                                }}
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleLessonFileChoose(i, f);
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <textarea
                              value={l.content}
                              onChange={(e) =>
                                updateLesson(i, { content: e.target.value })
                              }
                              rows={6}
                              className="w-full form_input bg-white"
                              placeholder="Write article content (markdown or HTML) for this lesson"
                            />
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex items-center gap-3">
                        <div>
                          <label className="text-base text-slate-600">
                            Attach a test (optional)
                          </label>
                          <select
                            value={l.testId ?? ""}
                            onChange={(e) =>
                              updateLesson(i, {
                                testId: e.target.value || null,
                              })
                            }
                            className="form_input bg-white"
                          >
                            <option value="">— none —</option>
                            {teacherTests.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="ml-auto text-sm text-slate-500">
                          Lesson preview shown above
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* submit */}
      <div className="flex items-center gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="primary_btn white_btn !py-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 rounded-md bg-gradient-to-tr from-indigo to-teal-900 text-white"
        >
          {loading ? "Saving…" : "Create course"}
        </button>
      </div>
    </form>
  );
}
