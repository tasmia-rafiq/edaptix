// app/api/tests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";
import { getCurrentUser } from "@/lib/session";
import Test from "@/models/Test";

type IncomingQuestion = {
  text?: string;
  options?: string[]; // array of option texts
  correctIndex?: number;
};

type Payload = {
  title?: string;
  description?: string;
  visibility?: "private" | "public";
  questions?: IncomingQuestion[];
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Payload;

    // server-side basic validation
    const title = (body.title || "").trim();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const questions = Array.isArray(body.questions) ? body.questions : [];
    if (questions.length === 0) {
      return NextResponse.json({ error: "At least one question is required" }, { status: 400 });
    }

    // auth: ensure teacher
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((user as any).role !== "teacher") {
      return NextResponse.json({ error: "Only teachers can create tests" }, { status: 403 });
    }

    await connectToDatabase();

    // validate questions
    const preparedQuestions = questions.map((q, qi) => {
      const text = (q.text || "").trim();
      const options = Array.isArray(q.options) ? q.options.map((o) => (o || "").trim()).filter(Boolean) : [];
      const correctIndex = typeof q.correctIndex === "number" ? q.correctIndex : -1;

      if (!text) throw new Error(`Question ${qi + 1}: text is required`);
      if (options.length < 2) throw new Error(`Question ${qi + 1}: at least 2 options required`);
      if (correctIndex < 0 || correctIndex >= options.length) {
        throw new Error(`Question ${qi + 1}: correct answer index is invalid`);
      }

      return {
        text,
        options: options.map((t) => ({ text: t })),
        correctIndex,
      };
    });

    const testDoc = new Test({
      title,
      description: (body.description || "").trim(),
      visibility: body.visibility || "private",
      createdBy: (user as any).id ?? (user as any)._id, // depends on getCurrentUser shape
      questions: preparedQuestions,
    });

    const saved = await testDoc.save();

    return NextResponse.json({ ok: true, id: (saved as any)._id.toString() }, { status: 201 });
  } catch (err: any) {
    console.error("Create test error:", err);
    const message = err?.message || "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
