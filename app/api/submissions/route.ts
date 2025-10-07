import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";
import { getCurrentUser } from "@/lib/session";
import Test from "@/models/Test";
import Submission from "@/models/Submission";
import Groq from "groq-sdk";
import { tavily } from "@tavily/core";

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
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY! });

        // ✳️ 1. Get explanations from Groq
        const prompt = `
You are an AI tutor. Based on the student's missed questions, explain each misunderstood concept simply.
For each question, write:
- A short 2–3 sentence explanation of the correct concept.

Return your response in Markdown format:
**1. Concept Name**
Explanation (2–3 sentences)

Missed Questions:
${incorrectQuestions
  .map(
    (q, i) => `${i + 1}. ${q.question}
- Student's answer: ${q.studentAnswer}
- Correct answer: ${q.correctAnswer}`
  )
  .join("\n\n")}
`;

        const completion = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
        });

        const explanations = completion.choices[0]?.message?.content || "";

        // ✳️ 2. Get real resources from Tavily for the same concepts
        const topicsPrompt = `
List the main 3–5 concept names that the student needs to learn from these missed questions. 
Return as a JSON array like: ["Model Context Protocol", "AI Training Data"]
Missed Questions:
${incorrectQuestions.map((q) => q.question).join("\n")}
`;
        const topicsResp = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: topicsPrompt }],
        });

        let topics: string[] = [];
        try {
          topics = JSON.parse(topicsResp.choices[0]?.message?.content || "[]");
        } catch {
          topics = [];
        }

        const resourceParts: string[] = [];

        for (const topic of topics) {
          const search = await tavilyClient.search(
            `${topic} site:youtube.com OR site:medium.com OR site:coursera.org`,
            { maxResults: 3 }
          );

          const links =
            search.results
              ?.map((r: any) => `- [${r.title}](${r.url})`)
              .join("\n") || "No relevant resources found.";

          resourceParts.push(`**${topic}**\n${links}`);
        }

        feedback = `### Personalized Feedback  
Here are explanations for your missed questions:  

${explanations}

---

Here are some beginner-friendly learning resources to help you strengthen your understanding:  

${resourceParts.join("\n\n")}`;
      } catch (err) {
        console.error("AI feedback error:", err);
        feedback = "Could not generate personalized feedback.";
      }
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
