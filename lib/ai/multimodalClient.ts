// lib/ai/multimodalClient.ts
import OpenAI from "openai";

export const multimodalClient = new OpenAI({
  baseURL: "https://api.aimlapi.com/v1",
  apiKey: process.env.AIML_API_KEY!, // store this in .env.local
});
