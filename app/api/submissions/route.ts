// app/api/submissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";
import { getCurrentUser } from "@/lib/session";
import Test from "@/models/Test";
import Submission from "@/models/Submission";
import { error } from "console";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if ((user as any).role !== "student")
            return NextResponse.json({ error: "Only students can submit test" }, {
                status: 403
            })
        const body = await req.json();
        const { testId, answers } = body ?? {};

        if (!testId) return NextResponse.json({ error: "Missing testId" }, { status: 400 });
        if (!Array.isArray(answers)) return NextResponse.json({ error: "Answers must be an array" }, { status: 400 });

        await connectToDatabase();

        const test = await Test.findById(testId).lean();
        if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

        const total = (test.questions?.length ?? 0);
        if (answers.length !== total)
            return NextResponse.json({ error: "Answers length mismatch", expected: total }, { status: 400 });

         let score = 0;
    for (let i = 0; i < total; i++) {
      const q = test.questions[i];
      const correctIndex = typeof q?.correctIndex === "number" ? q.correctIndex : -1;
      if (answers[i] === correctIndex) score++;
    }
     const prevCount = await Submission.countDocuments({ testId, studentId: (user as any)._id });
    const attempt = prevCount + 1;

    const saved = await Submission.create({
      testId,
      studentId: (user as any)._id,
      answers,
      score,
      total,
      attempt,
    });
    return NextResponse.json(
      {
        ok: true,
        submissionId: (saved as any)._id.toString(),
        score,
        total,
        attempt,
      },
      { status: 201 }
    );

    }
    catch(err:any) {
        console.error("Submission error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });

    }
}