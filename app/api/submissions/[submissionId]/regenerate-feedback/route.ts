import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/database";
import Submission from "@/models/Submission";
import Test from "@/models/Test";
import { generateFeedback } from "@/lib/ai/generatefeedback";

export async function POST(
  req: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    await connectToDatabase();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { submissionId } = params;
    const submission = await Submission.findById(submissionId);
    if (!submission)
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    if (submission.studentId.toString() !== user._id.toString())
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 🧠 Fetch test data to rebuild context
    const test = await Test.findById(submission.testId).lean();
    if (!test)
      return NextResponse.json({ error: "Test not found" }, { status: 404 });

    const questions = test.questions ?? [];
    const answers = submission.answers ?? [];

    const incorrectQuestions = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const correctIndex = typeof q.correctIndex === "number" ? q.correctIndex : -1;
      const studentIndex = answers[i];

      if (studentIndex !== correctIndex) {
        incorrectQuestions.push({
          question: q.text,
          correctAnswer: q.options?.[correctIndex]?.text ?? "N/A",
          studentAnswer: q.options?.[studentIndex]?.text ?? "N/A",
        });
      }
    }

    if (incorrectQuestions.length === 0) {
      return NextResponse.json({
        message: "All answers are correct — no feedback to regenerate.",
      });
    }

    const newFeedback = await generateFeedback(incorrectQuestions);
    submission.feedback = newFeedback;
    await submission.save();

    return NextResponse.json({
      message: "Feedback regenerated successfully",
      feedback: newFeedback,
    });
  } catch (err: any) {
    console.error("Regenerate feedback error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to regenerate feedback" },
      { status: 500 }
    );
  }
}
