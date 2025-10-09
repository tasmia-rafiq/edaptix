"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send, BotMessageSquare, VolumeX, Volume2 } from "lucide-react";

export default function AiTutorClient() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

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
      credentials: "include",
    });

    const data = await res.json();
    setLoading(false);

    if (data.reply) {
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
      if (voiceEnabled) speakText(data.reply);
    }
  };

  const speakText = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text);
     utter.rate = 1;
    utter.pitch = 1;
    utter.volume = 1;
    window.speechSynthesis.speak(utter);
    
  };

  const toggleVoice  = () =>{
    setVoiceEnabled((prev)=>{
      if (prev) window.speechSynthesis.cancel();
      return !prev;
    });
  };


  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex justify-between items-center">      
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
        <BotMessageSquare className="text-teal-700" /> AI Study Assistant
      </h1>

      <button onClick={toggleVoice} className={`p-2 rounded full border transition ${voiceEnabled?
        "bg-teal-600 text-white hover:bg-teal-700"
        :"bg-teal-600 text-white hover:bg-teal-700"
      }`} title={voiceEnabled?"Disable Voice":"Enable Voice"}>
        {voiceEnabled?<Volume2 size={20}/>:<VolumeX size={20}/>}


      </button>
</div>


      <div className="border rounded-lg p-4 bg-white min-h-[400px] space-y-3 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-md ${
              msg.role === "user"
                ? "bg-teal-50 text-right"
                : "bg-slate-50 text-left"
            }`}
          >
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          </div>
        ))}

        {loading && <p className="text-gray-500 italic">Thinking...</p>}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          className="flex-1 border rounded-md px-4 py-2"
        />
        <button
          onClick={handleSend}
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-md px-4 py-2"
          disabled={loading}
        >
          {loading ? "..." : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
