import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";
import { getCurrentUser } from "@/lib/session";
import Test from "@/models/Test";
import Submission from "@/models/Submission";
import { generateFeedback } from "@/lib/ai/generatefeedback";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if ((user as any).role !== "student")
      return NextResponse.json(
        { error: "Only students can submit test" },
        { status: 403 }
      );

    const body = await req.json();
    const { testId, answers } = body ?? {};

    if (!testId)
      return NextResponse.json({ error: "Missing testId" }, { status: 400 });
    if (!Array.isArray(answers))
      return NextResponse.json(
        { error: "Answers must be an array" },
        { status: 400 }
      );

    await connectToDatabase();

    const test = await Test.findById(testId).lean();
    if (!test)
      return NextResponse.json({ error: "Test not found" }, { status: 404 });

    const total = test.questions?.length ?? 0;
    if (answers.length !== total)
      return NextResponse.json(
        { error: "Answers length mismatch", expected: total },
        { status: 400 }
      );

    type Question = {
      text: string;
      options: { text: string }[];
      correctIndex: number;
    };

    const questions = test.questions as Question[];

    let score = 0;
    const incorrectQuestions: {
      question: string;
      correctAnswer: string;
      studentAnswer: string;
    }[] = [];

    for (let i = 0; i < total; i++) {
      const q = questions[i];
      const correctIndex =
        typeof q?.correctIndex === "number" ? q.correctIndex : -1;
      if (answers[i] === correctIndex) {
        score++;
      } else {
        incorrectQuestions.push({
          question: q.text,
          correctAnswer: q.options[correctIndex]?.text ?? "N/A",
          studentAnswer: q.options[answers[i]]?.text ?? "N/A",
        });
      }
    }

    // 🧮 Track attempts
    const prevCount = await Submission.countDocuments({
      testId,
      studentId: (user as any)._id,
    });
    const attempt = prevCount + 1;
let feedback = "";
if (incorrectQuestions.length > 0) {
  feedback = await generateFeedback(incorrectQuestions);
}

    // 💾 Save submission
    const saved = await Submission.create({
      testId,
      studentId: (user as any)._id,
      answers,
      score,
      total,
      attempt,
      feedback
    });


    return NextResponse.json(
      {
        ok: true,
        submissionId: (saved as any)._id.toString(),
        score,
        total,
        attempt,
        feedback,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Submission error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
