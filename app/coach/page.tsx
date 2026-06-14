"use client";

import { useState } from "react";
import { Bot, Send, UserRound } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";

type Message = { role: "user" | "coach"; content: string };

const examples = [
  "What should I focus on today?",
  "Should I train today?",
  "Am I behind on anything?",
  "What is my biggest priority?",
  "How is my week looking?"
];

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "coach", content: "Ask me about your day, training, school, money, goals, or schedule. Version 1 uses Life OS data and deterministic rules only." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(text = input) {
    const message = text.trim();
    if (!message || loading) return;

    setMessages((items) => [...items, { role: "user", content: message }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const data = (await response.json()) as { ok: boolean; reply?: string; error?: string };
      setMessages((items) => [...items, { role: "coach", content: data.ok && data.reply ? data.reply : `I could not answer that yet${data.error ? `: ${data.error}` : ""}.` }]);
    } catch {
      setMessages((items) => [...items, { role: "coach", content: "I could not reach the coach service. Try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SectionHeader eyebrow="Coach" title="Life OS Coach" />
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <section className="flex min-h-[620px] flex-col rounded-lg border border-ink/10 bg-white shadow-soft">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((message, index) => <ChatBubble key={`${message.role}-${index}`} message={message} />)}
            {loading ? <ChatBubble message={{ role: "coach", content: "Thinking through your Life OS data..." }} muted /> : null}
          </div>
          <div className="border-t border-ink/10 p-4">
            <div className="flex gap-2">
              <textarea
                className="focus-ring min-h-12 flex-1 resize-none rounded-md border border-ink/15 px-3 py-2 text-sm"
                placeholder="Ask your coach..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
              />
              <button onClick={() => sendMessage()} disabled={loading} className="focus-ring grid size-12 shrink-0 place-items-center rounded-md bg-ink text-white disabled:cursor-not-allowed disabled:opacity-60" aria-label="Send message">
                <Send className="size-5" />
              </button>
            </div>
          </div>
        </section>

        <aside className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-bold">Example prompts</h2>
          <div className="space-y-2">
            {examples.map((example) => (
              <button key={example} onClick={() => sendMessage(example)} className="focus-ring w-full rounded-md border border-ink/10 px-3 py-2 text-left text-sm font-semibold text-ink/70 hover:bg-mint hover:text-ink">
                {example}
              </button>
            ))}
          </div>
          <p className="mt-5 rounded-md bg-[#f7f8f4] p-3 text-sm leading-6 text-ink/60">The coach knows connected Life OS data only: WHOOP, habits, school, finances, goals, and calendar. It does not use OpenAI in Version 1.</p>
        </aside>
      </div>
    </>
  );
}

function ChatBubble({ message, muted = false }: { message: Message; muted?: boolean }) {
  const isUser = message.role === "user";
  const Icon = isUser ? UserRound : Bot;
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? <IconBox icon={Icon} /> : null}
      <div className={`max-w-[820px] whitespace-pre-line rounded-lg px-4 py-3 text-sm leading-6 ${isUser ? "bg-ink text-white" : muted ? "bg-[#f7f8f4] text-ink/55" : "bg-mint text-ink/75"}`}>
        {message.content}
      </div>
      {isUser ? <IconBox icon={Icon} /> : null}
    </div>
  );
}

function IconBox({ icon: Icon }: { icon: typeof Bot }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-white text-moss ring-1 ring-ink/10">
      <Icon className="size-4" />
    </span>
  );
}
