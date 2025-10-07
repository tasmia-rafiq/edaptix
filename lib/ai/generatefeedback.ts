import Groq from "groq-sdk";
import { tavily } from "@tavily/core";

export type IncorrectQuestion = {
  question: string;
  correctAnswer: string;
  studentAnswer: string;
};

/**
 * Generates personalized AI feedback using Groq + Tavily.
 * Returns Markdown-formatted feedback string.
 */
export async function generateFeedback(incorrectQuestions: IncorrectQuestion[]): Promise<string> {
  if (incorrectQuestions.length === 0) {
    return "✅ All answers were correct! No feedback needed.";
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY! });

    // ✳️ Step 1: Generate explanations with Groq
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

    // ✳️ Step 2: Extract key topics
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

    // ✳️ Step 3: Get resources from Tavily
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

    // ✳️ Step 4: Combine into final Markdown
    const feedback = `### Personalized Feedback  
Here are explanations for your missed questions:  

${explanations}

---

Here are some beginner-friendly learning resources to help you strengthen your understanding:  

${resourceParts.join("\n\n")}`;

    return feedback;
  } catch (err) {
    console.error("AI feedback generation error:", err);
    return "⚠️ Could not generate personalized feedback.";
  }
}
