import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";
import Test from "@/models/Test";
import { getCurrentUser } from "@/lib/session";

type UpdatePayload = {
  title?: string;
  description?: string;
  visibility?: "private" | "public";
  questions?: { text?: string; options?: string[]; correctIndex?: number }[];
};

function splitAndTrimArray(arr?: any) {
  if (!Array.isArray(arr)) return undefined;
  return arr.map((s) => (typeof s === "string" ? s.trim() : s)).filter(Boolean);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[parts.length - 1]; // last segment is id

    await connectToDatabase();
    const test = await Test.findById(id).lean();
    if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // return test (safe to return questions/options)
    return NextResponse.json(test);
  } catch (err: any) {
    console.error("GET test error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[parts.length - 1];

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const existing = await Test.findById(id) as import("mongoose").Document & { _id: any, title?: string, description?: string, visibility?: string, questions?: any, createdBy?: any };
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // only owner can edit
    const ownerId = existing.createdBy?.toString?.();
    const userId = (user as any).id ?? (user as any)._id;
    if (!ownerId || String(ownerId) !== String(userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as UpdatePayload;
    const title = (body.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const questionsIn = Array.isArray(body.questions) ? body.questions : [];
    if (questionsIn.length === 0) {
      return NextResponse.json({ error: "At least one question is required" }, { status: 400 });
    }

    // validate questions
    const prepared = questionsIn.map((q, qi) => {
      const text = (q.text ?? "").trim();
      const options = Array.isArray(q.options) ? q.options.map((o) => (typeof o === "string" ? o.trim() : "")).filter(Boolean) : [];
      const correctIndex = typeof q.correctIndex === "number" ? q.correctIndex : -1;

      if (!text) throw new Error(`Question ${qi + 1}: text required`);
      if (options.length < 2) throw new Error(`Question ${qi + 1}: at least 2 options required`);
      if (correctIndex < 0 || correctIndex >= options.length) throw new Error(`Question ${qi + 1}: invalid correctIndex`);

      return { text, options: options.map((t) => ({ text: t })), correctIndex };
    });

    existing.title = title;
    existing.description = (body.description ?? "").trim();
    existing.visibility = body.visibility === "public" ? "public" : "private";
    existing.questions = prepared as any;

    await existing.save();

    return NextResponse.json({ ok: true, id: existing._id.toString() });
  } catch (err: any) {
    console.error("PUT test error", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
