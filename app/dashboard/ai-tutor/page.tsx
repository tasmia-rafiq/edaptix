"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Mic, Send, BotMessageSquare } from "lucide-react";

export default function AiTutorPage() {
  const [messages, setMessages] = useState<{role: string; text: string}[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/aichat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.reply) {
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    //   speakText(data.reply); // text-to-speech
    }
  };

  const speakText = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
        <BotMessageSquare className="text-teal-700" /> AI Study Assistant
      </h1>

      <div className="border rounded-lg p-4 bg-white min-h-[400px] space-y-3 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`p-3 rounded-md ${msg.role === "user" ? "bg-teal-50 text-right" : "bg-slate-50 text-left"}`}>
            <ReactMarkdown
                        components={{
                          a: ({ node, ...props }) => (
                            <a
                              {...props}
                              className="text-blue-600 underline hover:text-blue-800 transition-colors"
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          ),
                        }}
                      >
{msg.text}
                      </ReactMarkdown>
            
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          className="flex-1 border rounded-md px-4 py-2"
        />
        <button onClick={handleSend} className="bg-teal text-white rounded-md px-4 py-2">
          {loading ? "..." : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
