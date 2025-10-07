import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";
import { getCurrentUser } from "@/lib/session";
import Submission from "@/models/Submission";
import Groq from "groq-sdk";
import { tavily } from "@tavily/core";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();

  const submission = await Submission.findById(params.id);
  if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  // Only student owner or teacher can regenerate
  const viewerId = (user as any)._id;
  if (String(submission.studentId) !== String(viewerId) && (user as any).role !== "teacher") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  if (!submission.answers || submission.answers.length === 0)
    return NextResponse.json({ error: "No answers found to generate feedback" }, { status: 400 });

  // Regenerate feedback
  let feedback = "";
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY! });

    // prepare missed questions
    const test = await Test.findById(submission.testId).lean();
    const questions = test.questions ?? [];
    const incorrectQuestions = questions
      .map((q: any, i: number) => {
        const correctIndex = q.correctIndex ?? -1;
        if (submission.answers[i] !== correctIndex) {
          return {
            question: q.text,
            correctAnswer: q.options[correctIndex]?.text ?? "N/A",
            studentAnswer: q.options[submission.answers[i]]?.text ?? "N/A",
          };
        }
        return null;
      })
      .filter(Boolean);

    if (incorrectQuestions.length === 0) {
      feedback = "All answers correct — no feedback necessary!";
    } else {
      // run your AI feedback generation code here (Groq + Tavily)
      feedback = await generateFeedback(incorrectQuestions, groq, tavilyClient);
    }

    // update submission
    submission.feedback = feedback;
    await submission.save();

    return NextResponse.json({ ok: true, feedback });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not regenerate feedback" }, { status: 500 });
  }
}
