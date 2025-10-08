import { NextRequest, NextResponse } from "next/server";
import { multimodalClient } from "@/lib/ai/multimodalClient";

export async function POST(req: NextRequest) {
  try {
    const { message, image } = await req.json();

    if (!message && !image) {
      return NextResponse.json(
        { error: "Message or image input required" },
        { status: 400 }
      );
    }

    const chatMessages: any[] = [
      {
        role: "system",
        content:
          "You are an educational AI assistant that helps students understand concepts simply.",
      },
      {
        role: "user",
        content: message ? [{ type: "text", text: message }] : [],
      },
    ];

    if (image) {
      chatMessages[1].content.push({
        type: "image_url",
        image_url: image,
      });
    }

    const response = await multimodalClient.chat.completions.create({
      model: "openai/gpt-4.1-nano-2025-04-14",
      messages: chatMessages,
      temperature: 0.7,
      top_p: 0.7,
      frequency_penalty: 1,
      max_tokens: 300,
    });

    // ✅ Extract the actual text from structured response
    const content = response.choices?.[0]?.message?.content;
    let reply = "I couldn't generate a response.";

    if (Array.isArray(content)) {
      const textPart = content.find(c => c.type === "text");
      reply = textPart?.text || reply;
    } else if (typeof content === "string") {
      reply = content;
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
